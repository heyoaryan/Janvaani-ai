# services/scheme_service.py
# Scheme matching engine — ported from Node.js schemeService.js

from typing import Optional
from data.schemes import SCHEMES
from services.eligibility_service import evaluate_eligibility

# ── Data access ───────────────────────────────────────────────────────────────

def load_schemes() -> list:
    return SCHEMES


def get_scheme_by_id(scheme_id: str) -> Optional[dict]:
    return next((s for s in SCHEMES if s["id"] == scheme_id), None)


# ── Search & filter ───────────────────────────────────────────────────────────

def search_schemes(category: str = None, state: str = None, search: str = None) -> list:
    results = load_schemes()

    if category:
        results = [s for s in results if s["category"].lower() == category.lower()]

    if state:
        results = [
            s for s in results
            if str(s.get("state", "")).lower() in ("all india", "all", state.lower())
            or state.lower() in str(s.get("state", "")).lower()
            or "all" in [x.lower() for x in (s.get("eligibilityRules") or {}).get("states", [])]
        ]

    if search:
        q = search.lower()
        results = [
            s for s in results
            if q in " ".join([
                s["name"],
                s["description"],
                s["category"],
                *s.get("keywords", []),
            ]).lower()
        ]

    return results


STOPWORDS = {
    "i", "me", "my", "we", "our", "a", "an", "the", "for", "to", "of", "in", "on", "is", "am",
    "mai", "hu", "hoon", "hun", "konsi", "kaunsi", "milegi", "milega", "milenge", "batao",
    "please", "want", "need", "tell", "about", "kya", "hai", "hain", "ke", "ki", "ka", "ko",
    "se", "aur", "ya", "bhi", "mujhe", "mere", "meri", "batao", "bataiye", "chahiye", "yojana",
    "yojna", "scheme", "schemes", "help", "mil", "sakta", "sakti", "sakte", "liye", "wala",
    "मुझे", "मेरे", "मेरी", "क्या", "है", "के", "की", "का", "को", "से", "और", "बताओ",
    "चाहिए", "योजना", "मदद", "लिए", "हैं", "एक",
}

GENERIC_SCHEME_WORDS = {
    "scheme", "schemes", "yojana", "yojna", "yojanae", "benefit", "benefits",
    "योजना", "योजनाएं", "প্রকল্প", "திட்டம்", "పథకం", "योजना", "યોજના", "ಯೋಜನೆ",
    "പദ്ധതി", "ਯੋਜਨਾ", "ଯୋଜନା",
}


def _haystack(scheme: dict) -> str:
    return " ".join([
        scheme.get("name") or "",
        scheme.get("description") or "",
        scheme.get("category") or "",
        *scheme.get("keywords", []),
    ]).lower()


def _tokenize(text: str) -> list:
    import re
    lower = text.lower()
    lower = re.sub(r"\bkishan\b", "kisan", lower)
    lower = re.sub(r"\bkisaan\b", "kisan", lower)
    lower = re.sub(r"\byojna\b", "yojana", lower)
    raw = re.findall(r"[a-zA-Z0-9]+|[ऀ-ॿ]+|[ঀ-৿]+|[஀-௿]+|[ఀ-౿]+|[ಀ-೿]+|[ഀ-ൿ]+|[઀-૿]+|[਀-੿]+|[଀-୿]+", lower)
    return [w for w in raw if w not in STOPWORDS and len(w) > 1]


def full_text_search(text: str = "") -> list:
    words = _tokenize(text)
    aliases = _alias_terms(text)
    terms = list(dict.fromkeys(words + aliases))
    if not terms:
        return []

    scored = []
    for s in load_schemes():
        hay = _haystack(s)
        hits = sum(1 for w in terms if w in hay)
        if hits > 0:
            scored.append((hits, s))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [s for _, s in scored]


def _alias_terms(text: str) -> list:
    lower = text.lower()
    aliases = []
    for cat, hints in CATEGORY_HINTS.items():
        if any(h in lower for h in hints):
            aliases.append(cat.lower())
            aliases.extend(h for h in hints if h.isascii())
    return aliases


def match_schemes_for_query(text: str, profile: dict | None = None, limit: int = 5) -> list:
    """Language-agnostic matcher: same query meaning → same schemes."""
    extracted = extract_entities(text)
    entities = {**(profile or {}), **{k: v for k, v in extracted["entities"].items() if v is not None}}
    if not entities.get("occupation") and (profile or {}).get("occupation"):
        entities["occupation"] = profile["occupation"]
    if not entities.get("age") and (profile or {}).get("age"):
        entities["age"] = profile["age"]
    if not entities.get("income") and (profile or {}).get("annualIncome"):
        entities["income"] = profile["annualIncome"]

    category = extracted["category"]
    by_id = {}

    if category:
        for s in search_schemes(category=category):
            by_id[s["id"]] = s

    for s in full_text_search(text):
        by_id.setdefault(s["id"], s)

    if not by_id and entities.get("occupation"):
        occ = str(entities["occupation"]).lower()
        occ_to_cat = {
            "farmer": "Agriculture",
            "student": "Education",
            "unemployed": "Employment",
            "self_employed": "Business",
            "self-employed": "Business",
            "business": "Business",
        }
        mapped = occ_to_cat.get(occ)
        if mapped:
            for s in search_schemes(category=mapped):
                by_id[s["id"]] = s

    ranked = rank_schemes(list(by_id.values()), entities) if by_id else []
    if category == "Agriculture":
        ranked = [r for r in ranked if r["scheme"].get("category") == "Agriculture"]
    elif category == "Education":
        ranked = [r for r in ranked if r["scheme"].get("category") == "Education"]
    return ranked[:limit]


