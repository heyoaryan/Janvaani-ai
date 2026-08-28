# routes/schemes.py

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.scheme_service import (
    search_schemes, get_scheme_by_id, rank_schemes, extract_entities, full_text_search
)

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])


# GET /api/schemes?category=Education&state=Bihar&search=kisan
@router.get("/")
def list_schemes(
    category: Optional[str] = Query(None),
    state:    Optional[str] = Query(None),
    search:   Optional[str] = Query(None),
):
    results = search_schemes(category=category, state=state, search=search)
    return {"success": True, "count": len(results), "data": results}


# GET /api/schemes/{scheme_id}
@router.get("/{scheme_id}")
def get_scheme(scheme_id: str):
    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {"success": True, "data": scheme}


# POST /api/schemes/search  — AI-powered natural language search
@router.post("/search")
def ai_search(body: dict):
    query   = body.get("query", "")
    profile = body.get("profile", {})

    extracted = extract_entities(query)
    filters   = {}
    if extracted["category"]:
        filters["category"] = extracted["category"]
    if extracted["entities"].get("state"):
        filters["state"] = extracted["entities"]["state"]

    base_results = search_schemes(**filters) if filters else full_text_search(query)

    scoring_profile = {
        **profile,
        "age":          profile.get("age")          or extracted["entities"].get("age"),
        "gender":       profile.get("gender")        or extracted["entities"].get("gender"),
        "state":        profile.get("state")         or extracted["entities"].get("state"),
        "occupation":   profile.get("occupation")    or extracted["entities"].get("occupation"),
        "annualIncome": profile.get("annualIncome")  or extracted["entities"].get("income"),
        "category":     profile.get("category")      or extracted["entities"].get("occupation"),
    }

    ranked     = rank_schemes(base_results, scoring_profile)
    top_matches = [
        {
            "id":                 m["scheme"]["id"],
            "name":               m["scheme"]["name"],
            "category":           m["scheme"]["category"],
            "matchPercentage":    m["matchPercentage"],
            "reasons":            m["reasons"],
            "eligibilitySummary": m["eligibilitySummary"],
            "benefits":           m["scheme"].get("benefits", []),
            "officialSource":     m["scheme"].get("officialSource", ""),
        }
        for m in ranked[:5]
    ]

    return {
        "success":         True,
        "query":           query,
        "intent":          extracted["intent"],
        "detectedCategory": extracted["category"],
        "entities":        extracted["entities"],
        "count":           len(top_matches),
        "data":            top_matches,
    }
