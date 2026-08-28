# services/ai_service.py
# Multilingual AI response generation — ported from Node.js aiService.js

from services.scheme_service import extract_entities, match_schemes_for_query
from services.localize_service import localize_scheme

RESPONSE_TEMPLATES = {
    "hi-IN": {
        "found":   lambda count, names, role: (
            f"{'आप किसान हैं। ' if role == 'farmer' else ('आप छात्र हैं। ' if role == 'student' else '')}"
            f"भारत में आपके लिए {count} योजना{'एं' if count > 1 else ''} मिलीं। "
            f"नीचे पात्रता जाँच और पूरा विवरण पढ़ सकते हैं।"
        ),
        "noMatch": lambda: "मुझे आपके सवाल से संबंधित कोई योजना नहीं मिली। कृपया शिक्षा, स्वास्थ्य, किसान, आवास, या रोजगार के बारे में पूछें।",
    },
    "en-IN": {
        "found":   lambda count, names, role: (
            f"{'You are a farmer. ' if role == 'farmer' else ('You are a student. ' if role == 'student' else '')}"
            f"Found {count} scheme{'s' if count > 1 else ''} in India for you. "
            f"You can check eligibility and read details below."
        ),
        "noMatch": lambda: "No schemes found for your query. Try asking about education, health, farming, housing, or employment.",
    },
    "bn-IN": {
        "found":   lambda count, names, _: f"আপনার জন্য {count}টি প্রকল্প পাওয়া গেছে: {names}। আপনি কি এর মধ্যে কোনোটি সম্পর্কে আরও জানতে চান?",
        "noMatch": lambda: "আপনার প্রশ্নের জন্য কোনো প্রকল্প পাওয়া যায়নি। শিক্ষা, স্বাস্থ্য, কৃষি বা আবাসন সম্পর্কে জিজ্ঞাসা করুন।",
    },
    "ta-IN": {
        "found":   lambda count, names, _: f"உங்களுக்கு {count} திட்டம் கண்டறியப்பட்டது: {names}. இவற்றில் ஏதேனும் பற்றி மேலும் தெரிந்துகொள்ள விரும்புகிறீர்களா?",
        "noMatch": lambda: "உங்கள் கேள்விக்கு எந்த திட்டமும் கிடைக்கவில்லை. கல்வி, சுகாதாரம், விவசாயம் பற்றி கேளுங்கள்.",
    },
    "te-IN": {
        "found":   lambda count, names, _: f"మీకు {count} పథకాలు కనుగొనబడ్డాయి: {names}. వీటిలో ఏదైనా గురించి మరింత తెలుసుకోవాలనుకుంటున్నారా?",
        "noMatch": lambda: "మీ ప్రశ్నకు సంబంధించిన పథకాలు కనుగొనబడలేదు. విద్య, ఆరోగ్యం, వ్యవసాయం గురించి అడగండి.",
    },
    "mr-IN": {
        "found":   lambda count, names, _: f"तुमच्यासाठी {count} योजना सापडल्या: {names}. यापैकी कोणत्याबद्दल अधिक जाणून घ्यायचे आहे का?",
        "noMatch": lambda: "तुमच्या प्रश्नासाठी कोणतीही योजना सापडली नाही. शिक्षण, आरोग्य, शेती याबद्दल विचारा.",
    },
    "gu-IN": {
        "found":   lambda count, names, _: f"તમારા માટે {count} યોજનાઓ મળી: {names}. શું તમે આ વિશે વધુ જાણવા માંગો છો?",
        "noMatch": lambda: "તમારા પ્રશ્ન માટે કોઈ યોજના મળી નથી. શિક્ષણ, આરોગ્ય, ખેતી વિશે પૂછો.",
    },
    "kn-IN": {
        "found":   lambda count, names, _: f"ನಿಮಗಾಗಿ {count} ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿವೆ: {names}. ಇವುಗಳಲ್ಲಿ ಯಾವುದರ ಬಗ್ಗೆ ಹೆಚ್ಚು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಾ?",
        "noMatch": lambda: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಯಾವುದೇ ಯೋಜನೆ ಕಂಡುಬಂದಿಲ್ಲ. ಶಿಕ್ಷಣ, ಆರೋಗ್ಯ, ಕೃಷಿ ಬಗ್ಗೆ ಕೇಳಿ.",
    },
    "ml-IN": {
        "found":   lambda count, names, _: f"നിങ്ങൾക്കായി {count} പദ്ധതികൾ കണ്ടെത്തി: {names}. ഇവയിൽ ഏതെങ്കിലും കൂടുതൽ അറിയണോ?",
        "noMatch": lambda: "നിങ്ങളുടെ ചോദ്യത്തിന് പദ്ധതികൾ കണ്ടെത്തിയില്ല. വിദ്യാഭ്യാസം, ആരോഗ്യം, കൃഷി ഇവ ചോദിക്കൂ.",
    },
    "pa-IN": {
        "found":   lambda count, names, _: f"ਤੁਹਾਡੇ ਲਈ {count} ਯੋਜਨਾਵਾਂ ਮਿਲੀਆਂ: {names}. ਕੀ ਤੁਸੀਂ ਇਹਨਾਂ ਵਿੱਚੋਂ ਕਿਸੇ ਬਾਰੇ ਹੋਰ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
        "noMatch": lambda: "ਤੁਹਾਡੇ ਸਵਾਲ ਲਈ ਕੋਈ ਯੋਜਨਾ ਨਹੀਂ ਮਿਲੀ। ਸਿੱਖਿਆ, ਸਿਹਤ, ਖੇਤੀ ਬਾਰੇ ਪੁੱਛੋ।",
    },
    "od-IN": {
        "found":   lambda count, names, _: f"ଆପଣଙ୍କ ପାଇଁ {count}ଟି ଯୋଜନା ମିଳିଲା: {names}. ଏଥିବିଷୟରେ ଅଧିକ ଜାଣିବାକୁ ଚାହୁଁଛନ୍ତି କି?",
        "noMatch": lambda: "ଆପଣଙ୍କ ପ୍ରଶ୍ନ ପାଇଁ ଯୋଜନା ମିଳିଲା ନାହିଁ। ଶିକ୍ଷା, ସ୍ୱାସ୍ଥ୍ୟ, କୃଷି ବିଷୟରେ ପ୍ରଶ୍ନ କରନ୍ତୁ।",
    },
}


