# routes/voice.py
# Voice pipeline: STT (faster-whisper) + chat (Groq) + TTS (edge-tts → gTTS fallback)
# Primary TTS: Microsoft Edge Neural voices — human-like, free, no API key needed.
# Fallback TTS: gTTS for languages without neural voice support (Punjabi, Odia).

import io, os, re, json, base64, tempfile, logging
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
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "allam-2-7b",
]

SYSTEM_PROMPT = """You are JanVaani — a warm, caring voice assistant helping everyday Indian citizens navigate government schemes.
You speak like a knowledgeable neighbour or a helpful anganwadi worker — simple, clear, reassuring. Never robotic.

LANGUAGE RULE (NON-NEGOTIABLE): Reply ONLY in the language and script specified below.
Even if the user writes in Roman letters or English, your reply must be in the specified script.
Never mix scripts. Never write transliterated text (no "aap ke liye" in Roman script if language is Hindi).

TONE & STYLE:
- Sound like a real person, not a government pamphlet. Use natural spoken-language phrasing.
- Keep replies SHORT — 2 to 4 sentences. Voice is the medium; long answers are hard to follow.
- Lead with what the scheme GIVES the person, then who can apply, then one clear next step.
- Use "aap" / "apke" style in Hindi. Use appropriate second-person in each language.
- Warm openers: "हाँ ज़रूर!" / "ਹਾਂ ਜ਼ਰੂਰ!" / "হ্যাঁ অবশ্যই!" etc. instead of stiff "According to..."
- Never start with "I" or "JanVaani". Start with the answer.

ACCURACY:
- Only mention schemes that are provided in the context. Never invent scheme names or amounts.
- If you don't know a specific detail, say "सरकारी साइट पर confirm करें" (in the right language).
- Use the person's age / occupation / state if they mentioned it."""

SUPPORTED_LANGUAGES = [
    {"code": "hi-IN", "name": "हिन्दी (Hindi)",       "gtts_lang": "hi", "whisper_lang": "hi", "edge_voice": "hi-IN-SwaraNeural"},
    {"code": "en-IN", "name": "English (Indian)",       "gtts_lang": "en", "whisper_lang": "en", "edge_voice": "en-IN-NeerjaNeural"},
    {"code": "bn-IN", "name": "বাংলা (Bengali)",        "gtts_lang": "bn", "whisper_lang": "bn", "edge_voice": "bn-IN-TanishaaNeural"},
    {"code": "ta-IN", "name": "தமிழ் (Tamil)",          "gtts_lang": "ta", "whisper_lang": "ta", "edge_voice": "ta-IN-PallaviNeural"},
    {"code": "te-IN", "name": "తెలుగు (Telugu)",        "gtts_lang": "te", "whisper_lang": "te", "edge_voice": "te-IN-ShrutiNeural"},
    {"code": "mr-IN", "name": "मराठी (Marathi)",        "gtts_lang": "mr", "whisper_lang": "mr", "edge_voice": "mr-IN-AarohiNeural"},
    {"code": "gu-IN", "name": "ગુજરાતી (Gujarati)",     "gtts_lang": "gu", "whisper_lang": "gu", "edge_voice": "gu-IN-DhwaniNeural"},
    {"code": "kn-IN", "name": "ಕನ್ನಡ (Kannada)",        "gtts_lang": "kn", "whisper_lang": "kn", "edge_voice": "kn-IN-SapnaNeural"},
    {"code": "ml-IN", "name": "മലയാളം (Malayalam)",     "gtts_lang": "ml", "whisper_lang": "ml", "edge_voice": "ml-IN-SobhanaNeural"},
    # Punjabi and Odia use their own language codes first. If a deployment's
    # edge-tts catalog does not expose the voice, the synthesize route falls
    # through to gTTS with the same language instead of speaking Hindi.
    {"code": "pa-IN", "name": "\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40 (Punjabi)",       "gtts_lang": "pa", "whisper_lang": "pa", "edge_voice": "pa-IN-OjasNeural"},
    {"code": "od-IN", "name": "\u0b13\u0b21\u0b3c\u0b3f\u0b06 (Odia)",           "gtts_lang": "or", "whisper_lang": "or", "edge_voice": "or-IN-SukantNeural"},

    # Maithili and Bhojpuri do not have dedicated Edge/gTTS voices. Their text
    # remains in Devanagari and uses the Hindi voice as the closest script-safe
    # fallback rather than silently switching the UI language to English.
    {"code": "mai-IN", "name": "मैथिली (Maithili)",     "gtts_lang": "hi", "whisper_lang": "hi", "edge_voice": "hi-IN-SwaraNeural"},
    {"code": "bho-IN", "name": "भोजपुरी (Bhojpuri)",    "gtts_lang": "hi", "whisper_lang": "hi", "edge_voice": "hi-IN-MadhurNeural"},
]

