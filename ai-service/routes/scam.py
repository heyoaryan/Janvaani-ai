# routes/scam.py

import re
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/scam", tags=["Scam Check"])

# ── Heuristic indicators ──────────────────────────────────────────────────────

TEXT_INDICATORS = [
    {"id": "urgency",           "label": "Urgency / fear tactics",              "pattern": r"(तुरंत|जल्दी|immediately|urgent|अभी|last\s*chance|अंतिम)",          "weight": 2},
    {"id": "otp-request",       "label": "OTP / password request",              "pattern": r"(otp|password|पासवर्ड|पिन|pin|verify.*account)",                    "weight": 3},
    {"id": "prize",             "label": "Unexpected prize / lottery",           "pattern": r"(लॉटरी|lottery|prize|इनाम|winner|जीत|₹.*crore|करोड़)",             "weight": 3},
    {"id": "govt-impersonation","label": "Fake government impersonation",       "pattern": r"(पीएम|pm|सरकार|government|योजना.*link|scheme.*click)",               "weight": 2},
    {"id": "link",              "label": "Suspicious link / click instruction",  "pattern": r"(click\s*here|यहां\s*क्लिक|http|bit\.ly|tinyurl|link.*below)",      "weight": 2},
    {"id": "payment",           "label": "Upfront payment demand",              "pattern": r"(pay.*fee|फीस\s*दें|transfer.*रु|send.*money|पैसे\s*भेजें)",        "weight": 3},
    {"id": "kyc",               "label": "Fake KYC update",                     "pattern": r"(kyc|केवाईसी|update.*account|खाता\s*अपडेट)",                        "weight": 2},
]

URL_INDICATORS = [
    {"id": "shortener",    "label": "URL shortener used",               "pattern": r"(bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly)",                                      "weight": 2},
    {"id": "http",         "label": "Not secure (no HTTPS)",            "pattern": r"^http://",                                                                    "weight": 2},
    {"id": "typosquat",    "label": "Look-alike / typosquatted domain", "pattern": r"(govt|g0v|gov-in|uidia|pm-kisan|paytm|sbi|irctc)[^a-z]",                     "weight": 3},
    {"id": "free-host",    "label": "Free/subdomain hosting",           "pattern": r"(\.blogspot\.|\.wordpress\.|\.weebly\.|netlify\.app|vercel\.app)",            "weight": 1},
    {"id": "long-random",  "label": "Excessive random subdomains",      "pattern": r"(\w+\.){4,}",                                                                 "weight": 2},
]


def _analyze(text: str, indicators: list) -> dict:
    found = []
    score = 0
    for ind in indicators:
        if re.search(ind["pattern"], text, re.IGNORECASE):
            found.append({"id": ind["id"], "label": ind["label"]})
            score += ind["weight"]
    risk = "high" if score >= 5 else ("medium" if score >= 2 else "low")
    return {"found": found, "score": score, "risk": risk}


# POST /api/scam/analyze
@router.post("/analyze")
def analyze_scam(body: dict):
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    res = _analyze(text, TEXT_INDICATORS)
    advice = (
        "⚠️ यह संदेश बहुत high-risk है। कोई OTP, पासवर्ड या पैसे शेयर न करें। सीधे आधिकारिक वेबसाइट पर जाएं।"
        if res["risk"] == "high" else
        "⚠️ इस संदेश में संदिग्ध संकेत हैं। सावधानी बरतें और लिंक पर क्लिक न करें।"
        if res["risk"] == "medium" else
        "इस संदेश में कोई स्पष्ट स्कैम संकेत नहीं मिला, फिर भी सावधानी बरतें।"
    )
    return {
        "success":          True,
        "riskLevel":        res["risk"],
        "riskScore":        res["score"],
        "indicatorsFound":  res["found"],
        "safetyAdvice":     advice,
        "note":             "Heuristic engine. Integrate a real threat-intel / ML classifier for production.",
    }


# POST /api/scam/check-url
@router.post("/check-url")
def check_url(body: dict):
    url = body.get("url", "")
    if not url:
        raise HTTPException(status_code=400, detail="url is required")

    res = _analyze(url, URL_INDICATORS)
    advice = (
        "⚠️ यह लिंक खतरनाक लग रहा है। इस पर क्लिक न करें और न ही कोई जानकारी भरें।"
        if res["risk"] == "high" else
        "⚠️ इस लिंक में संदिग्ध लक्षण हैं। सत्यापित करें कि यह आधिकारिक साइट है या नहीं।"
        if res["risk"] == "medium" else
        "इस लिंक में कोई स्पष्ट खतरा नहीं दिखा। फिर भी आधिकारिक डोमेन की जांच करें।"
    )
    return {
        "success":         True,
        "url":             url,
        "riskLevel":       res["risk"],
        "riskScore":       res["score"],
        "indicatorsFound": res["found"],
        "safetyAdvice":    advice,
    }