# ── Match scoring ─────────────────────────────────────────────────────────────

def calculate_match(scheme: dict, profile: dict) -> dict:
    eligibility_summary = evaluate_eligibility(scheme, profile)
    reasons = []

    for c in eligibility_summary["criteria"]:
        if c["status"] == "pass":
            reasons.append(f"{c['name']}: {c['detail']}")

    relevance_boost = 0
    interest = (profile.get("interest") or profile.get("category") or "").lower()
    if interest and (
        scheme["category"].lower() == interest
        or any(interest in k.lower() for k in scheme.get("keywords", []))
    ):
        relevance_boost = 15
        reasons.append(f"Category match: scheme is in '{scheme['category']}', aligned with your interest.")

    for c in eligibility_summary["criteria"]:
        if c["status"] == "warning":
            reasons.append(f"Needs confirmation - {c['detail']}")

    match_pct = max(0, min(100, eligibility_summary["score"] + relevance_boost))

    return {
        "matchPercentage": match_pct,
        "reasons": reasons,
        "eligibilitySummary": {
            "eligible": eligibility_summary["eligible"],
            "score": eligibility_summary["score"],
            "criteria": eligibility_summary["criteria"],
        },
    }


def rank_schemes(schemes: list, profile: dict) -> list:
    ranked = []
    for scheme in schemes:
        m = calculate_match(scheme, profile)
        ranked.append({"scheme": scheme, **m})
    ranked.sort(key=lambda x: x["matchPercentage"], reverse=True)
    return ranked


# ── Entity extraction ─────────────────────────────────────────────────────────

CATEGORY_HINTS = {
    "Education": [
        "padhai", "school", "college", "study", "student", "scholarship", "fees", "education", "vidya",
        "शिक्षा", "छात्र", "छात्रवृत्ति", "पढ़ाई", "স্কুল", "কলেজ", "বৃত্তি",
        "கல்வி", "மாணவர்", "விద்య", "విద్యార్థి", "शिक्षण", "शाळा", "શિક્ષણ", "ಶಿಕ್ಷಣ", "വിദ്യാഭ്യാസം", "ਸਿੱਖਿਆ",
    ],
    "Housing": [
        "house", "home", "ghar", "makaan", "flat", "construction", "housing", "awas", "rent", "plot",
        "घर", "मकान", "आवास", "বাড়ি", "আবাসন", "வீடு", "ఇల్లు", "ਘਰ", "ഭവനം",
    ],
    "Agriculture": [
        "kisan", "farmer", "farm", "crop", "kheti", "fasal", "agriculture", "krishi", "beej", "seed", "kishan", "kisaan",
        "किसान", "खेती", "फसल", "কৃষক", "চাষ", "விவசாயம்", "రైతు", "शेतकरी", "ਕਿਸਾਨ", "കർഷകൻ",
    ],
    "Healthcare": [
        "health", "hospital", "bimaar", "treatment", "medicine", "swasth", "doctor", "ayushman", "medical",
        "स्वास्थ्य", "अस्पताल", "দাওয়াই", "சுகாதாரம்", "ఆరోగ్యం", "ਸਿਹਤ", "ആരോഗ്യം",
    ],
    "Employment": [
        "job", "naukri", "employment", "rojgar", "work", "rozgar", "career", "loan",
        "नौकरी", "रोजगार", "চাকরি", "வேலை", "ఉద్యోగం", "ਨੌਕਰੀ", "ജോലി",
    ],
    "Maternity": [
        "pregnancy", "mother", "maternity", "garbh", "delivery", "pregnant", "baby",
        "गर्भ", "मातृत्व", "গর্ভাবস্থা", "கர்ப்பம்", "గర్భం", "ਗਰਭ",
    ],
    "Skill Development": [
        "skill", "training", "course", "vocational", "sikhna", "certification",
        "प्रशिक्षण", "কৌশল", "பயிற்சி", "శిక్షణ", "ਸਿਖਲਾਈ",
    ],
    "Senior Citizens": [
        "pension", "old age", "senior", "budhapa", "elderly", "retire",
        "पेंशन", "বার্ধক্য", "ஓய்வூதியம்", "పెన్షన్", "ਪੈਨਸ਼ਨ",
    ],
    "Girl Child": [
        "beti", "girl", "daughter", "bacchi", "ladki", "sukanya",
        "बेटी", "মেয়ে", "பெண்", "అమ్మాయి", "ਧੀ",
    ],
    "Business": [
        "business", "startup", "entrepreneur", "funding", "loan", "mudra", "msme",
        "व्यवसाय", "ব্যবসা", "வணிகம்", "వ్యాపారం", "ਕਾਰੋਬਾਰ",
    ],
    "Women Welfare": [
        "women", "mahila", "aurat", "lpg", "gas", "ujjwala",
        "महिला", "মহিলা", "பெண்கள்", "మహిళ", "ਔਰਤ",
    ],
}