def _build_response(matched: list, language: str, occupation: str | None = None) -> str:
    tpl = RESPONSE_TEMPLATES.get(language, RESPONSE_TEMPLATES["en-IN"])
    if not matched:
        return tpl["noMatch"]()
    count = len(matched)
    names = ", ".join(
        (m["scheme"]["name"] if "scheme" in m else m.get("name", ""))
        for m in matched[:3]
    )
    occ = (occupation or "").lower()
    role = "farmer" if "farm" in occ or "kisan" in occ else ("student" if "student" in occ else "")
    return tpl["found"](count, names, role)


def _merge_profile(entities: dict, profile: dict) -> dict:
    profile = profile or {}
    merged = {**entities}
    mapping = {
        "age": ["age"],
        "gender": ["gender"],
        "state": ["state"],
        "occupation": ["occupation"],
        "income": ["income", "annualIncome"],
    }
    for key, sources in mapping.items():
        if merged.get(key) in (None, "", []):
            for src in sources:
                if profile.get(src) not in (None, "", []):
                    merged[key] = profile[src]
                    break
    return merged


def generate_response(text: str, context: dict = {}) -> dict:
    extracted = extract_entities(text)
    intent    = extracted["intent"]
    category  = extracted["category"]
    language  = context.get("language", "hi-IN")
    profile   = context.get("userProfile") or {}
    entities  = _merge_profile(extracted["entities"], profile)

    matched = match_schemes_for_query(text, {**profile, **entities}, limit=5)
    for m in matched:
        m["scheme"] = localize_scheme(m["scheme"], language)

    tpl = RESPONSE_TEMPLATES.get(language, RESPONSE_TEMPLATES["en-IN"])
    response = _build_response(matched, language, entities.get("occupation")) if matched else tpl["noMatch"]()

    suggested_schemes = []
    for m in matched:
        card = localize_scheme(m["scheme"], language)
        suggested_schemes.append({
            "id": card["id"],
            "name": card["name"],
            "nameHi": card.get("nameHi", ""),
            "category": card["category"],
            "description": card["description"],
            "descriptionHi": card.get("descriptionHi", ""),
            "eligibilityRules": card.get("eligibilityRules", {}),
            "requiredDocuments": card.get("requiredDocuments", []),
            "applicationSteps": card.get("applicationSteps", []),
            "benefits": card.get("benefits", []),
            "officialSource": card.get("officialSource", ""),
            "lastVerified": card.get("lastVerified", ""),
            "matchPercentage": m["matchPercentage"],
            "keywords": card.get("keywords", []),
        })

    return {
        "response":        response,
        "answerable":      len(matched) > 0,
        "intent":          intent,
        "category":        category,
        "entities":        entities,
        "suggestedSchemes": suggested_schemes,
    }
