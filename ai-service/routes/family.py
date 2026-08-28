# routes/family.py

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from services.scheme_service import load_schemes, calculate_match

router = APIRouter(prefix="/api/family", tags=["Family"])

_family_profiles: list = []


def _to_num(v):
    if v is None:
        return None
    try:
        return float(str(v).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def _member_to_profile(member: dict) -> dict:
    is_student  = member.get("studentStatus") in (True, "true", "True")
    is_farmer   = member.get("farmerStatus")  in (True, "true", "True")
    is_disabled = member.get("disabilityStatus") in (True, "true", "True")

    if is_student:
        category, occupation = "student", "student"
    elif is_farmer:
        category, occupation = "farmer", "farmer"
    elif is_disabled:
        category, occupation = "senior-citizen", "any"
    else:
        category   = "any"
        occupation = member.get("occupation") or "any"

    return {
        "age":          _to_num(member.get("age")),
        "gender":       member.get("gender"),
        "state":        member.get("state"),
        "annualIncome": _to_num(member.get("income")),
        "category":     category,
        "occupation":   occupation,
    }


# POST /api/family/create-profile
@router.post("/create-profile", status_code=201)
def create_family_profile(body: dict):
    members = body.get("members", [])
    if not members:
        raise HTTPException(status_code=400, detail="At least one family member is required")

    ts = int(datetime.now(timezone.utc).timestamp() * 1000)
    import random
    profile = {
        "id":            f"fam-{ts}-{random.randint(0, 999)}",
        "name":          body.get("name") or "My Household",
        "headOfFamily":  body.get("headOfFamily") or members[0].get("name", "N/A"),
        "members":       [
            {
                "memberId":        m.get("memberId") or f"m-{i+1}",
                "name":            m.get("name"),
                "age":             m.get("age"),
                "gender":          m.get("gender"),
                "relation":        m.get("relation"),
                "occupation":      m.get("occupation"),
                "studentStatus":   m.get("studentStatus"),
                "income":          m.get("income"),
                "farmerStatus":    m.get("farmerStatus"),
                "disabilityStatus":m.get("disabilityStatus"),
                "state":           m.get("state"),
                "district":        m.get("district"),
            }
            for i, m in enumerate(members)
        ],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    _family_profiles.append(profile)
    return {"success": True, "message": "Household profile created.", "data": profile}


# POST /api/family/analyze
@router.post("/analyze")
def analyze_family(body: dict):
    profile    = body.get("profile")
    profile_id = body.get("profileId")

    target = profile
    if not target and profile_id:
        target = next((p for p in _family_profiles if p["id"] == profile_id), None)
    if not target:
        raise HTTPException(status_code=400, detail="Provide a profile object or a valid profileId")

    all_schemes   = load_schemes()
    member_results = []

    for member in target["members"]:
        member_profile = _member_to_profile(member)
        matches = sorted(
            [{"scheme": s, **calculate_match(s, member_profile)} for s in all_schemes],
            key=lambda x: x["matchPercentage"],
            reverse=True,
        )
        top3 = [
            {
                "id":              m["scheme"]["id"],
                "name":            m["scheme"]["name"],
                "category":        m["scheme"]["category"],
                "matchPercentage": m["matchPercentage"],
                "benefits":        m["scheme"].get("benefits", []),
            }
            for m in matches[:3]
            if m["matchPercentage"] >= 50
        ]
        member_results.append({
            "memberId":           member.get("memberId"),
            "name":               member.get("name"),
            "relation":           member.get("relation"),
            "recommendedSchemes": top3,
        })

    # Household-wide unique schemes
    all_recommended_ids = {s["id"] for mr in member_results for s in mr["recommendedSchemes"]}
    household_schemes = [
        {"id": s["id"], "name": s["name"], "category": s["category"]}
        for s in all_schemes
        if s["id"] in all_recommended_ids
    ]

    return {
        "success":                  True,
        "membersAnalyzed":          len(member_results),
        "perMember":                member_results,
        "householdRecommendations": household_schemes,
    }


# GET /api/family/profiles
@router.get("/profiles")
def get_family_profiles():
    return {"success": True, "count": len(_family_profiles), "data": _family_profiles}
