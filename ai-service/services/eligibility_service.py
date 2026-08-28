# services/eligibility_service.py
# Deterministic, rule-based eligibility engine — ported from Node.js eligibilityService.js

import math
from typing import Any, Optional

DEFAULT_INCOME = float("inf")


def _to_number(v) -> Optional[float]:
    if v is None:
        return None
    try:
        n = float(str(v).replace(",", "").strip())
        return n if not math.isnan(n) else None
    except (ValueError, TypeError):
        return None


def _normalize_gender(g) -> Optional[str]:
    if not g:
        return None
    s = str(g).lower().strip()
    if s in ("m", "male"):
        return "male"
    if s in ("f", "female"):
        return "female"
    return None


STATE_ALIASES = {
    "delhi": ["delhi", "nct", "nct of delhi", "new delhi", "ncr"],
    "uttar pradesh": ["uttar pradesh", "up"],
    "tamil nadu": ["tamil nadu", "tn", "tamilnadu"],
    "maharashtra": ["maharashtra"],
    "karnataka": ["karnataka"],
    "west bengal": ["west bengal", "bengal", "wb"],
    "gujarat": ["gujarat"],
    "rajasthan": ["rajasthan"],
    "all": ["all", "all india"],
}


def _state_match(user_state: str, allowed: str) -> bool:
    u = (user_state or "").lower().strip()
    a = (allowed or "").lower().strip()
    if a in ("all", "all india"):
        return True
    if u == a:
        return True
    for canon, aliases in STATE_ALIASES.items():
        if a in aliases or a.replace("-", " ") == canon:
            return u in aliases or u.replace("-", " ") == canon
    return u.replace("-", " ") == a.replace("-", " ")


def _normalize_state(s) -> Optional[str]:
    if not s:
        return None
    return str(s).strip().lower()


def evaluate_eligibility(scheme: dict, profile: dict) -> dict:
    """
    Evaluate a user profile against a scheme's eligibilityRules.
    Returns { eligible, score, criteria: [{name, status, detail}] }
    """
    rules = scheme.get("eligibilityRules", {})
    criteria = []

    # ── Age ──────────────────────────────────────────────────────────────────
    age_rule = rules.get("age") or {
        "min": rules.get("minAge", 0),
        "max": rules.get("maxAge", 200),
    }
    age = _to_number(profile.get("age"))
    if age is None:
        criteria.append({
            "name": "Age",
            "status": "warning",
            "detail": f"Age requirement {age_rule['min']}–{age_rule['max']} years. Provide your age to confirm.",
        })
    elif age_rule["min"] <= age <= age_rule["max"]:
        criteria.append({
            "name": "Age",
            "status": "pass",
            "detail": f"Age {int(age)} is within the required {age_rule['min']}–{age_rule['max']} years.",
        })
    else:
        criteria.append({
            "name": "Age",
            "status": "fail",
            "detail": f"Age {int(age)} is outside the required {age_rule['min']}–{age_rule['max']} years.",
        })

    # ── Income ────────────────────────────────────────────────────────────────
    income_max = rules.get("income", {}).get("max", DEFAULT_INCOME)
    income = _to_number(profile.get("annualIncome") if profile.get("annualIncome") not in (None, "") else profile.get("income"))
    if income is None:
        criteria.append({
            "name": "Income",
            "status": "warning",
            "detail": f"Income should be ₹{int(income_max):,} or less. Provide income to confirm.",
        })
    elif income <= income_max:
        criteria.append({
            "name": "Income",
            "status": "pass",
            "detail": f"Annual income ₹{int(income):,} is within limit ₹{int(income_max):,}.",
        })
    else:
        criteria.append({
            "name": "Income",
            "status": "fail",
            "detail": f"Annual income ₹{int(income):,} exceeds limit ₹{int(income_max):,}.",
        })

    # ── Gender ────────────────────────────────────────────────────────────────
    gender_rule = rules.get("gender", "all")
    gender = _normalize_gender(profile.get("gender"))
    if gender_rule == "all":
        criteria.append({"name": "Gender", "status": "pass", "detail": "Open to all genders."})
    elif not gender:
        criteria.append({
            "name": "Gender",
            "status": "warning",
            "detail": f"This scheme is for {gender_rule} applicants only. Provide gender to confirm.",
        })
    elif gender == gender_rule:
        criteria.append({"name": "Gender", "status": "pass", "detail": f"Eligible as {gender} applicant."})
    else:
        criteria.append({
            "name": "Gender",
            "status": "fail",
            "detail": f"This scheme is for {gender_rule} applicants only.",
        })

    # ── State / Region ────────────────────────────────────────────────────────
    states = rules.get("states") or []
    if not states:
        raw = scheme.get("state") or "all"
        states = ["all"] if str(raw).lower() in ("all india", "all") else [str(raw)]
    state = _normalize_state(profile.get("state"))
    if "all" in states:
        criteria.append({"name": "State", "status": "pass", "detail": "Available across all of India."})
    elif not state:
        criteria.append({
            "name": "State",
            "status": "warning",
            "detail": f"Available in: {', '.join(states)}. Provide your state to confirm.",
        })
    elif any(_state_match(state, s) for s in states):
        criteria.append({"name": "State", "status": "pass", "detail": f"Available in {state}."})
    else:
        criteria.append({
            "name": "State",
            "status": "fail",
            "detail": f"Not available in {state}. Available in: {', '.join(states)}.",
        })

    # ── Category / Occupation ─────────────────────────────────────────────────
    categories = rules.get("categories", ["any"])
    user_category = profile.get("category")
    user_occupation = profile.get("occupation")
    category_match = (
        "any" in categories
        or (user_category and user_category in categories)
        or (user_occupation and user_occupation in categories)
    )
    if "any" in categories:
        criteria.append({"name": "Category", "status": "pass", "detail": "Open to all categories."})
    elif not user_category and not user_occupation:
        criteria.append({
            "name": "Category",
            "status": "warning",
            "detail": f"Preferred categories: {', '.join(categories)}. Provide more details to confirm.",
        })
    elif category_match:
        criteria.append({
            "name": "Category",
            "status": "pass",
            "detail": f"Matches preferred category: {', '.join(categories)}.",
        })
    else:
        criteria.append({
            "name": "Category",
            "status": "fail",
            "detail": f"Requires one of: {', '.join(categories)}.",
        })

    # ── Aggregate ─────────────────────────────────────────────────────────────
    fails = sum(1 for c in criteria if c["status"] == "fail")
    passes = sum(1 for c in criteria if c["status"] == "pass")
    total_decisive = passes + fails
    score = 50 if total_decisive == 0 else round((passes / total_decisive) * 100)
    eligible = fails == 0

    return {"eligible": eligible, "score": score, "criteria": criteria}


def quick_check(scheme: dict, minimal_profile: dict) -> dict:
    return evaluate_eligibility(scheme, minimal_profile)
