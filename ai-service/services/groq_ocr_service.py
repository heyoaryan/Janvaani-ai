# services/groq_ocr_service.py
# Document analysis pipeline:
#   1. pytesseract / Pillow  — extract raw text from image/PDF
#   2. Groq LLM (text model) — parse raw text into structured fields + classify doc type
#   3. _build_result          — apply name-match checks and produce final status

import io
import os
import re
import json
import unicodedata
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

log = logging.getLogger("janvaani-ai")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

# Text models available on Groq (no vision needed — we pass OCR text)
GROQ_TEXT_MODELS = [
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "allam-2-7b",
]

# ── OCR: extract raw text from image/PDF bytes ────────────────────────────────

def _ocr_image_bytes(image_bytes: bytes) -> str:
    """Run pytesseract on raw image bytes. Returns empty string on failure."""
    try:
        from PIL import Image
        import pytesseract
        img = Image.open(io.BytesIO(image_bytes))
        # Try English only (Hindi pack rarely installed); Aadhaar cards have English text
        text = pytesseract.image_to_string(img, lang="eng", config="--psm 6")
        return text.strip()
    except Exception as e:
        log.warning(f"[ocr] pytesseract failed: {e}")
        return ""


def _ocr_pdf_bytes(pdf_bytes: bytes) -> str:
    """Convert first PDF page to image then OCR it."""
    try:
        from pdf2image import convert_from_bytes
        images = convert_from_bytes(pdf_bytes, dpi=200, first_page=1, last_page=1)
        if images:
            buf = io.BytesIO()
            images[0].save(buf, format="PNG")
            return _ocr_image_bytes(buf.getvalue())
    except Exception as e:
        log.warning(f"[ocr] pdf2image failed: {e}")
    return ""


def extract_raw_text(file_bytes: bytes, file_name: str) -> str:
    """Dispatch to PDF or image OCR based on file extension."""
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
    if ext == "pdf":
        # Try text-layer first (e-Aadhaar PDFs have selectable text)
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            text = " ".join(p.extract_text() or "" for p in reader.pages).strip()
            if len(text) > 30:
                log.info(f"[ocr] PDF text-layer extracted ({len(text)} chars)")
                return text
        except Exception:
            pass
        return _ocr_pdf_bytes(file_bytes)
    return _ocr_image_bytes(file_bytes)


# ── Document type metadata ────────────────────────────────────────────────────

DOC_TYPE_HINTS = {
    "aadhaar":            "Aadhaar Card (UIDAI) — 12-digit UID, name, DOB, gender, address",
    "pan":                "PAN Card — 10-char alphanumeric PAN, name, DOB",
    "income-certificate": "Income Certificate — annual income, issued by Tehsil/SDM",
    "student-id":         "Student ID Card — institution, course, roll number",
    "bank-passbook":      "Bank Passbook — account number, IFSC, branch, holder name",
    "ration-card":        "Ration Card — head of family, members list, category (APL/BPL)",
    "land-proof":         "Land Record / Khata / Khatauni — owner name, survey number, area",
    "land-records":       "Land Records — revenue record, patwari office",
    "age-proof":          "Age Proof / Birth Certificate — date of birth, place of birth",
    "birth-certificate":  "Birth Certificate — child name, DOB, parent names",
    "caste-certificate":  "Caste Certificate — caste, category (SC/ST/OBC)",
    "disability-certificate": "Disability Certificate — type of disability, percentage",
    "bpl-certificate":    "BPL Certificate — below poverty line status",
    "project-report":     "Project Report — business plan, investment details",
    "incorporation-cert": "Certificate of Incorporation — CIN, company name",
    "business-plan":      "Business Plan — startup plan, funding ask",
    "maternal-card":      "Maternal Health / ANC Card — antenatal care record",
    "sowing-certificate": "Sowing Certificate — crop, area, season, patwari seal",
}

VALID_DOC_TYPES = list(DOC_TYPE_HINTS.keys()) + ["unknown"]


# ── Groq: parse raw OCR text into structured fields ──────────────────────────

