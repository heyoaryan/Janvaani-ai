# services/web_search_service.py
# Web search fallback — ported from Node.js webSearchService.js

import os
import httpx
from typing import Optional
from urllib.parse import urlparse

SEARCH_TIMEOUT  = int(os.getenv("SEARCH_TIMEOUT_MS", "6000")) / 1000
SEARCHAPI_KEY   = os.getenv("SEARCHAPI_KEY", "")
SERPAPI_KEY     = os.getenv("SERPAPI_KEY", "")
BING_SEARCH_KEY = os.getenv("BING_SEARCH_API_KEY", "")


def _has_usable_key(value: str) -> bool:
    return bool(value and not value.startswith("your_") and not value.startswith("placeholder"))


def _lang_code(language: str) -> str:
    return (language or "en").split("-")[0].lower()


def _normalize(result: dict, provider: str) -> Optional[dict]:
    title   = str(result.get("title") or "").strip()
    url     = str(result.get("link") or result.get("url") or "").strip()
    extract = str(result.get("snippet") or result.get("description") or "").strip()

    if not title or not url or not extract:
        return None
    if not url.startswith("http"):
        return None

    try:
        hostname = urlparse(url).hostname or ""
        if "wikipedia" in hostname or "wikimedia" in hostname:
            return None
        is_gov = hostname.endswith(".gov.in") or hostname.endswith(".nic.in") or hostname == "myscheme.gov.in"
        return {
            "title":           title,
            "extract":         extract[:900],
            "url":             url,
            "provider":        provider,
            "isGovernmentSource": is_gov,
        }
    except Exception:
        return None


def _pick(results: list, government_only: bool) -> Optional[dict]:
    if not results:
        return None
    if government_only:
        gov = next((r for r in results if r.get("isGovernmentSource")), None)
        return gov or results[0]
    return results[0]


async def _search_searchapi(query: str, language: str, government_only: bool) -> Optional[dict]:
    q = f"{query[:160]} government scheme official India" if government_only else query[:200]
    async with httpx.AsyncClient(timeout=SEARCH_TIMEOUT) as client:
        resp = await client.get(
            "https://www.searchapi.io/api/v1/search",
            params={"engine": "google", "q": q, "api_key": SEARCHAPI_KEY, "hl": _lang_code(language), "gl": "in"},
        )
        resp.raise_for_status()
        items = resp.json().get("organic_results", [])
    results = [r for r in (_normalize(i, "google") for i in items) if r]
    result = _pick(results, government_only)
    return {**result, "searchProvider": "searchapi-google"} if result else None


async def _search_serpapi(query: str, language: str, government_only: bool) -> Optional[dict]:
    q = f"{query[:160]} government scheme official India" if government_only else query[:200]
    async with httpx.AsyncClient(timeout=SEARCH_TIMEOUT) as client:
        resp = await client.get(
            "https://serpapi.com/search.json",
            params={"engine": "google", "q": q, "api_key": SERPAPI_KEY, "hl": _lang_code(language), "gl": "in", "num": 5},
        )
        resp.raise_for_status()
        items = resp.json().get("organic_results", [])
    results = [r for r in (_normalize(i, "google") for i in items) if r]
    result = _pick(results, government_only)
    return {**result, "searchProvider": "serpapi-google"} if result else None


async def _search_bing(query: str, language: str, government_only: bool) -> Optional[dict]:
    q = f"{query[:160]} government scheme official India" if government_only else query[:200]
    async with httpx.AsyncClient(timeout=SEARCH_TIMEOUT) as client:
        resp = await client.get(
            "https://api.bing.microsoft.com/v7.0/search",
            params={"q": q, "mkt": f"{_lang_code(language)}-IN", "count": 5},
            headers={"Ocp-Apim-Subscription-Key": BING_SEARCH_KEY},
        )
        resp.raise_for_status()
        items = resp.json().get("webPages", {}).get("value", [])
    results = [r for r in (_normalize(i, "bing") for i in items) if r]
    result = _pick(results, government_only)
    return {**result, "searchProvider": "bing"} if result else None


async def search_web(query: str, language: str = "en-IN", government_only: bool = False) -> Optional[dict]:
    query = (query or "").strip()
    if not query:
        return None
    try:
        if _has_usable_key(SEARCHAPI_KEY):
            return await _search_searchapi(query, language, government_only)
        if _has_usable_key(SERPAPI_KEY):
            return await _search_serpapi(query, language, government_only)
        if _has_usable_key(BING_SEARCH_KEY):
            return await _search_bing(query, language, government_only)
    except Exception:
        pass
    return None


def is_web_search_configured() -> bool:
    return (
        _has_usable_key(SEARCHAPI_KEY)
        or _has_usable_key(SERPAPI_KEY)
        or _has_usable_key(BING_SEARCH_KEY)
    )
