# routes/voice.py
# Voice pipeline: STT (faster-whisper) + chat (Groq) + TTS (gTTS)
# Ported from Node.js voiceRoutes.js — no external Sarvam API needed.

import io, os, re, base64, tempfile, logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
import httpx

from services.ai_service import generate_response
from services.web_search_service import search_web, is_web_search_configured

log = logging.getLogger("janvaani-ai")

router = APIRouter(prefix="/api/voice", tags=["Voice"])

# ── Config ────────────────────────────────────────────────────────────────────
GROQ_API_KEY  = os.getenv("GROQ_API_KEY", "")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

GROQ_MODELS = [
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
]

SYSTEM_PROMPT = """You are JanVaani AI, a friendly and helpful assistant for Indian government schemes and citizen services.
Your job is to help rural and semi-urban Indian citizens — many of whom have low literacy — find the right government scheme.
Always reply in the SELECTED UI language given in the system message, even if the user typed or spoke in another language.
Keep responses SHORT (2-4 sentences), warm, and actionable. Use simple everyday words, avoid jargon.
When matched schemes are provided, talk ONLY about those schemes — do not invent different schemes.
When mentioning a scheme, include: what it gives, who can apply, and one next step.
If the user mentioned age, occupation, income, or state, use those details.
Never make up scheme amounts or eligibility. If a detail is missing, say what to confirm on the official site."""

SUPPORTED_LANGUAGES = [
    {"code": "hi-IN", "name": "हिन्दी (Hindi)",       "gtts_lang": "hi", "whisper_lang": "hi"},
    {"code": "en-IN", "name": "English (Indian)",       "gtts_lang": "en", "whisper_lang": "en"},
    {"code": "bn-IN", "name": "বাংলা (Bengali)",        "gtts_lang": "bn", "whisper_lang": "bn"},
    {"code": "ta-IN", "name": "தமிழ் (Tamil)",          "gtts_lang": "ta", "whisper_lang": "ta"},
    {"code": "te-IN", "name": "తెలుగు (Telugu)",        "gtts_lang": "te", "whisper_lang": "te"},
    {"code": "mr-IN", "name": "मराठी (Marathi)",        "gtts_lang": "mr", "whisper_lang": "mr"},
    {"code": "gu-IN", "name": "ગુજરાતી (Gujarati)",     "gtts_lang": "gu", "whisper_lang": "gu"},
    {"code": "kn-IN", "name": "ಕನ್ನಡ (Kannada)",        "gtts_lang": "kn", "whisper_lang": "kn"},
    {"code": "ml-IN", "name": "മലയാളം (Malayalam)",     "gtts_lang": "ml", "whisper_lang": "ml"},
    {"code": "pa-IN", "name": "ਪੰਜਾਬੀ (Punjabi)",       "gtts_lang": "pa", "whisper_lang": "pa"},
    {"code": "od-IN", "name": "ଓଡ଼ିଆ (Odia)",           "gtts_lang": "or", "whisper_lang": "or"},
]

LANG_MAP = {l["code"]: l for l in SUPPORTED_LANGUAGES}

FALLBACK_RESPONSES = {
    "hi-IN": "नमस्ते! मैं JanVaani हूं। आप शिक्षा, स्वास्थ्य, किसान, घर, या रोजगार की योजनाओं के बारे में पूछ सकते हैं।",
    "en-IN": "Hello! I'm JanVaani. Ask me about education, health, farming, housing, or employment schemes.",
    "bn-IN": "নমস্কার! আমি JanVaani। শিক্ষা, স্বাস্থ্য, কৃষি, বাড়ি বা কর্মসংস্থান প্রকল্প সম্পর্কে জিজ্ঞাসা করুন।",
    "ta-IN": "வணக்கம்! நான் JanVaani. கல்வி, சுகாதாரம், விவசாயம், வீட்டு திட்டங்களைப் பற்றி கேளுங்கள்.",
    "te-IN": "నమస్కారం! నేను JanVaani. విద్య, ఆరోగ్యం, వ్యవసాయం, గృహ పథకాల గురించి అడగండి.",
    "mr-IN": "नमस्कार! मी JanVaani आहे. शिक्षण, आरोग्य, शेती, घर योजनांबद्दल विचारा.",
    "gu-IN": "નમસ્તે! હું JanVaani છું. શિક્ષણ, આરોગ્ય, ખેતી, ઘર યોજનાઓ વિશે પૂછો.",
    "kn-IN": "ನಮಸ್ಕಾರ! ನಾನು JanVaani. ಶಿಕ್ಷಣ, ಆರೋಗ್ಯ, ಕೃಷಿ, ಗೃಹ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ.",
    "ml-IN": "നമസ്കാരം! ഞാൻ JanVaani ആണ്. വിദ്യാഭ്യാസം, ആരോഗ്യം, കൃഷി, ഭവന പദ്ധതികളെക്കുറിച്ച് ചോദിക്കൂ.",
    "pa-IN": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ JanVaani ਹਾਂ। ਸਿੱਖਿਆ, ਸਿਹਤ, ਖੇਤੀ, ਘਰ ਯੋਜਨਾਵਾਂ ਬਾਰੇ ਪੁੱਛੋ।",
    "od-IN": "ନମସ୍କାର! ମୁଁ JanVaani। ଶିକ୍ଷା, ସ୍ୱାସ୍ଥ୍ୟ, କୃଷି, ଗୃହ ଯୋଜନା ସମ୍ପର୍କରେ ପଚାରନ୍ତୁ।",
}