def _build_parse_prompt(ocr_text: str, hint: str, profile_name: str, file_name: str) -> str:
    hint_line = f"\nExpected document type: {DOC_TYPE_HINTS.get(hint, hint)}" if hint else ""
    profile_line = f"\nApplicant's registered name: '{profile_name}'" if profile_name else ""
    ocr_section = ocr_text[:2000] if ocr_text else "(no text could be extracted from the image)"

    return f"""You are a document verification assistant for Indian government scheme applications.
Below is raw text extracted from a scanned document (via OCR). The text may have OCR errors.
File name: {file_name}{hint_line}{profile_line}

--- RAW OCR TEXT ---
{ocr_section}
--- END ---

Analyse the text and return ONLY a valid JSON object with these exact keys:
{{
  "documentType": "<one of: {' | '.join(VALID_DOC_TYPES)}>",
  "documentLabel": "<human-readable document name>",
  "extractedFields": {{
    "name": "<full name as it appears in the document, or null>",
    "dateOfBirth": "<DD/MM/YYYY format, or null>",
    "gender": "<male or female or other, or null>",
    "aadhaarNumber": "<show as XXXX XXXX NNNN with last 4 digits visible, or null>",
    "panNumber": "<10-character PAN, or null>",
    "accountNumber": "<bank account number, or null>",
    "ifsc": "<IFSC code, or null>",
    "annualIncome": "<income amount as string, or null>",
    "address": "<full address if visible, or null>",
    "fatherName": "<father or guardian name, or null>",
    "issuedBy": "<issuing authority, or null>",
    "issueDate": "<date of issue, or null>",
    "validUntil": "<expiry date if present, or null>"
  }},
  "confidence": <0.0 to 1.0 based on how clearly the text was readable>,
  "isReadable": <true if at least name and one other field were extracted, false otherwise>,
  "nameMismatch": <true if the name in the document clearly differs from the applicant name provided, false if it matches, null if no applicant name was given>,
  "nameMismatchDetail": "<brief explanation only if nameMismatch is true, otherwise null>"
}}

Rules:
- Return ONLY the JSON. No markdown fences, no explanation text outside the JSON.
- If OCR text is empty or gibberish, set isReadable to false and confidence to 0.1.
- For Aadhaar: documentType must be "aadhaar". The 12-digit number appears as groups of 4 digits.
- nameMismatch is null when no applicant name was provided."""