LANG_MAP = {l["code"]: l for l in SUPPORTED_LANGUAGES}
LANG_SCRIPT = {
    "hi-IN":  "Devanagari (हिंदी)",
    "mr-IN":  "Devanagari (मराठी)",
    "mai-IN": "Devanagari (मैथिली)",
    "bho-IN": "Devanagari (भोजपुरी)",
    "bn-IN":  "Bengali script (বাংলা)",
    "ta-IN":  "Tamil script (தமிழ்)",
    "te-IN":  "Telugu script (తెలుగు)",
    "kn-IN":  "Kannada script (ಕನ್ನಡ)",
    "ml-IN":  "Malayalam script (മലയാളം)",
    "gu-IN":  "Gujarati script (ગુજરાતી)",
    "pa-IN":  "Gurmukhi script (ਪੰਜਾਬੀ)",
    "od-IN":  "Odia script (ଓଡ଼ିଆ)",
    "en-IN":  "English",
}

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
    "mai-IN": "प्रणाम! हम JanVaani छी। शिक्षा, स्वास्थ्य, किसान, घर वा रोजगार योजना सभक बारे पूछू।",
    "bho-IN": "नमस्ते! हम JanVaani बानी। शिक्षा, स्वास्थ्य, किसान, घर वा रोजगार के योजना के बारे में पूछीं।",
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


def _groq_ready() -> bool:
    return bool(GROQ_API_KEY and not GROQ_API_KEY.startswith("your_") and len(GROQ_API_KEY) > 10)


def _call_groq(messages: list, model: str) -> str:
    resp = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        json={"model": model, "messages": messages, "temperature": 0.5, "max_tokens": 512},
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        timeout=20.0,
    )
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"]
    # Strip <think>...</think> blocks emitted by reasoning models (e.g. qwen3)
    content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
    return content


# ── GET /api/voice/languages ──────────────────────────────────────────────────
@router.get("/languages")
def get_languages():
    return {"success": True, "count": len(SUPPORTED_LANGUAGES), "data": SUPPORTED_LANGUAGES}


# ── POST /api/voice/transcribe ────────────────────────────────────────────────
def _transcribe_groq(audio_bytes: bytes, filename: str, language_code: str) -> dict | None:
    """Cloud Whisper via Groq — forces the user's selected language so the
    transcript always comes back in the right script/language."""
    if not _groq_ready():
        return None
    whisper_lang = LANG_MAP.get(language_code, {}).get("whisper_lang")
    url     = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

    def _post(model: str, lang: str | None):
        data  = {"model": model, "response_format": "json"}
        if lang:
            data["language"] = lang
        files = {"file": (filename or "voice.webm", audio_bytes)}
        resp  = httpx.post(url, headers=headers, data=data, files=files, timeout=45.0)
        resp.raise_for_status()
        return resp.json()

    last_err = None
    for model_name in ("whisper-large-v3-turbo", "whisper-large-v3"):
        try:
            payload = _post(model_name, whisper_lang)
            text    = (payload.get("text") or "").strip()
            # If forced-language pass returned nothing, retry without hint
            if not text and whisper_lang:
                payload = _post(model_name, None)
                text    = (payload.get("text") or "").strip()
            if not text:
                continue
            return {
                "success":       True,
                "language":      language_code,
                "transcription": text,
                "translation":   text,
                "confidence":    0.9,
                "provider":      "groq-whisper",
                "model":         model_name,
            }
        except Exception as e:
            last_err = e
            log.warning(f"Groq Whisper {model_name} failed: {e}")
    if last_err:
        log.warning(f"Groq Whisper failed, will try local: {last_err}")
    return None