STATE_HINTS = [
    "bihar", "up", "uttar pradesh", "mp", "madhya pradesh", "rajasthan",
    "maharashtra", "west bengal", "bengal", "tamil nadu", "punjab",
    "haryana", "delhi", "kerala", "gujarat", "karnataka",
]

GENDER_HINTS = {
    "female": ["mahila", "aurat", "ladki", "beti", "mother", "woman", "women", "महिला", "औरत", "মহিলা", "பெண்", "మహిళ", "ਔਰਤ"],
    "male":   ["purush", "ladka", "man", "boy", "पुरुष", "পুরুষ", "ஆண்", "ਮਰਦ"],
}

OCCUPATION_HINTS = {
    "farmer":        ["kisan", "kishan", "kisaan", "farmer", "kheti", "kisaan", "किसान", "কৃষক", "రైతు", "ਕਿਸਾਨ", "விவசாயி", "शेतकरी", "കർഷകൻ", "ರೈತ"],
    "student":       ["student", "vidyaarthi", "vidyarthi", "छात्र", "ছাত্র", "மாணவர்", "ਵਿਦਿਆਰਥੀ", "विद्यार्थी", "విద్యార్థి"],
    "unemployed":    ["berozgaar", "unemployed", "jobless", "बेरोजगार", "বেকার", "ਬੇਰੁਜ਼ਗਾਰ", "வேலை இல்லாத"],
    "self_employed": ["vyavasaay", "business", "dukandar", "व्यवसाय", "ব্যবসা", "ਕਾਰੋਬਾਰ", "వ్యాపారం"],
}


def extract_entities(text: str) -> dict:
    import re
    lower = text.lower()
    lower = re.sub(r"\bkishan\b", "kisan", lower)
    lower = re.sub(r"\bkisaan\b", "kisan", lower)
    lower = re.sub(r"\byojna\b", "yojana", lower)
    entities = {"age": None, "gender": None, "state": None, "occupation": None, "income": None}
    intent = "general_inquiry"
    category = None

    # Age
    age_m = re.search(
        r"(\d{1,3})\s*(saal|sal|year|years|age|yrs|वर्ष|साल|বছর|வயது|సంవత్సరాల|वर्षे|વર્ષ|ವರ್ಷ|വയസ്സ്|ਸਾਲ|ବର୍ଷ)?",
        lower,
    )
    if age_m:
        a = int(age_m.group(1))
        if 1 <= a <= 120:
            entities["age"] = a

    # Gender
    for g, words in GENDER_HINTS.items():
        if any(w in lower for w in words):
            entities["gender"] = g
            break

    # State
    for s in STATE_HINTS:
        if s in lower:
            entities["state"] = s
            break

    # Occupation
    for o, words in OCCUPATION_HINTS.items():
        if any(w in lower for w in words):
            entities["occupation"] = o
            break

    # Income
    income_m = re.search(
        r"(\d+(?:\.\d+)?)\s*(lakh|lac|लाख|লক্ষ|லட்சம்|లక్ష|हजार|thousand|hazar|हज़ार|হাজার)?",
        lower,
    )
    if income_m:
        val = float(income_m.group(1))
        suffix = income_m.group(2) or ""
        if re.search(r"lakh|lac|लाख|লক্ষ|லட்சம்|లక్ష", suffix):
            val *= 100000
        elif re.search(r"thousand|hazar|हजार|हज़ार|হাজার", suffix):
            val *= 1000
        if val >= 1000:
            entities["income"] = int(val)

    # Intent
    if re.search(r"eligible|पात्र|योग्य|milta|mil sakta|পাত্র|தகுதி|అర్హత|ਯੋਗ|qualify", text, re.I):
        intent = "eligibility_check"
    elif re.search(r"apply|kaise|registration|आवेदन|আবেদন|விண்ணப்பம்|దరఖాస్తు|ਅਰਜ਼ੀ", text, re.I):
        intent = "application_help"
    elif re.search(r"document|kagaz|कागज|दस्तावेज|নথি|ஆவணம்|పత్రాలు|ਦਸਤਾਵੇਜ਼", text, re.I):
        intent = "document_help"
    elif re.search(r"scheme|योजना|yojana|benefit|لاभ|সুবিধা|திட்டம்|పథకం|ਯੋਜਨਾ", text, re.I):
        intent = "scheme_discovery"

    # Category
    for cat, hints in CATEGORY_HINTS.items():
        if any(h in lower for h in hints):
            category = cat
            if intent == "general_inquiry":
                intent = "scheme_discovery"
            break

    return {"intent": intent, "category": category, "entities": entities}
