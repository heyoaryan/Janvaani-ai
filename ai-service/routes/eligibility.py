# routes/eligibility.py

from fastapi import APIRouter, HTTPException
from services.eligibility_service import evaluate_eligibility, quick_check
from services.scheme_service import get_scheme_by_id

router = APIRouter(prefix="/api/eligibility", tags=["Eligibility"])


# POST /api/eligibility/check
@router.post("/check")
def check_eligibility(body: dict):
    scheme_id = body.get("schemeId")
    profile   = body.get("profile")

    if not scheme_id or not profile:
        raise HTTPException(status_code=400, detail="schemeId and profile are required")

    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    result = evaluate_eligibility(scheme, profile)
    return {
        "success":              True,
        "schemeId":             scheme_id,
        "schemeName":           scheme["name"],
        "eligible":             result["eligible"],
        "eligibilityPercentage": result["score"],
        "criteria":             result["criteria"],
    }


# POST /api/eligibility/quick-check
@router.post("/quick-check")
def quick_eligibility_check(body: dict):
    scheme_id = body.get("schemeId")
    age       = body.get("age")

    if not scheme_id or age is None:
        raise HTTPException(status_code=400, detail="schemeId and age are required")

    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    minimal = {"age": age, "gender": body.get("gender"), "state": body.get("state")}
    result  = quick_check(scheme, minimal)

    return {
        "success":               True,
        "schemeId":              scheme_id,
        "schemeName":            scheme["name"],
        "eligible":              result["eligible"],
        "eligibilityPercentage": result["score"],
        "criteria":              result["criteria"],
        "message": (
            "आप इस योजना के लिए पात्र लग रहे हैं। और जानकारी दें for full check."
            if result["eligible"]
            else "अभी पूरी जांच के लिए और विवरण दें।"
        ),
    }
