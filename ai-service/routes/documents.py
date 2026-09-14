# routes/documents.py

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional

from services.groq_ocr_service import analyse_document_with_groq, check_cross_doc_names
from services.document_service import (
    analyze_document,
    check_documents_for_scheme,
    get_missing_documents,
)
from data.documents import SAMPLE_UPLOADED_DOCUMENTS

router = APIRouter(prefix="/api/documents", tags=["Documents"])

_ALLOWED_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "image/bmp", "image/tiff", "application/pdf",
}
_MAX_SIZE = 10 * 1024 * 1024  # 10 MB


async def _read_upload(file: UploadFile) -> bytes:
    data = await file.read()
    if len(data) > _MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")
    ct = (file.content_type or "").lower().split(";")[0].strip()
    if ct not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ct}'. Allowed: JPG, PNG, WEBP, BMP, TIFF, PDF.",
        )
    return data


# ── POST /api/documents/upload ────────────────────────────────────────────────
# Quick upload + Groq analysis (no scheme-key matching).
# Optional form fields: hint, profileName
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    hint: Optional[str] = Form(default=""),
    profileName: Optional[str] = Form(default=""),
):
    file_bytes = await _read_upload(file)
    analysis = await analyse_document_with_groq(
        file_bytes=file_bytes,
        file_name=file.filename or "uploaded-file",
        hint=hint or "",
        profile_name=profileName or "",
    )
    return {"success": True, "message": "Document analysed.", "data": analysis}


# ── POST /api/documents/verify ────────────────────────────────────────────────
# Verify one document against the specific scheme doc key.
# Returns: status (verified | warning | error | wrong_document), warnings,
#          extractedFields, typeMatch.
@router.post("/verify")
async def verify_document(
    file: UploadFile = File(...),
    schemeDocKey: Optional[str] = Form(default=""),
    profileName: Optional[str] = Form(default=""),
):
    file_bytes = await _read_upload(file)
    analysis = await analyse_document_with_groq(
        file_bytes=file_bytes,
        file_name=file.filename or "uploaded-file",
        hint=schemeDocKey or "",
        profile_name=profileName or "",
    )
    return {"success": True, "data": analysis}


# ── POST /api/documents/verify-consistency ───────────────────────────────────
# Upload multiple documents and check name consistency across ALL of them.
# Form fields: files[] (multiple), profileName
@router.post("/verify-consistency")
async def verify_consistency(
    files: list[UploadFile] = File(...),
    profileName: Optional[str] = Form(default=""),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    analysed_docs = []
    for f in files:
        file_bytes = await _read_upload(f)
        result = await analyse_document_with_groq(
            file_bytes=file_bytes,
            file_name=f.filename or "file",
            profile_name=profileName or "",
        )
        # Use filename as the doc ID for cross-doc name comparison
        result["id"] = f.filename or f"doc-{len(analysed_docs) + 1}"
        analysed_docs.append(result)

    consistency = check_cross_doc_names(analysed_docs)

    return {
        "success": True,
        "data": {
            "documents": analysed_docs,
            "nameConsistency": consistency,
        },
    }


# ── POST /api/documents/check ─────────────────────────────────────────────────
# Check a list of already-analysed doc objects against a scheme's requirements.
@router.post("/check")
def check_documents(body: dict):
    scheme_id = body.get("schemeId")
    if not scheme_id:
        raise HTTPException(status_code=400, detail="schemeId is required")

    user_docs = body.get("documents") or SAMPLE_UPLOADED_DOCUMENTS
    try:
        result = check_documents_for_scheme(scheme_id, user_docs)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return {"success": True, "data": result}


# ── POST /api/documents/missing ───────────────────────────────────────────────
@router.post("/missing")
def missing_documents(body: dict):
    scheme_id = body.get("schemeId")
    if not scheme_id:
        raise HTTPException(status_code=400, detail="schemeId is required")

    user_docs = body.get("documents") or SAMPLE_UPLOADED_DOCUMENTS
    try:
        result = get_missing_documents(scheme_id, user_docs)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return {"success": True, "data": result}
