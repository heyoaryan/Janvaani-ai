# routes/locations.py

from fastapi import APIRouter, Query
from typing import Optional
from data.locations import GOVERNMENT_OFFICES

router = APIRouter(prefix="/api/locations", tags=["Locations"])


# GET /api/locations/nearby?limit=5
@router.get("/nearby")
def nearby(limit: int = Query(10, ge=1, le=50)):
    sorted_offices = sorted(GOVERNMENT_OFFICES, key=lambda o: o["distance"])
    return {
        "success": True,
        "count":   len(sorted_offices[:limit]),
        "data":    sorted_offices[:limit],
    }


# POST /api/locations/search
@router.post("/search")
def search_locations(body: dict):
    results = list(GOVERNMENT_OFFICES)

    if body.get("type"):
        results = [o for o in results if o["type"].lower() == body["type"].lower()]
    if body.get("city"):
        results = [o for o in results if o["city"].lower() == body["city"].lower()]
    if body.get("state"):
        results = [o for o in results if o["state"].lower() == body["state"].lower()]
    if body.get("service"):
        s = body["service"].lower()
        results = [o for o in results if any(s in svc.lower() for svc in o["services"])]

    results.sort(key=lambda o: o["distance"])
    return {"success": True, "count": len(results), "data": results}