@router.post("/transcribe")
async def transcribe(
    file: UploadFile          = File(...),
    language_code: str        = Form("hi-IN"),
):
    """Transcribe speech. Always uses the user's selected language_code —
    no auto-detection, no language switching."""
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    filename    = file.filename or "voice.webm"
    groq_result = _transcribe_groq(audio_bytes, filename, language_code)
    if groq_result:
        return groq_result

    # ── Local faster-whisper fallback ─────────────────────────────────────────
    suffix   = "." + (filename.rsplit(".", 1)[-1] if "." in filename else "webm")
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

        return {
            "success":       True,
            "language":      language_code,
            "transcription": transcript,
            "translation":   transcript,
            "confidence":    round(info.language_probability if info else 0.9, 2),
            "provider":      "faster-whisper",
            "model":         WHISPER_MODEL,
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
# Priority order:
#   1. edge-tts  — Microsoft Neural voices: human-like, natural prosody, free, no API key
#   2. gTTS      — Google TTS: robotic but reliable fallback
#
async def _synthesize_edge(text: str, voice: str, language: str) -> bytes:
    """Return raw MP3 bytes via an Edge Neural voice in the requested script."""
    import edge_tts

    buf = io.BytesIO()
    communicate = edge_tts.Communicate(text, voice)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    buf.seek(0)
    data = buf.read()
    if not data:
        raise RuntimeError("edge-tts returned empty audio")
    return data


def _transliterate_for_script_fallback(text: str, language: str) -> str:
    """Convert scripts without an installed TTS voice to Devanagari phonetics."""
    from indic_transliteration import sanscript
    from indic_transliteration.sanscript import transliterate
    source = sanscript.GURMUKHI if language == "pa-IN" else sanscript.ORIYA
    return transliterate(text, source, sanscript.DEVANAGARI)


def _synthesize_gtts(text: str, gtts_lang: str) -> bytes:
    """Return raw MP3 bytes via gTTS (fallback). Never falls through to English."""
    from gtts import gTTS
    # Only try the language's own code and its base code (e.g. "hi" for "hi-IN").
    # Do NOT add English as a fallback — wrong language audio is worse than silence.
    lang_chain = list(dict.fromkeys([gtts_lang, gtts_lang.split("-")[0]]))
    last_err = None
    for lg in lang_chain:
        try:
            tts = gTTS(text=text, lang=lg, slow=False)
            buf = io.BytesIO()
            tts.write_to_fp(buf)
            buf.seek(0)
            data = buf.read()
            if data:
                return data
        except Exception as e:
            last_err = e
            log.warning(f"gTTS lang={lg} failed: {e}")
    raise last_err or RuntimeError("gTTS produced no audio")


# ── TTS text preprocessing ────────────────────────────────────────────────────
# Converts machine-friendly text into natural spoken form before sending to
# edge-tts / gTTS so dates, numbers, rupee amounts are spoken correctly
# in EVERY language — not just Hindi.

_HINDI_MONTHS = [
    "", "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
]
_EN_MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]
# Native month names for South/East Indian languages
_BN_MONTHS = ["", "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
               "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]
_TA_MONTHS = ["", "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
               "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"]
_TE_MONTHS = ["", "జనవరి", "ఫిబ్రవరి", "మార్చి", "ఏప్రిల్", "మే", "జూన్",
               "జూలై", "ఆగస్టు", "సెప్టెంబర్", "అక్టోబర్", "నవంబర్", "డిసెంబర్"]
_MR_MONTHS = ["", "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
               "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"]
_GU_MONTHS = ["", "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
               "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"]
_KN_MONTHS = ["", "ಜನವರಿ", "ಫೆಬ್ರವರಿ", "ಮಾರ್ಚ್", "ಏಪ್ರಿಲ್", "ಮೇ", "ಜೂನ್",
               "ಜುಲೈ", "ಆಗಸ್ಟ್", "ಸೆಪ್ಟೆಂಬರ್", "ಅಕ್ಟೋಬರ್", "ನವೆಂಬರ್", "ಡಿಸೆಂಬರ್"]
_ML_MONTHS = ["", "ജനുവരി", "ഫെബ്രുവരി", "മാർച്ച്", "ഏപ്രിൽ", "മേയ്", "ജൂൺ",
               "ജൂലൈ", "ഓഗസ്റ്റ്", "സെപ്റ്റംബർ", "ഒക്ടോബർ", "നവംബർ", "ഡിസംബർ"]
_PA_MONTHS = ["", "ਜਨਵਰੀ", "ਫ਼ਰਵਰੀ", "ਮਾਰਚ", "ਅਪ੍ਰੈਲ", "ਮਈ", "ਜੂਨ",
               "ਜੁਲਾਈ", "ਅਗਸਤ", "ਸਤੰਬਰ", "ਅਕਤੂਬਰ", "ਨਵੰਬਰ", "ਦਸੰਬਰ"]
_OD_MONTHS = ["", "ଜାନୁଆରୀ", "ଫେବ୍ରୁଆରୀ", "ମାର୍ଚ୍ଚ", "ଏପ୍ରିଲ", "ମଇ", "ଜୁନ",
               "ଜୁଲାଇ", "ଅଗଷ୍ଟ", "ସେପ୍ଟେମ୍ବର", "ଅକ୍ଟୋବର", "ନଭେମ୍ବର", "ଡିସେମ୍ବର"]

_MONTHS_BY_LANG = {
    "hi-IN": _HINDI_MONTHS, "mr-IN": _MR_MONTHS, "mai-IN": _HINDI_MONTHS, "bho-IN": _HINDI_MONTHS,
    "bn-IN": _BN_MONTHS, "ta-IN": _TA_MONTHS, "te-IN": _TE_MONTHS,
    "gu-IN": _GU_MONTHS, "kn-IN": _KN_MONTHS, "ml-IN": _ML_MONTHS,
    "pa-IN": _PA_MONTHS, "od-IN": _OD_MONTHS, "en-IN": _EN_MONTHS,
}

# Native words for "rupees" per language
_RUPEE_WORD = {
    "hi-IN": "रुपये",  "mr-IN": "रुपये",  "mai-IN": "रुपइया", "bho-IN": "रुपइया",
    "bn-IN": "টাকা",   "ta-IN": "ரூபாய்", "te-IN": "రూపాయలు",
    "gu-IN": "રૂપિયા",  "kn-IN": "ರೂಪಾಯಿ", "ml-IN": "രൂപ",
    "pa-IN": "ਰੁਪਏ",   "od-IN": "ଟଙ୍କା",  "en-IN": "rupees",
}

# Native words for "percent" per language
_PERCENT_WORD = {
    "hi-IN": "प्रतिशत",  "mr-IN": "टक्के",    "mai-IN": "प्रतिशत", "bho-IN": "प्रतिशत",
    "bn-IN": "শতাংশ",    "ta-IN": "சதவீதம்",  "te-IN": "శాతం",
    "gu-IN": "ટકા",      "kn-IN": "ಶೇಕಡಾ",   "ml-IN": "ശതമാനം",
    "pa-IN": "ਫ਼ੀਸਦੀ",   "od-IN": "ପ୍ରତିଶତ",  "en-IN": "percent",
}

def _num_to_words_hi(n: int) -> str:
    """Convert integer to Hindi words (handles 0–9,99,99,999).
    Uses the correct spoken Hindi forms for all 1-99 compound numbers.
    """
    if n == 0:
        return "शून्य"

    # Complete 1-99 spoken Hindi forms (the way people actually say them)
    _UNITS = [
        "", "एक", "दो", "तीन", "चार", "पांच", "छह", "सात", "आठ", "नौ",
        "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह",
        "अठारह", "उन्नीस", "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस",
        "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस", "तीस",
        "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस",
        "सैंतीस", "अड़तीस", "उनतालीस", "चालीस", "इकतालीस", "बयालीस",
        "तैंतालीस", "चवालीस", "पैंतालीस", "छियालीस", "सैंतालीस",
        "अड़तालीस", "उनचास", "पचास", "इक्यावन", "बावन", "तिरपन",
        "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ", "साठ",
        "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सड़सठ",
        "अड़सठ", "उनहत्तर", "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर",
        "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उनासी",
        "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी",
        "छियासी", "सत्तासी", "अट्ठासी", "नवासी", "नब्बे", "इक्यानवे",
        "बानवे", "तिरानवे", "चौरानवे", "पचानवे", "छियानवे", "सत्तानवे",
        "अट्ठानवे", "निन्यानवे",
    ]

    def _below_hundred(x: int) -> str:
        if 0 <= x <= 99:
            return _UNITS[x]
        return str(x)  # safety fallback

    parts = []
    crore, n = divmod(n, 10_000_000)
    lakh,  n = divmod(n, 100_000)
    hazar, n = divmod(n, 1_000)
    sau,   n = divmod(n, 100)

    if crore:  parts.append(f"{_below_hundred(crore)} करोड़")
    if lakh:   parts.append(f"{_below_hundred(lakh)} लाख")
    if hazar:  parts.append(f"{_below_hundred(hazar)} हज़ार")
    if sau:    parts.append(f"{_UNITS[sau]} सौ")
    if n:      parts.append(_below_hundred(n))
    return " ".join(parts)


def _preprocess_for_tts(text: str, language: str) -> str:
    """Return text ready for natural speech in the given language.
    Uses per-language native words for rupees, percent, and month names
    so every language sounds natural — not a mix of native + English words.
    """
    is_hindi_script = language in ("hi-IN", "mr-IN", "mai-IN", "bho-IN", "pa-IN")
    is_english      = language == "en-IN"

    months      = _MONTHS_BY_LANG.get(language, _EN_MONTHS)
    rupee_word  = _RUPEE_WORD.get(language, "₹")
    percent_word = _PERCENT_WORD.get(language, "%")

    # 1. Strip markdown: **bold**, *italic*, _underline_, #headings, bullet markers
    text = re.sub(r"\*{1,2}([^*]+)\*{1,2}", r"\1", text)
    text = re.sub(r"_{1,2}([^_]+)_{1,2}", r"\1", text)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*[-•·]\s+", ", ", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+[.)]\s+", ", ", text, flags=re.MULTILINE)

    # 2. Date patterns  DD/MM/YYYY  DD-MM-YYYY  YYYY-MM-DD
    def _replace_date(m):
        try:
            g = m.groups()
            if len(g[0]) == 4:          # YYYY-MM-DD
                y, mo, d = int(g[0]), int(g[1]), int(g[2])
            else:                        # DD/MM/YYYY or DD-MM-YYYY
                d, mo, y = int(g[0]), int(g[1]), int(g[2])
            if not (1 <= mo <= 12 and 1 <= d <= 31):
                return m.group(0)
            month_name = months[mo]
            if is_hindi_script:
                return f"{_num_to_words_hi(d)} {month_name} {y}"
            else:
                return f"{d} {month_name} {y}"
        except Exception:
            return m.group(0)

    text = re.sub(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", _replace_date, text)
    text = re.sub(r"\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\b", _replace_date, text)

    # 3. Rupee/money amounts  ₹6,000  ₹1.5 lakh  Rs. 500
    def _replace_rupee(m):
        raw = m.group(1).replace(",", "")
        try:
            val = float(raw)
        except ValueError:
            return m.group(0)
        suffix = (m.group(2) or "").strip().lower()
        if "lakh" in suffix or "lac" in suffix:
            val *= 100_000
        elif "crore" in suffix or "करोड़" in suffix:
            val *= 10_000_000
        elif "hazar" in suffix or "हज़ार" in suffix or "thousand" in suffix:
            val *= 1_000
        int_val = int(val)
        if is_hindi_script:
            return f"{_num_to_words_hi(int_val)} {rupee_word}"
        else:
            return f"{int_val} {rupee_word}"

    text = re.sub(
        r"₹\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|करोड़|hazar|हज़ार|thousand)?",
        lambda m: _replace_rupee(m) + " ",
        text, flags=re.IGNORECASE,
    )
    text = re.sub(
        r"[Rr]s\.?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|hazar|thousand)?",
        lambda m: _replace_rupee(m) + " ",
        text, flags=re.IGNORECASE,
    )

    # 4. Plain large numbers with commas  6,000  →  spoken form
    def _replace_number(m):
        raw = m.group(0).replace(",", "")
        try:
            val = int(raw)
        except ValueError:
            return m.group(0)
        if val < 100:
            return m.group(0)
        if is_hindi_script:
            return _num_to_words_hi(val)
        return raw             # other languages: remove commas, keep digits

    text = re.sub(r"\b\d{1,3}(?:,\d{3})+\b", _replace_number, text)

    # 5. Percentages  80%  →  native word
    text = re.sub(r"(\d+)\s*%", rf"\1 {percent_word}", text)

    # 6. URLs — skip them entirely
    text = re.sub(r"https?://\S+", "", text)

    # 7. Collapse extra whitespace / newlines
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s{2,}", " ", text).strip()

    return text


@router.post("/synthesize")
async def synthesize(body: dict):
    text     = (body.get("text") or "").strip()
    language = body.get("language", "hi-IN")

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Preprocess text for natural speech (expand dates, numbers, rupees, strip markdown)
    text = _preprocess_for_tts(text, language)

    # Cap at 500 chars to keep latency acceptable
    text = text[:500]

    lang_cfg   = LANG_MAP.get(language, LANG_MAP["hi-IN"])
    edge_voice = lang_cfg.get("edge_voice")
    gtts_lang  = lang_cfg.get("gtts_lang", "hi")

    try:
        # ── 1. edge-tts neural voice (preferred for all languages) ───────────
        if edge_voice:
            try:
                audio_bytes = await _synthesize_edge(text, edge_voice, language)
                audio_b64   = base64.b64encode(audio_bytes).decode("utf-8")
                return {
                    "success":  True,
                    "language": language,
                    "voice":    edge_voice,
                    "text":     text,
                    "audioUrl": f"data:audio/mpeg;base64,{audio_b64}",
                    "provider": "edge-tts",
                }
            except Exception as e:
                log.warning(f"edge-tts voice={edge_voice} failed: {e} — falling back to gTTS")

        # ── 2. gTTS fallback in the requested language ───────────────────────
        try:
            audio_bytes = _synthesize_gtts(text, gtts_lang)
            fallback_voice = f"gtts-{gtts_lang}"
        except Exception as gtts_error:
            # Google currently has no pa/or voices. Keep the user's script in
            # the response and provide guaranteed speech via the closest
            # script-safe Hindi Neural voice as a last-resort audio fallback.
            if language not in ("pa-IN", "od-IN"):
                raise
            log.warning(f"gTTS language={gtts_lang} unavailable: {gtts_error}")
            fallback_text = _transliterate_for_script_fallback(text, language)
            audio_bytes = await _synthesize_edge(fallback_text, "hi-IN-SwaraNeural", "hi-IN")
            fallback_voice = "hi-IN-SwaraNeural-script-fallback"

        audio_b64   = base64.b64encode(audio_bytes).decode("utf-8")
        return {
            "success":  True,
            "language": language,
            "voice":    fallback_voice,
            "text":     text,
            "audioUrl": f"data:audio/mp3;base64,{audio_b64}",
            "provider": "gtts",
        }

    except Exception as e:
        log.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


# ── POST /api/voice/process  (full pipeline) ──────────────────────────────────

def _extract_dynamic_scheme(
    user_query: str,
    groq_response: str,
    language: str,
    source_url: str | None = None,
    source_title: str | None = None,
) -> dict | None:
    """
    Ask Groq to extract a structured scheme card from its own prose response.
    Returns a dict shaped like a DB scheme object, or None on failure.
    The extraction uses English internally so JSON parsing is reliable,
    then localised text comes from the already-translated groq_response.
    """
    if not groq_response or not groq_response.strip():
        return None

    # Build extraction prompt — always in English for reliable JSON output
    extract_prompt = (
        "Extract structured information about the government scheme(s) mentioned in the "
        "RESPONSE below and return ONLY a JSON object (no markdown, no explanation).\n\n"
        "Rules:\n"
        "- name: scheme name as mentioned (keep original script if non-English)\n"
        "- category: one of Agriculture|Education|Housing|Healthcare|Employment|"
        "Financial Inclusion|Women Welfare|Disability|Senior Citizens|Business|Social Welfare\n"
        "- description: 1-2 sentence summary in the same language as the RESPONSE\n"
        "- benefits: array of up to 4 key benefits (strings, same language as RESPONSE)\n"
        "- requiredDocuments: array of document names in English (e.g. ['Aadhaar', 'Income certificate'])\n"
        "- applicationSteps: array of up to 5 steps in same language as RESPONSE\n"
        "- officialSource: official URL if mentioned, else empty string\n"
        "- eligibility: 1-sentence eligibility in same language as RESPONSE\n\n"
        f"USER QUERY: {user_query}\n\n"
        f"RESPONSE:\n{groq_response[:1200]}\n\n"
        "Return ONLY the JSON object. If multiple schemes are mentioned, pick the most relevant one."
    )

    try:
        raw = _call_groq(
            [{"role": "user", "content": extract_prompt}],
            GROQ_MODELS[0],
        )
        # Strip markdown fences if present
        clean = raw.strip()
        if clean.startswith("```"):
            clean = re.sub(r"^```[a-z]*\n?", "", clean)
            clean = re.sub(r"\n?```$", "", clean)
        data = json.loads(clean.strip())
    except Exception as e:
        log.warning(f"Dynamic scheme extraction failed: {e}")
        return None

    # Validate minimum required fields
    name = (data.get("name") or "").strip()
    if not name:
        return None

    # Build a card shaped like a DB scheme (with extra isDynamic flag)
    return {
        "id":               f"dynamic-{abs(hash(name)) % 100000}",
        "name":             name,
        "category":         data.get("category") or local_category_from_query(user_query),
        "description":      (data.get("description") or groq_response[:300]).strip(),
        "benefits":         data.get("benefits") or [],
        "requiredDocuments": data.get("requiredDocuments") or [],
        "applicationSteps": data.get("applicationSteps") or [],
        "officialSource":   data.get("officialSource") or source_url or "",
        "eligibility":      data.get("eligibility") or "",
        "matchPercentage":  0,
        "isDynamic":        True,
        "sourceTitle":      source_title or "",
    }


def local_category_from_query(query: str) -> str:
    """Best-effort category from the query text for the dynamic card header."""
    from services.scheme_service import extract_entities
    result = extract_entities(query)
    return result.get("category") or "Social Welfare"


@router.post("/process")
async def process_voice(body: dict):
    user_text    = (body.get("input") or "").strip()
    session_id   = body.get("sessionId") or f"sess-{id(body)}"
    language     = body.get("language", "hi-IN")
    user_profile = body.get("userProfile") or {}

    if not re.match(r"^[a-z]{2,3}-IN$", language, re.I):
        language = "hi-IN"

    response_language = language if language in LANG_MAP else "hi-IN"

    # Local scheme analysis (language-agnostic matching)
    local = generate_response(user_text, {"language": response_language, "userProfile": user_profile})

    # ── Short-circuit for greetings — no schemes, no web search, no Groq ────
    if local.get("intent") == "greeting":
        user_name  = (user_profile.get("name") or "").strip()
        lang_info  = LANG_MAP.get(response_language, {})
        lang_name  = lang_info.get("name", response_language)
        lang_script = LANG_SCRIPT.get(response_language, lang_name)
        _GREETING_NATIVE = {
            "hi-IN":  "हिंदी में जवाब दो।",
            "bn-IN":  "বাংলায় উত্তর দাও।",
            "ta-IN":  "தமிழில் பதில் சொல்லுங்கள்.",
            "te-IN":  "తెలుగులో సమాధానం చెప్పండి.",
            "mr-IN":  "मराठीत उत्तर द्या.",
            "gu-IN":  "ગુજરાતીમાં જવાબ આપો.",
            "kn-IN":  "ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ ಕೊಡಿ.",
            "ml-IN":  "മലയാളത്തിൽ ഉത്തരം പറയൂ.",
            "pa-IN":  "ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ।",
            "od-IN":  "ଓଡ଼ିଆରେ ଉତ୍ତର ଦିଅନ୍ତୁ।",
            "mai-IN": "मैथिली में जवाब दऊ।",
            "bho-IN": "भोजपुरी में जवाब दीं।",
            "en-IN":  "Reply in friendly Indian English.",
        }
        native_instruction = _GREETING_NATIVE.get(response_language, f"Reply in {lang_name}.")
        # Ask Groq for a warm, language-correct greeting
        greeting_text = None
        if _groq_ready():
            try:
                greeting_text = _call_groq([
                    {"role": "system", "content": (
                        f"You are JanVaani, a warm voice assistant for Indian government schemes.\n"
                        f"OUTPUT LANGUAGE: {lang_script}. {native_instruction}\n"
                        f"Write ONE short friendly greeting sentence and invite the user to ask about schemes.\n"
                        f"Sound like a helpful neighbour, not a robot. No English except scheme acronyms."
                    )},
                    {"role": "user", "content": user_text},
                ], GROQ_MODELS[0])
            except Exception:
                pass
        if not greeting_text:
            greeting_text = FALLBACK_RESPONSES.get(response_language, FALLBACK_RESPONSES["en-IN"])

        # Save to history so follow-ups have context
        if session_id not in _sessions:
            _sessions[session_id] = []
        _sessions[session_id].append({"role": "user",      "content": user_text})
        _sessions[session_id].append({"role": "assistant", "content": greeting_text})

        return {
            "success":          True,
            "sessionId":        session_id,
            "language":         response_language,
            "responseLanguage": response_language,
            "detectedLanguage": response_language,
            "transcription":    user_text,
            "translation":      user_text,
            "intent":           "greeting",
            "category":         None,
            "entities":         local.get("entities", {}),
            "response":         greeting_text,
            "suggestedSchemes": [],
            "provider":         "groq" if greeting_text != FALLBACK_RESPONSES.get(response_language) else "local-fallback",
            "answerType":       "greeting",
            "source":           None,
            "searchStatus":     "greeting",
        }

    # ── Decide whether to run web search ────────────────────────────────────
    # Run web search when:
    #   (a) No local match at all, OR
    #   (b) Local match is weak (best scheme < 50% match) — might be a follow-up or edge query, OR
    #   (c) This is a follow-up turn (session already has history) — user may be asking
    #       something detail-specific (documents, steps, eligibility) that benefits from
    #       a live government source even if we have a scheme card.
    is_followup = bool(_sessions.get(session_id))
    best_match_pct = max(
        (s.get("matchPercentage", 0) for s in (local.get("suggestedSchemes") or [])),
        default=0,
    )
    weak_local = local["answerable"] and best_match_pct < 50
    needs_web = (
        not local["answerable"]
        or weak_local
        or (is_followup and local["intent"] in (
            "eligibility_check", "application_help", "document_help", "scheme_discovery"
        ))
    )

    source        = None
    answer_type   = "scheme" if local["answerable"] else "local"
    search_status = "local-match" if local["answerable"] else "pending"

    if needs_web and is_web_search_configured():
        govt_query = local["intent"] in (
            "scheme_discovery", "eligibility_check", "application_help", "document_help"
        ) or bool(local["category"])
        try:
            source = await search_web(user_text, response_language, government_only=govt_query)
            if source and source.get("extract"):
                answer_type   = "web" if not local["answerable"] else "scheme+web"
                search_status = "web-match"
            else:
                search_status = "no-result" if not local["answerable"] else "local-match"
        except Exception:
            search_status = "search-unavailable"
    elif not local["answerable"]:
        search_status = "web-search-not-configured"

    # ── Build messages for Groq ──────────────────────────────────────────────
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    lang_info   = LANG_MAP.get(response_language, {})
    lang_name   = lang_info.get("name", response_language)
    lang_script = LANG_SCRIPT.get(response_language, lang_name)

    # Per-language confirmation phrase injected into the prompt so the model
    # sees the target language in its own script — not just an English label.
    _LANG_CONFIRM = {
        "hi-IN":  "हिंदी में जवाब दो।",
        "bn-IN":  "বাংলায় উত্তর দাও।",
        "ta-IN":  "தமிழில் பதில் சொல்லுங்கள்.",
        "te-IN":  "తెలుగులో సమాధానం చెప్పండి.",
        "mr-IN":  "मराठीत उत्तर द्या.",
        "gu-IN":  "ગુજરાતીમાં જવાબ આપો.",
        "kn-IN":  "ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ ಕೊಡಿ.",
        "ml-IN":  "മലയാളത്തിൽ ഉത്തരം പറയൂ.",
        "pa-IN":  "ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ।",
        "od-IN":  "ଓଡ଼ିଆରେ ଉତ୍ତର ଦିଅନ୍ତୁ।",
        "mai-IN": "मैथिली में जवाब दऊ।",
        "bho-IN": "भोजपुरी में जवाब दीं।",
        "en-IN":  "Reply in Indian English.",
    }
    lang_confirm = _LANG_CONFIRM.get(response_language, f"Reply in {lang_name}.")

    messages[0]["content"] += (
        f"\n\n--- LANGUAGE LOCK ---\n"
        f"OUTPUT LANGUAGE: {lang_script}. {lang_confirm}\n"
        f"RULE: Every single word must be in {lang_script}. "
        f"NO Roman/Latin letters. NO English except proper scheme names like PM-KISAN or PMAY. "
        f"NO Hinglish or transliteration. If you write even one English word (other than a scheme acronym), you have failed.\n"
        f"--- END LANGUAGE LOCK ---"
    )

    # User profile / entities
    extracted = local.get("entities") or {}
    filled = [f"{k}: {v}" for k, v in extracted.items() if v not in (None, "", [])]
    if user_profile:
        filled.extend(f"{k}: {v}" for k, v in user_profile.items() if v and k not in ("sessionId",))
    if filled:
        messages.append({"role": "system", "content": "Known user details: " + ", ".join(filled)})

    # ── Rich scheme context ──────────────────────────────────────────────────
    # Send full scheme details so Groq can answer ANY follow-up question:
    # documents, steps, eligibility, benefits, official URL — nothing truncated.
    schemes = local.get("suggestedSchemes") or []
    if schemes:
        blocks = []
        for s in schemes[:5]:
            name        = s.get("name", "")
            sid_val     = s.get("id", "")
            category    = s.get("category", "")
            description = s.get("description", "")
            match_pct   = s.get("matchPercentage", 0)
            benefits    = (s.get("benefits") or [])
            steps       = (s.get("applicationSteps") or [])
            docs        = (s.get("requiredDocuments") or [])
            eligibility = s.get("eligibilityRules") or {}
            official    = s.get("officialSource", "")

            # Eligibility summary
            elig_parts = []
            if eligibility.get("age"):
                elig_parts.append(f"Age {eligibility['age'].get('min',0)}-{eligibility['age'].get('max',100)}")
            if eligibility.get("gender") and eligibility["gender"] != "all":
                elig_parts.append(f"Gender: {eligibility['gender']}")
            if eligibility.get("income", {}).get("max"):
                elig_parts.append(f"Income up to ₹{eligibility['income']['max']:,}")
            if eligibility.get("categories"):
                elig_parts.append(f"For: {', '.join(eligibility['categories'])}")

            block = (
                f"[SCHEME id={sid_val} category={category} match={match_pct}%]\n"
                f"Name: {name}\n"
                f"Description: {description}\n"
                f"Eligibility: {'; '.join(elig_parts) if elig_parts else 'Open to all'}\n"
                f"Benefits: {'; '.join(benefits)}\n"
                f"Documents needed: {', '.join(docs)}\n"
                f"Steps ({len(steps)}): {' → '.join(steps)}\n"
                f"Official site: {official}"
            )
            blocks.append(block)

        messages.append({
            "role":    "system",
            "content": (
                "SCHEME DATA (use only these — do not invent others):\n\n"
                + "\n\n---\n\n".join(blocks)
                + "\n\nIMPORTANT: Translate/present all scheme information in the OUTPUT LANGUAGE above. "
                "Document names like Aadhaar, Ration Card can stay as proper nouns."
            ),
        })

    # Web search grounding (supplements scheme data or provides it when no local match)
    if source and source.get("extract"):
        messages.append({
            "role":    "system",
            "content": (
                f"[WEB SOURCE for grounding — do NOT quote English from this, translate the facts]\n"
                f"Source: {source['title']} ({source['url']})\n"
                f"{source['extract']}\n"
                f"Use the facts from above but express them in the OUTPUT LANGUAGE only."
            ),
        })

    # Session history — last 10 messages (5 turns) for follow-up context
    hist = _sessions.get(session_id, [])
    for turn in hist[-10:]:
        messages.append({"role": turn["role"], "content": turn["content"]})

    messages.append({"role": "user", "content": user_text})

    # Call Groq or fallback
    assistant_text = None
    provider       = "local-fallback"

    # Always try Groq first so the response is in the correct language.
    # The local match is passed as context (scheme list above), not as the answer.
    if _groq_ready():
        for model in GROQ_MODELS:
            try:
                assistant_text = _call_groq(messages, model)
                provider       = "groq"
                log.info(f"Groq responded via {model}")
                break
            except Exception as e:
                log.warning(f"Groq model {model} failed: {e}")

    # Groq unavailable / failed — use translated local response if available,
    # otherwise web source or hardcoded fallback.
    if not assistant_text:
        # Try to get a language-specific local response
        local_lang_response = local.get("response") or ""
        # If the local response is in English but we need another language, use fallback
        if local_lang_response and response_language == "en-IN":
            assistant_text = local_lang_response
            provider       = "local"
        elif local_lang_response and local.get("answerable"):
            # local response might be in the right language (ai_service has per-lang templates)
            assistant_text = local_lang_response
            provider       = "local"
        elif source and source.get("extract"):
            assistant_text = f"{source['title']}: {source['extract']}"
            provider       = "web-fallback"
        else:
            assistant_text = FALLBACK_RESPONSES.get(response_language, FALLBACK_RESPONSES["en-IN"])

    # Save history
    if session_id not in _sessions:
        _sessions[session_id] = []
    _sessions[session_id].append({"role": "user",      "content": user_text})
    _sessions[session_id].append({"role": "assistant", "content": assistant_text})
    if len(_sessions[session_id]) > 40:
        _sessions[session_id] = _sessions[session_id][-40:]

    # ── Determine if the suggested schemes are actually relevant ─────────────
    # Rules:
    #   1. If Groq's answer contains "not found / doesn't exist" patterns → always False
    #   2. If scheme names/IDs appear in the answer → True
    #   3. Otherwise → False (occupation-based fallback schemes shouldn't show)
    suggested = local["suggestedSchemes"] or []
    schemes_relevant = False

    # Rule 1: negation patterns — Groq told the user the scheme doesn't exist
    NEGATION_PATTERNS = [
        r"नहीं है", r"नहीं मिली", r"नहीं मिलती", r"exist नहीं", r"ऐसी कोई",
        r"no such scheme", r"does not exist", r"doesn't exist", r"not found",
        r"no scheme named", r"இல்லை", r"లేదు", r"ಇಲ್ಲ", r"ഇല്ല",
        r"নেই", r"ਨਹੀਂ ਹੈ", r"ନାହିଁ",
        r"such.*scheme.*not", r"scheme.*not.*exist", r"not.*government.*scheme",
    ]
    is_negation = any(re.search(p, assistant_text, re.IGNORECASE) for p in NEGATION_PATTERNS)

    if is_negation:
        schemes_relevant = False
    elif suggested and assistant_text:
        answer_lower = assistant_text.lower()
        for s in suggested:
            s_id   = (s.get("id")   or "").lower()
            s_name = (s.get("name") or "").lower()
            # Match on ID or on meaningful words (>3 chars) from the scheme name
            # Use at least 2 word matches to reduce false positives
            name_words = [w for w in s_name.split() if len(w) > 3]
            hits = sum(1 for w in name_words if w in answer_lower)
            if s_id in answer_lower or hits >= max(1, min(2, len(name_words))):
                schemes_relevant = True
                break
    elif not suggested:
        schemes_relevant = False  # no schemes → nothing to show

    # ── Dynamic scheme card when DB has no match ─────────────────────────────
    # If Groq answered but no DB scheme matched, parse a structured card from the
    # response text so the frontend can render a proper card instead of raw prose.
    dynamic_scheme = None
    if not schemes_relevant and assistant_text and _groq_ready():
        dynamic_scheme = _extract_dynamic_scheme(
            user_text, assistant_text, response_language,
            source_url=source.get("url") if source else None,
            source_title=source.get("title") if source else None,
        )

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
        "suggestedSchemes": suggested if schemes_relevant else [],
        "schemesRelevant":  schemes_relevant,
        "dynamicScheme":    dynamic_scheme,
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
