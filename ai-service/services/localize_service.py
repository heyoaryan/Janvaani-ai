# services/localize_service.py
# Localize scheme cards into the user's selected language.

import json
import logging
import os
from copy import deepcopy

from data.scheme_hi import SCHEME_HI

log = logging.getLogger("janvaani-ai")

_cache: dict[tuple, dict] = {}

LANG_NAMES = {
    "hi-IN": "Hindi",
    "en-IN": "English",
    "bn-IN": "Bengali",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "pa-IN": "Punjabi",
    "od-IN": "Odia",
}


def _groq_ready() -> bool:
    key = os.getenv("GROQ_API_KEY", "")
    return bool(key and not key.startswith("your_") and len(key) > 10)


def _apply_hi(scheme: dict) -> dict:
    extra = SCHEME_HI.get(scheme.get("id"), {})
    out = deepcopy(scheme)
    if extra.get("name"):
        out["nameHi"] = extra["name"]
        out["localizedName"] = extra["name"]
        out["name"] = extra["name"]
    if extra.get("description"):
        out["descriptionHi"] = extra["description"]
        out["localizedDescription"] = extra["description"]
        out["description"] = extra["description"]
    return out


def _translate_via_groq(scheme: dict, language: str) -> dict | None:
    import httpx

    key = os.getenv("GROQ_API_KEY", "")
    lang_name = LANG_NAMES.get(language, language)
    payload = {
        "id": scheme.get("id"),
        "name": scheme.get("name"),
        "description": scheme.get("description"),
        "benefits": (scheme.get("benefits") or [])[:4],
        "applicationSteps": (scheme.get("applicationSteps") or [])[:6],
    }
    prompt = (
        f"Translate this Indian government scheme into {lang_name}. "
        "Keep scheme acronyms (PM-KISAN, PMAY) as-is. Keep rupee amounts as-is. "
        "Return ONLY JSON with keys: name, description, benefits (array), applicationSteps (array).\n"
        + json.dumps(payload, ensure_ascii=False)
    )
    models = ["llama-3.1-8b-instant", "llama3-8b-8192"]
    for model in models:
        try:
            resp = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You translate government scheme text. Reply with JSON only."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 700,
                },
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                timeout=12.0,
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"].strip()
            if raw.startswith("```"):
                raw = raw.strip("`")
                raw = raw.replace("json", "", 1).strip()
            data = json.loads(raw)
            out = deepcopy(scheme)
            if data.get("name"):
                out["localizedName"] = data["name"]
                out["name"] = data["name"]
            if data.get("description"):
                out["localizedDescription"] = data["description"]
                out["description"] = data["description"]
            if data.get("benefits"):
                out["localizedBenefits"] = data["benefits"]
                out["benefits"] = data["benefits"]
            if data.get("applicationSteps"):
                out["localizedSteps"] = data["applicationSteps"]
                out["applicationSteps"] = data["applicationSteps"]
            return out
        except Exception as e:
            log.warning(f"Scheme localize via {model} failed: {e}")
    return None


def localize_scheme(scheme: dict, language: str = "en-IN") -> dict:
    if not scheme:
        return scheme
    lang = language or "en-IN"
    if lang in ("en-IN", "en"):
        extra = SCHEME_HI.get(scheme.get("id"), {})
        out = deepcopy(scheme)
        if extra.get("name"):
            out["nameHi"] = extra["name"]
        if extra.get("description"):
            out["descriptionHi"] = extra["description"]
        return out

    cache_key = (scheme.get("id"), lang)
    if cache_key in _cache:
        return deepcopy(_cache[cache_key])

    if lang == "hi-IN":
        localized = _apply_hi(scheme)
        _cache[cache_key] = localized
        return deepcopy(localized)

    if _groq_ready():
        localized = _translate_via_groq(scheme, lang)
        if localized:
            extra = SCHEME_HI.get(scheme.get("id"), {})
            if extra.get("name"):
                localized["nameHi"] = extra["name"]
            _cache[cache_key] = localized
            return deepcopy(localized)

    extra = SCHEME_HI.get(scheme.get("id"), {})
    out = deepcopy(scheme)
    if extra.get("name"):
        out["nameHi"] = extra["name"]
    if extra.get("description"):
        out["descriptionHi"] = extra["description"]
    _cache[cache_key] = out
    return deepcopy(out)


def localize_schemes(schemes: list, language: str = "en-IN") -> list:
    return [localize_scheme(s, language) for s in schemes]
