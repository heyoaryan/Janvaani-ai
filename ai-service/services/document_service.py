# services/document_service.py
# Document analysis via Groq vision + cross-doc name consistency checks.

from datetime import datetime, timezone
from data.documents import DOCUMENT_TYPES, SAMPLE_UPLOADED_DOCUMENTS
from services.scheme_service import get_scheme_by_id
from services.groq_ocr_service import check_cross_doc_names  # re-export for routes


# ── Scheme document matching ──────────────────────────────────────────────────

def check_documents_for_scheme(scheme_id: str, user_documents: list) -> dict:
    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise ValueError("Scheme not found")

    required   = scheme.get("requiredDocuments", [])
    have_types = {d.get("type") for d in user_documents}
    satisfied, missing = [], []

    for doc_key in required:
        meta = DOCUMENT_TYPES.get(doc_key, {"label": doc_key, "howToGet": "", "description": ""})
        if doc_key in have_types:
            matched = next((d for d in user_documents if d.get("type") == doc_key), {})
            satisfied.append({
                "key":             doc_key,
                "label":           meta.get("label", doc_key),
                "extractedFields": matched.get("extractedFields", {}),
                "warnings":        matched.get("warnings", []),
                "status":          matched.get("status", "verified"),
            })
        else:
            missing.append({
                "key":         doc_key,
                "label":       meta.get("label", doc_key),
                "description": meta.get("description", ""),
                "howToGet":    meta.get("howToGet", ""),
            })

    name_consistency = check_cross_doc_names(user_documents)

    return {
        "schemeId":        scheme_id,
        "schemeName":      scheme["name"],
        "satisfied":       satisfied,
        "missing":         missing,
        "nameConsistency": name_consistency,
    }


def get_missing_documents(scheme_id: str, user_documents: list) -> dict:
    result = check_documents_for_scheme(scheme_id, user_documents)
    return {
        **result,
        "hasAll": len(result["missing"]) == 0,
        "guidance": (
            "सभी आवश्यक दस्तावेज़ उपलब्ध हैं। आप आवेदन कर सकते हैं।"
            if len(result["missing"]) == 0
            else "कुछ दस्तावेज़ अभी लापता हैं। नीचे दिए गए तरीके से प्राप्त करें।"
        ),
    }


# ── Keyword-only compatibility path for the /upload JSON endpoint ─────────────

def _keyword_classify(file_name: str, hint: str) -> str:
    KEYWORD_MAP = {
        "aadhaar":            ["aadhaar", "aadhar", "uidai", "आधार"],
        "pan":                ["pan", "permanent account"],
        "income-certificate": ["income", "आय"],
        "student-id":         ["student", "college", "roll"],
        "bank-passbook":      ["passbook", "bank", "account"],
        "ration-card":        ["ration", "राशन"],
        "land-proof":         ["khata", "land", "patta", "खसरा"],
        "age-proof":          ["birth", "age", "जन्म"],
        "birth-certificate":  ["birth certificate", "janm"],
        "caste-certificate":  ["caste", "जाति"],
        "disability-certificate": ["disability", "दिव्यांग"],
        "bpl-certificate":    ["bpl", "below poverty"],
        "project-report":     ["project", "परियोजना"],
        "incorporation-cert": ["incorporation", "cin"],
        "business-plan":      ["business plan", "funding"],
        "maternal-card":      ["maternal", "anc", "गर्भ"],
        "sowing-certificate": ["sowing", "crop", "बुवाई"],
    }
    text = f"{file_name} {hint}".lower()
    for doc_type, keys in KEYWORD_MAP.items():
        if any(k in text for k in keys):
            return doc_type
    return "unknown"


def analyze_document(file_name: str = "", content: dict = {}, hint: str = "") -> dict:
    """Analyze document metadata for the JSON /upload endpoint."""
    doc_type = _keyword_classify(file_name, hint)
    fields   = DOCUMENT_TYPES.get(doc_type, {}).get("fields", [])
    extracted = {f: content.get(f, f"[extracted {f}]") for f in fields} if doc_type != "unknown" else {}
    return {
        "type":            doc_type,
        "label":           DOCUMENT_TYPES.get(doc_type, {}).get("label", "Unknown Document"),
        "confidence":      0.4 if doc_type == "unknown" else 0.92,
        "extractedFields": extracted,
        "warnings":        [],
        "fileName":        file_name or "uploaded-file",
        "engine":          "keyword-mock",
        "analyzedAt":      datetime.now(timezone.utc).isoformat(),
    }
