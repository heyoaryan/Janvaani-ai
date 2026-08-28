# routes/onboarding.py

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

# In-memory profile store (resets on restart — fine for hackathon)
_profiles: dict = {}


# POST /api/onboarding/complete
@router.post("/complete")
def complete_onboarding(body: dict):
    name       = body.get("name", "").strip()
    occupation = body.get("occupation", "").strip()
    age        = body.get("age")
    session_id = body.get("sessionId")

    if not name or not occupation or age is None:
        raise HTTPException(status_code=400, detail="name, occupation, and age are required")

    sid = session_id or f"profile-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    profile = {
        "sessionId":  sid,
        "name":       name,
        "occupation": occupation,
        "age":        int(age),
        "createdAt":  datetime.now(timezone.utc).isoformat(),
    }
    _profiles[sid] = profile

    return {
        "success": True,
        "profile": profile,
        "message": (
            f"Namaste {name}! I am JanVaani AI, your personal assistant for government schemes. "
            f"I know you are a {occupation} aged {int(age)}. How can I help you today?"
        ),
    }


# GET /api/onboarding/profile/{session_id}
@router.get("/profile/{session_id}")
def get_profile(session_id: str):
    profile = _profiles.get(session_id)
    return {"success": True, "profile": profile}