# In-memory session history
_sessions: dict[str, list] = {}

# Lazy-load Whisper
_whisper_model = None

def _get_whisper():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        log.info(f"Loading Whisper model: {WHISPER_MODEL}")
        _whisper_model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
        log.info("Whisper model loaded.")
    return _whisper_model


def _detect_language(text: str, requested: str = "hi-IN") -> str:
    script_map = [
        (r"[ঀ-৿]", "bn-IN"), (r"[஀-௿]", "ta-IN"), (r"[ఀ-౿]", "te-IN"),
        (r"[ಀ-೿]", "kn-IN"), (r"[ഀ-ൿ]", "ml-IN"), (r"[઀-૿]", "gu-IN"),
        (r"[ਅ-੿]", "pa-IN"), (r"[଀-୿]", "od-IN"), (r"[ऀ-ॿ]", "hi-IN"),
    ]
    for pattern, lang in script_map:
        if re.search(pattern, text):
            return lang
    if re.search(r"[a-z]", text, re.I):
        return "en-IN"
    return requested


def _groq_ready() -> bool:
    return bool(GROQ_API_KEY and not GROQ_API_KEY.startswith("your_") and len(GROQ_API_KEY) > 10)


def _call_groq(messages: list, model: str) -> str:
    resp = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        json={"model": model, "messages": messages, "temperature": 0.5, "max_tokens": 512},
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        timeout=15.0,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ── GET /api/voice/languages ──────────────────────────────────────────────────
@router.get("/languages")
def get_languages():
    return {"success": True, "count": len(SUPPORTED_LANGUAGES), "data": SUPPORTED_LANGUAGES}


# ── POST /api/voice/transcribe ────────────────────────────────────────────────
@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language_code: str = Form("hi-IN"),
):
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    suffix = "." + (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "webm")
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        whisper_lang = LANG_MAP.get(language_code, {}).get("whisper_lang")
        model        = _get_whisper()

        def _run(lang=None):
            segs, inf = model.transcribe(
                tmp_path,
                language=lang,
                beam_size=5,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 500},
            )
            text = " ".join(seg.text.strip() for seg in segs).strip()
            return text, inf

        transcript, info = _run(whisper_lang)
        if not transcript:
            transcript, info = _run(None)
        detected_lang = info.language if info else language_code

        return {
            "success":         True,
            "language":        language_code,
            "detectedLanguage": detected_lang,
            "transcription":   transcript,
            "translation":     transcript,
            "confidence":      round(info.language_probability if info else 0.9, 2),
            "provider":        "faster-whisper",
            "model":           WHISPER_MODEL,
        }
    except Exception as e:
        log.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


# ── POST /api/voice/synthesize ────────────────────────────────────────────────
@router.post("/synthesize")
async def synthesize(body: dict):
    text     = (body.get("text") or "").strip()
    language = body.get("language", "hi-IN")

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    text = text[:500]

    # gTTS language fallback chain: requested → hi → en
    gtts_lang   = LANG_MAP.get(language, {}).get("gtts_lang", "hi")
    lang_chain  = [gtts_lang, "hi", "en"]

    try:
        from gtts import gTTS
        last_err = None
        for lg in lang_chain:
            try:
                tts = gTTS(text=text, lang=lg, slow=False)
                buf = io.BytesIO()
                tts.write_to_fp(buf)
                buf.seek(0)
                audio_b64 = base64.b64encode(buf.read()).decode("utf-8")
                return {
                    "success":  True,
                    "language": language,
                    "usedLang": lg,
                    "text":     text,
                    "audioUrl": f"data:audio/mp3;base64,{audio_b64}",
                    "provider": "gtts",
                }
            except Exception as e:
                last_err = e
                log.warning(f"gTTS lang={lg} failed: {e}, trying fallback")
        raise last_err
    except Exception as e:
        log.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


