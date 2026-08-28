# routes/analytics.py

from fastapi import APIRouter
from datetime import datetime, timezone
from services.scheme_service import load_schemes

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# GET /api/analytics/dashboard
@router.get("/dashboard")
def dashboard():
    schemes = load_schemes()

    metrics = {
        "schemesDiscovered":     1284,
        "eligibilityChecks":     642,
        "documentsIdentified":   319,
        "applicationsAssisted":  207,
        "familiesHelped":        158,
    }

    by_category: dict = {}
    for s in schemes:
        by_category[s["category"]] = by_category.get(s["category"], 0) + 1

    weekly_trend = [
        {"day": "Mon", "checks": 78},
        {"day": "Tue", "checks": 92},
        {"day": "Wed", "checks": 110},
        {"day": "Thu", "checks": 101},
        {"day": "Fri", "checks": 134},
        {"day": "Sat", "checks": 88},
        {"day": "Sun", "checks": 39},
    ]

    return {
        "success":                 True,
        "updatedAt":               datetime.now(timezone.utc).isoformat(),
        "metrics":                 metrics,
        "schemeCategoryBreakdown": by_category,
        "totalSchemes":            len(schemes),
        "weeklyTrend":             weekly_trend,
    }
