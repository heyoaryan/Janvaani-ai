"""
JanVaani AI — FastAPI Backend
Full replacement for Node.js Express server.

Routes:
  GET  /                        → root
  GET  /api/health              → health check
  GET  /api/schemes             → list/filter schemes
  GET  /api/schemes/:id         → scheme detail
  POST /api/schemes/search      → AI-powered search
  POST /api/eligibility/check   → full eligibility check
  POST /api/eligibility/quick-check
  POST /api/documents/upload    → mock OCR
  POST /api/documents/check     → doc checklist for scheme
  POST /api/documents/missing   → missing docs
  POST /api/scam/analyze        → scam message analysis
  POST /api/scam/check-url      → URL risk check
  GET  /api/locations/nearby    → nearby govt offices
  POST /api/locations/search    → search offices
  POST /api/onboarding/complete → save user profile
  GET  /api/onboarding/profile/:id
  POST /api/family/create-profile
  POST /api/family/analyze      → family scheme recommendations
  GET  /api/family/profiles
  GET  /api/analytics/dashboard
  GET  /api/voice/languages
  POST /api/voice/transcribe    → STT (faster-whisper, local)
  POST /api/voice/synthesize    → TTS (gTTS, free)
  POST /api/voice/process       → full pipeline (STT→LLM→TTS ready)
  POST /api/voice/chat          → text-only multilingual chat
"""

import os
import logging
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="JanVaani AI",
    description="Voice-first citizen co-pilot for Indian government schemes",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from routes.schemes     import router as schemes_router
from routes.eligibility import router as eligibility_router
from routes.documents   import router as documents_router
from routes.scam        import router as scam_router
from routes.locations   import router as locations_router
from routes.onboarding  import router as onboarding_router
from routes.family      import router as family_router
from routes.analytics   import router as analytics_router
from routes.voice       import router as voice_router

app.include_router(schemes_router)
app.include_router(eligibility_router)
app.include_router(documents_router)
app.include_router(scam_router)
app.include_router(locations_router)
app.include_router(onboarding_router)
app.include_router(family_router)
app.include_router(analytics_router)
app.include_router(voice_router)

# ── Root + health ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status":  "ok",
        "service": "JanVaani AI",
        "version": "2.0.0",
        "docs":    "/docs",
        "health":  "/api/health",
    }


@app.get("/api/health")
def health():
    groq_key = os.getenv("GROQ_API_KEY", "")
    return {
        "status":           "ok",
        "message":          "JanVaani AI API is running",
        "whisper_model":    os.getenv("WHISPER_MODEL", "base"),
        "groq_configured":  bool(groq_key and not groq_key.startswith("your_") and len(groq_key) > 10),
        "web_search":       _web_search_status(),
    }


def _web_search_status() -> str:
    keys = [
        ("SearchAPI",  os.getenv("SEARCHAPI_KEY",       "")),
        ("SerpAPI",    os.getenv("SERPAPI_KEY",          "")),
        ("Bing",       os.getenv("BING_SEARCH_API_KEY", "")),
    ]
    configured = [name for name, k in keys if k and not k.startswith("your_") and len(k) > 5]
    return ", ".join(configured) if configured else "not configured"


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