async def _call_groq_parse(prompt: str) -> dict:
    """Call Groq text model to parse OCR text into structured JSON."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    last_err = None
    for model in GROQ_TEXT_MODELS:
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"},
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(GROQ_ENDPOINT, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
        except Exception as e:
            log.warning(f"[groq_parse] model {model} failed: {e}")
            last_err = e
    raise last_err or RuntimeError("All Groq models failed")


# ── Name normalisation helpers ────────────────────────────────────────────────

def _normalise_name(name: str) -> str:
    name = unicodedata.normalize("NFKD", name)
    name = re.sub(r"[^\w\s]", "", name)
    return re.sub(r"\s+", " ", name).strip().lower()


def _name_tokens(name: str) -> set:
    stopwords = {"mr", "mrs", "ms", "dr", "sh", "shri", "smt", "kumari", "kumar", "late", "s/o", "d/o", "w/o"}
    return set(_normalise_name(name).split()) - stopwords - {""}


def _jaccard(a: str, b: str) -> float:
    ta, tb = _name_tokens(a), _name_tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


# ── Cross-document field consistency ─────────────────────────────────────────

# Fields that should match across documents when both are present
# (field_key, match_type)  match_type: 'jaccard' | 'exact' | 'dob'
CROSS_FIELDS = [
    ("name",        "jaccard"),
    ("dateOfBirth", "dob"),
    ("gender",      "exact"),
    ("fatherName",  "jaccard"),
]


def _normalise_dob(dob: str) -> str:
    """Normalise DOB to DD/MM/YYYY regardless of separator."""
    return re.sub(r"[.\-]", "/", (dob or "").strip())


def _compare_field(key: str, val_a: str, val_b: str, match_type: str) -> float:
    """Return similarity 0-1 for two field values."""
    if not val_a or not val_b:
        return 1.0  # missing = no conflict
    if match_type == "jaccard":
        return _jaccard(val_a, val_b)
    elif match_type == "dob":
        return 1.0 if _normalise_dob(val_a) == _normalise_dob(val_b) else 0.0
    elif match_type == "exact":
        return 1.0 if val_a.strip().lower() == val_b.strip().lower() else 0.0
    return 1.0


def check_cross_doc_fields(doc_results: list) -> dict:
    """
    Compare extracted fields (name, DOB, gender, fatherName) across all
    verified documents. Returns:
      {
        consistent: bool,
        fieldMismatches: [
          {
            field, docA, valueA, docB, valueB,
            similarity, severity,
            message, messageHi
          }
        ],
        summary, summaryHi
      }
    """
    # Only include docs that have at least one extracted field
    docs = [d for d in doc_results if d.get("extractedFields")]

    field_mismatches = []

    for i in range(len(docs)):
        for j in range(i + 1, len(docs)):
            da, db = docs[i], docs[j]
            fields_a = da.get("extractedFields") or {}
            fields_b = db.get("extractedFields") or {}
            id_a = da.get("id", da.get("type", f"doc{i}"))
            id_b = db.get("id", db.get("type", f"doc{j}"))

            for field, match_type in CROSS_FIELDS:
                val_a = (fields_a.get(field) or "").strip()
                val_b = (fields_b.get(field) or "").strip()
                if not val_a or not val_b:
                    continue  # can't compare if one side is missing

                sim = _compare_field(field, val_a, val_b, match_type)

                if field == "name":
                    threshold_warn  = 0.85
                    threshold_error = 0.50
                else:
                    threshold_warn  = 1.0   # DOB/gender/fatherName must be exact
                    threshold_error = 0.50

                if sim < threshold_error:
                    severity = "error"
                elif sim < threshold_warn:
                    severity = "warning"
                else:
                    continue  # fields match — no issue

                field_labels = {
                    "name": "Name", "dateOfBirth": "Date of Birth",
                    "gender": "Gender", "fatherName": "Father/Guardian Name",
                }
                field_labels_hi = {
                    "name": "नाम", "dateOfBirth": "जन्म तिथि",
                    "gender": "लिंग", "fatherName": "पिता/अभिभावक का नाम",
                }
                flabel    = field_labels.get(field, field)
                flabel_hi = field_labels_hi.get(field, field)

                field_mismatches.append({
                    "field":      field,
                    "fieldLabel": flabel,
                    "docA":       id_a,
                    "valueA":     val_a,
                    "docB":       id_b,
                    "valueB":     val_b,
                    "similarity": round(sim, 2),
                    "severity":   severity,
                    "message": (
                        f"{flabel} mismatch: '{id_a}' has '{val_a}' "
                        f"but '{id_b}' has '{val_b}'. "
                        f"{'This will likely cause application rejection.' if severity == 'error' else 'Please verify before applying.'}"
                    ),
                    "messageHi": (
                        f"{flabel_hi} में अंतर: '{id_a}' में '{val_a}' "
                        f"लेकिन '{id_b}' में '{val_b}'। "
                        f"{'इससे आवेदन अस्वीकार हो सकता है।' if severity == 'error' else 'आवेदन से पहले जाँचें।'}"
                    ),
                })

    has_error = any(m["severity"] == "error" for m in field_mismatches)

    if not field_mismatches:
        summary   = "All document fields are consistent."
        summaryHi = "सभी दस्तावेज़ों की जानकारी एक समान है।"
    elif has_error:
        summary   = "Critical field mismatches found. Application may be rejected."
        summaryHi = "दस्तावेज़ों में महत्वपूर्ण अंतर मिले। आवेदन अस्वीकार हो सकता है।"
    else:
        summary   = "Minor field variations found. Please verify before applying."
        summaryHi = "दस्तावेज़ों में छोटे अंतर हैं। आवेदन से पहले जाँचें।"

    return {
        "consistent":      not has_error,
        "fieldMismatches": field_mismatches,
        "summary":         summary,
        "summaryHi":       summaryHi,
    }


def check_cross_doc_names(doc_results: list) -> dict:
    """Backwards-compat wrapper — name-only check via check_cross_doc_fields."""
    result = check_cross_doc_fields(doc_results)
    name_mismatches = [m for m in result["fieldMismatches"] if m["field"] == "name"]
    # Build old-shape response
    doc_names = {}
    for doc in doc_results:
        n = (doc.get("extractedFields") or {}).get("name")
        if n:
            doc_names[doc.get("id", doc.get("type", ""))] = n

    return {
        "consistent":  not any(m["severity"] == "error" for m in name_mismatches),
        "names":       doc_names,
        "mismatches":  [
            {
                "docA": m["docA"], "nameA": m["valueA"],
                "docB": m["docB"], "nameB": m["valueB"],
                "similarity": m["similarity"],
                "message":    m["message"],
                "messageHi":  m["messageHi"],
            }
            for m in name_mismatches
        ],
        "summary":   result["summary"],
        "summaryHi": result["summaryHi"],
        # Full field mismatches for new callers
        "fieldMismatches": result["fieldMismatches"],
    }


# ── Main entry point ──────────────────────────────────────────────────────────

async def analyse_document_with_groq(
    file_bytes: bytes,
    file_name: str,
    hint: str = "",
    profile_name: str = "",
) -> dict:
    """
    Pipeline:
      1. pytesseract OCR  → raw text
      2. Groq text model  → structured JSON fields
      3. _build_result    → status + warnings
    """
    if not GROQ_API_KEY or GROQ_API_KEY.startswith("your_"):
        return _fallback_no_key(file_name, hint)

    # Step 1 — OCR
    ocr_text = extract_raw_text(file_bytes, file_name) if file_bytes else ""
    log.info(f"[ocr] extracted {len(ocr_text)} chars from {file_name}")

    # Step 2 — Groq parse
    prompt = _build_parse_prompt(ocr_text, hint, profile_name, file_name)
    try:
        groq_result = await _call_groq_parse(prompt)
    except Exception as e:
        log.error(f"[groq_parse] all models failed: {e}")
        # If Groq fails but we have OCR text, do a local keyword parse
        groq_result = _local_keyword_parse(ocr_text, hint, file_name)

    log.info(
        f"[groq_ocr] file={file_name} type={groq_result.get('documentType')} "
        f"readable={groq_result.get('isReadable')} nm={groq_result.get('nameMismatch')} "
        f"conf={groq_result.get('confidence')}"
    )

    return _build_result(groq_result, hint, profile_name, file_name)


# ── Local keyword fallback (no Groq) ─────────────────────────────────────────

KEYWORD_MAP = {
    "aadhaar":            ["aadhaar", "aadhar", "uidai", "unique identification", "आधार"],
    "pan":                ["permanent account number", "pan card", "income tax department"],
    "income-certificate": ["income certificate", "annual income", "tehsil", "sdm"],
    "student-id":         ["student", "college", "roll number", "enrollment"],
    "bank-passbook":      ["passbook", "savings account", "ifsc", "branch"],
    "ration-card":        ["ration card", "राशन", "food & civil", "bpl", "apl"],
    "land-proof":         ["khata", "khatauni", "patta", "land record", "patwari"],
    "birth-certificate":  ["birth certificate", "date of birth", "municipal"],
    "caste-certificate":  ["caste certificate", "sc/st", "obc", "जाति"],
    "disability-certificate": ["disability", "divyang", "दिव्यांग"],
}


def _local_keyword_parse(ocr_text: str, hint: str, file_name: str, profile_name: str = "") -> dict:
    """Keyword-based fallback when Groq is unavailable."""
    combined = f"{file_name} {hint} {ocr_text}".lower()
    doc_type = "unknown"
    for dtype, keywords in KEYWORD_MAP.items():
        if any(k in combined for k in keywords):
            doc_type = dtype
            break
    if hint and doc_type == "unknown":
        doc_type = hint  # trust the hint

    # Simple regex field extraction from OCR text
    fields: dict = {}
    if ocr_text:
        m = re.search(r"\b(\d{4}\s?\d{4}\s?\d{4})\b", ocr_text)
        if m:
            fields["aadhaarNumber"] = m.group(1)
        m = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", ocr_text)
        if m:
            fields["panNumber"] = m.group(1)
        m = re.search(r"\b(\d{2}[/\-]\d{2}[/\-]\d{4})\b", ocr_text)
        if m:
            fields["dateOfBirth"] = m.group(1)
        m = re.search(r"\b([A-Z]{4}0[A-Z0-9]{6})\b", ocr_text)
        if m:
            fields["ifsc"] = m.group(1)
        m = re.search(r"(?:name|नाम)[:\s]+([A-Za-z ]{4,40})", ocr_text, re.IGNORECASE)
        if m:
            fields["name"] = m.group(1).strip()

    readable = bool(ocr_text and len(ocr_text) > 20)

    # Compute nameMismatch locally using Jaccard (covers Groq-down scenario)
    doc_name = fields.get("name", "")
    nm = None
    if profile_name and doc_name:
        sim = _jaccard(doc_name, profile_name)
        nm = sim < 0.85  # True = mismatch, False = match

    return {
        "documentType": doc_type,
        "documentLabel": DOC_TYPE_HINTS.get(doc_type, "Document").split(" — ")[0],
        "extractedFields": fields,
        "confidence": 0.5 if readable else 0.2,
        "isReadable": readable,
        "nameMismatch": nm,
        "nameMismatchDetail": None,
    }


# ── Result builder ────────────────────────────────────────────────────────────

def _build_result(groq: dict, hint: str, profile_name: str, file_name: str) -> dict:
    doc_type  = groq.get("documentType") or "unknown"
    label     = groq.get("documentLabel") or "Unknown Document"
    fields    = groq.get("extractedFields") or {}
    conf      = float(groq.get("confidence") or 0.5)
    readable  = groq.get("isReadable")
    nm        = groq.get("nameMismatch")
    nm_detail = (groq.get("nameMismatchDetail") or "").strip()

    # Default isReadable to True if field missing — don't penalise on absent field
    if readable is None:
        readable = True

    warnings = []
    doc_name = (fields.get("name") or "").strip()

    # ── 1. Unreadable image ───────────────────────────────────────────────────
    if not readable:
        warnings.append({
            "type": "UNREADABLE",
            "message": "Document image is unclear. Please upload a better quality photo.",
            "messageHi": "दस्तावेज़ की फ़ोटो अस्पष्ट है। साफ़ फ़ोटो अपलोड करें।",
            "severity": "error",
        })
        return {
            "type": doc_type, "label": label, "confidence": round(conf, 2),
            "extractedFields": {}, "warnings": warnings,
            "status": "error",
            "statusMessage":   "Cannot read document. Please upload a clearer image.",
            "statusMessageHi": "दस्तावेज़ पढ़ा नहीं जा सका। साफ़ फ़ोटो अपलोड करें।",
            "typeMatch": True, "fileName": file_name,
            "engine": "ocr+groq", "analyzedAt": datetime.now(timezone.utc).isoformat(),
        }

    # ── 2. Wrong document type ────────────────────────────────────────────────
    if hint and doc_type not in ("unknown", hint):
        from data.documents import DOCUMENT_TYPES as _DT
        expected_label = _DT.get(hint, {}).get("label", hint)
        found_label    = _DT.get(doc_type, {}).get("label", doc_type)
        warnings.append({
            "type": "WRONG_DOCUMENT",
            "message": f"Wrong document. Expected '{expected_label}' but got '{found_label}'.",
            "messageHi": f"गलत दस्तावेज़। '{expected_label}' चाहिए था, '{found_label}' मिला।",
            "severity": "error",
        })
        return {
            "type": doc_type, "label": label, "confidence": round(conf, 2),
            "extractedFields": {k: v for k, v in fields.items() if v is not None},
            "warnings": warnings,
            "status": "wrong_document",
            "statusMessage":   f"Wrong document. Expected: {expected_label}.",
            "statusMessageHi": f"गलत दस्तावेज़। चाहिए: {expected_label}।",
            "typeMatch": False, "fileName": file_name,
            "engine": "ocr+groq", "analyzedAt": datetime.now(timezone.utc).isoformat(),
        }

    # ── 3. Name mismatch vs profile ───────────────────────────────────────────
    if profile_name and doc_name:
        if nm is True:
            sim = _jaccard(doc_name, profile_name)
            warnings.append({
                "type": "NAME_MISMATCH",
                "message": nm_detail or f"Name on document ('{doc_name}') differs from profile name ('{profile_name}').",
                "messageHi": (
                    f"दस्तावेज़ में नाम '{doc_name}' और प्रोफाइल में '{profile_name}' अलग हैं। "
                    "इससे योजना आवेदन में दिक्कत आ सकती है।"
                ),
                "severity": "error" if sim < 0.5 else "warning",
            })
        elif nm is False:
            sim = _jaccard(doc_name, profile_name)
            if sim < 0.5:
                # LLM said no mismatch but tokens are very different — trust Jaccard
                warnings.append({
                    "type": "NAME_MISMATCH",
                    "message": f"Name on document ('{doc_name}') appears different from profile name ('{profile_name}'). Please verify.",
                    "messageHi": (
                        f"दस्तावेज़ में नाम '{doc_name}' और प्रोफाइल में '{profile_name}' काफ़ी अलग हैं। "
                        "कृपया जाँचें।"
                    ),
                    "severity": "error",
                })
            elif sim < 0.85:
                warnings.append({
                    "type": "NAME_PARTIAL",
                    "message": f"Minor name variation: document has '{doc_name}', profile has '{profile_name}'.",
                    "messageHi": (
                        f"नाम में थोड़ा अंतर: दस्तावेज़ में '{doc_name}', प्रोफाइल में '{profile_name}'। "
                        "हो सकता है सरनेम बदला हो।"
                    ),
                    "severity": "warning",
                })
        # nm is None → no profile name given to Groq; still run our own Jaccard
        elif nm is None:
            sim = _jaccard(doc_name, profile_name)
            if sim < 0.5:
                warnings.append({
                    "type": "NAME_MISMATCH",
                    "message": f"Name on document ('{doc_name}') does not match profile name ('{profile_name}').",
                    "messageHi": (
                        f"दस्तावेज़ में नाम '{doc_name}' और प्रोफाइल में '{profile_name}' मेल नहीं खाते।"
                    ),
                    "severity": "error",
                })
            elif sim < 0.85:
                warnings.append({
                    "type": "NAME_PARTIAL",
                    "message": f"Minor name variation between document ('{doc_name}') and profile ('{profile_name}').",
                    "messageHi": (
                        f"नाम में थोड़ा अंतर: दस्तावेज़ में '{doc_name}', प्रोफाइल में '{profile_name}'।"
                    ),
                    "severity": "warning",
                })

    # ── 4. Final status ───────────────────────────────────────────────────────
    has_error   = any(w["severity"] == "error"   for w in warnings)
    has_warning = any(w["severity"] == "warning" for w in warnings)

    if has_error:
        status          = "error"
        statusMessage   = "Document has issues that need to be resolved."
        statusMessageHi = "दस्तावेज़ में कुछ गड़बड़ी है।"
    elif has_warning:
        status          = "warning"
        statusMessage   = "Document accepted with minor issues. Please review."
        statusMessageHi = "दस्तावेज़ स्वीकृत, लेकिन कुछ छोटी समस्याएं हैं।"
    else:
        status          = "verified"
        statusMessage   = "Document verified successfully."
        statusMessageHi = "दस्तावेज़ सफलतापूर्वक सत्यापित हुआ ✓"

    return {
        "type":            doc_type,
        "label":           label,
        "confidence":      round(conf, 2),
        "extractedFields": {k: v for k, v in fields.items() if v is not None},
        "warnings":        warnings,
        "status":          status,
        "statusMessage":   statusMessage,
        "statusMessageHi": statusMessageHi,
        "typeMatch":       (not hint) or (doc_type == hint),
        "fileName":        file_name,
        "engine":          "ocr+groq",
        "analyzedAt":      datetime.now(timezone.utc).isoformat(),
    }


# ── Fallbacks ─────────────────────────────────────────────────────────────────

def _fallback_no_key(file_name: str, hint: str) -> dict:
    return {
        "type": hint or "unknown", "label": hint or "Unknown",
        "confidence": 0.0, "extractedFields": {},
        "warnings": [{
            "type": "NO_API_KEY",
            "message": "Groq API key not configured.",
            "messageHi": "Groq API key सेट नहीं है।",
            "severity": "error",
        }],
        "status": "error",
        "statusMessage":   "Verification unavailable — API key missing.",
        "statusMessageHi": "सत्यापन उपलब्ध नहीं — API key नहीं है।",
        "typeMatch": True, "fileName": file_name,
        "engine": "none", "analyzedAt": datetime.now(timezone.utc).isoformat(),
    }
