# routes/documents.py

from fastapi import APIRouter, HTTPException
from services.document_service import (
    analyze_document, check_documents_for_scheme, get_missing_documents
)
from data.documents import SAMPLE_UPLOADED_DOCUMENTS

router = APIRouter(prefix="/api/documents", tags=["Documents"])


# POST /api/documents/upload  (mock analysis)
@router.post("/upload")
def upload_document(body: dict):
    file_name = body.get("fileName", "document")
    content   = body.get("content", {})
    hint      = body.get("hint", "")

    analysis = analyze_document(file_name=file_name, content=content, hint=hint)
    return {
        "success": True,
        "message": "Document analyzed (mock).",
        "data":    analysis,
    }


# POST /api/documents/check
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


# POST /api/documents/missing
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
