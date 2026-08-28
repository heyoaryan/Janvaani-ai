# services/document_service.py
# Mock document analysis — ported from Node.js documentService.js

from data.documents import DOCUMENT_TYPES, SAMPLE_UPLOADED_DOCUMENTS, get_document_requirements
from services.scheme_service import get_scheme_by_id
from datetime import datetime, timezone


# ── Mock OCR / classification ─────────────────────────────────────────────────

KEYWORD_MAP = {
    "aadhaar":            ["aadhaar", "uidai", "आधार"],
    "pan":                ["pan", "permanent account"],
    "income-certificate": ["income", "आय", "income certificate"],
    "student-id":         ["student", "college", "school", "roll"],
    "bank-passbook":      ["passbook", "bank", "account"],
    "ration-card":        ["ration", "राशन"],
    "land-proof":         ["khata", "land", "patta", "खसरा", "जमीन"],
    "age-proof":          ["birth", "age", "जन्म"],
    "birth-certificate":  ["birth certificate", "janm praman"],
    "project-report":     ["project", "business plan", "परियोजना"],
    "incorporation-cert": ["incorporation", "cin", "company"],
    "business-plan":      ["business plan", "funding"],
    "maternal-card":      ["maternal", "anc", "गर्भ"],
    "sowing-certificate": ["sowing", "crop", "बुवाई"],
}


def recognize_document_type(file_name: str = "", hint: str = "") -> str:
    text = f"{file_name} {hint}".lower()
    for doc_type, keys in KEYWORD_MAP.items():
        if any(k in text for k in keys):
            return doc_type
    return "unknown"


def extract_fields(doc_type: str, raw_content: dict = {}) -> dict:
    fields = DOCUMENT_TYPES.get(doc_type, {}).get("fields", [])
    return {f: raw_content.get(f, f"[extracted {f}]") for f in fields}


def analyze_document(file_name: str = "", content: dict = {}, hint: str = "") -> dict:
    doc_type = recognize_document_type(file_name, hint)
    extracted_fields = {} if doc_type == "unknown" else extract_fields(doc_type, content)
    return {
        "type": doc_type,
        "label": DOCUMENT_TYPES.get(doc_type, {}).get("label", "Unknown Document"),
        "confidence": 0.4 if doc_type == "unknown" else 0.92,
        "extractedFields": extracted_fields,
        "fileName": file_name or "uploaded-file",
        "analyzedAt": datetime.now(timezone.utc).isoformat(),
    }


def check_documents_for_scheme(scheme_id: str, user_documents: list) -> dict:
    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise ValueError("Scheme not found")

    required = scheme.get("requiredDocuments", [])
    have_types = {d.get("type") for d in user_documents}
    satisfied = []
    missing = []

    for doc_key in required:
        meta = DOCUMENT_TYPES.get(doc_key, {"label": doc_key, "howToGet": "", "description": ""})
        if doc_key in have_types:
            satisfied.append({"key": doc_key, "label": meta["label"]})
        else:
            missing.append({
                "key": doc_key,
                "label": meta.get("label", doc_key),
                "description": meta.get("description", ""),
                "howToGet": meta.get("howToGet", ""),
            })

    return {"schemeId": scheme_id, "schemeName": scheme["name"], "satisfied": satisfied, "missing": missing}


def get_missing_documents(scheme_id: str, user_documents: list) -> dict:
    result = check_documents_for_scheme(scheme_id, user_documents)
    return {
        "schemeId": scheme_id,
        "schemeName": result["schemeName"],
        "missing": result["missing"],
        "satisfied": result["satisfied"],
        "hasAll": len(result["missing"]) == 0,
        "guidance": (
            "सभी आवश्यक दस्तावेज़ उपलब्ध हैं। आप आवेदन कर सकते हैं।"
            if len(result["missing"]) == 0
            else "कुछ दस्तावेज़ अभी लापता हैं। नीचे दिए गए तरीके से प्राप्त करें।"
        ),
    }