# ── POST /api/voice/process  (full pipeline) ──────────────────────────────────
@router.post("/process")
async def process_voice(body: dict):
    user_text    = (body.get("input") or "").strip()
    session_id   = body.get("sessionId") or f"sess-{id(body)}"
    language     = body.get("language", "hi-IN")
    user_profile = body.get("userProfile") or {}

    if not re.match(r"^[a-z]{2}-IN$", language, re.I):
        language = "hi-IN"

    # Understand any script; always answer in the language the user selected in the UI.
    response_language = language if language in LANG_MAP else "hi-IN"

    # Local scheme analysis (same matcher regardless of language)
    local = generate_response(user_text, {"language": response_language, "userProfile": user_profile})

    # Web search fallback if local didn't find a match
    source      = None
    answer_type = "scheme" if local["answerable"] else "local"
    search_status = "local-match" if local["answerable"] else "pending"

    if not local["answerable"]:
        govt_query = local["intent"] in (
            "scheme_discovery", "eligibility_check", "application_help", "document_help"
        ) or bool(local["category"])
        if is_web_search_configured():
            try:
                source = await search_web(user_text, response_language, government_only=govt_query)
                if source and source.get("extract"):
                    answer_type   = "web"
                    search_status = "web-match"
                else:
                    search_status = "no-result"
            except Exception:
                search_status = "search-unavailable"
        else:
            search_status = "web-search-not-configured"

    # Build messages for Groq
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    lang_info = LANG_MAP.get(response_language, {})
    lang_name = lang_info.get("name", response_language)
    messages[0]["content"] += (
        f"\n\nIMPORTANT: Always reply in {lang_name} ({response_language}). "
        "Do not switch language even if the user query is in another script."
    )

    extracted = local.get("entities") or {}
    filled = [f"{k}: {v}" for k, v in extracted.items() if v not in (None, "", [])]
    if user_profile:
        filled.extend(f"{k}: {v}" for k, v in user_profile.items() if v and k not in ("sessionId",))
    if filled:
        messages.append({"role": "system", "content": "Known user details: " + ", ".join(filled)})

    schemes = local.get("suggestedSchemes") or []
    if schemes:
        lines = []
        for s in schemes[:5]:
            benefits = "; ".join((s.get("benefits") or [])[:2])
            lines.append(
                f"- {s.get('name')} (id={s.get('id')}, category={s.get('category')}): "
                f"{s.get('description','')[:220]} Benefits: {benefits}"
            )
        messages.append({
            "role": "system",
            "content": "Use ONLY these matched schemes (same list the app will show):\n" + "\n".join(lines),
        })

    if source and source.get("extract"):
        messages.append({
            "role":    "system",
            "content": f"Grounding source: {source['title']}\n{source['extract']}\nURL: {source['url']}\nUse only this source for factual claims.",
        })

    hist = _sessions.get(session_id, [])
    for turn in hist[-10:]:
        messages.append({"role": turn["role"], "content": turn["content"]})

    messages.append({"role": "user", "content": user_text})

    # Call Groq or fallback
    assistant_text = None
    provider       = "local-fallback"

    # Local match is instant — skip Groq so the UI is not stuck on "analyzing".
    if local["answerable"] and local.get("response"):
        assistant_text = local["response"]
        provider       = "local"
    elif _groq_ready():
        for model in GROQ_MODELS:
            try:
                assistant_text = _call_groq(messages, model)
                provider       = "groq"
                log.info(f"Groq responded via {model}")
                break
            except Exception as e:
                log.warning(f"Groq model {model} failed: {e}")

    if not assistant_text:
        assistant_text = (
            f"{source['title']}: {source['extract']}" if source and source.get("extract")
            else local["response"] or FALLBACK_RESPONSES.get(response_language, FALLBACK_RESPONSES["en-IN"])
        )

    # Save history
    if session_id not in _sessions:
        _sessions[session_id] = []
    _sessions[session_id].append({"role": "user",      "content": user_text})
    _sessions[session_id].append({"role": "assistant", "content": assistant_text})
    if len(_sessions[session_id]) > 40:
        _sessions[session_id] = _sessions[session_id][-40:]

    return {
        "success":          True,
        "sessionId":        session_id,
        "language":         response_language,
        "responseLanguage": response_language,
        "detectedLanguage": response_language,
        "transcription":    user_text,
        "translation":      user_text,
        "intent":           local["intent"],
        "category":         local["category"],
        "entities":         local["entities"],
        "response":         assistant_text,
        "suggestedSchemes": local["suggestedSchemes"],
        "provider":         provider,
        "answerType":       answer_type,
        "source":           source,
        "searchStatus":     search_status,
        **({"sourceDisclaimer": "This answer is based on a web search result. Verify on the linked official source."} if source else {}),
    }


# ── POST /api/voice/chat  (text-only chat, no audio) ─────────────────────────
class ChatRequest(BaseModel):
    input:       str
    language:    str = "hi-IN"
    sessionId:   Optional[str] = None
    userProfile: Optional[dict] = {}
    history:     Optional[list] = []

@router.post("/chat")
async def chat(request: ChatRequest):
    sid       = request.sessionId or f"sess-{id(request)}"
    user_text = request.input.strip()
    language  = request.language if request.language in LANG_MAP else "hi-IN"

    if not user_text:
        raise HTTPException(status_code=400, detail="Input text is required")

    return await process_voice({
        "input": user_text,
        "sessionId": sid,
        "language": language,
        "userProfile": request.userProfile or {},
    })
