// server/routes/scamRoutes.js
// Scam analysis for messages and URLs (mock heuristic engine).

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Heuristic scam indicators for text messages.
const TEXT_INDICATORS = [
  { id: 'urgency', label: 'Urgency / fear tactics', pattern: /(तुरंत|जल्दी|immediately|urgent|अभी|last chance|अंतिम)/i, weight: 2 },
  { id: 'otp-request', label: 'OTP / password request', pattern: /(otp|password|पासवर्ड|पिन|pin|verify.*account)/i, weight: 3 },
  { id: 'prize', label: 'Unexpected prize / lottery', pattern: /(लॉटरी|lottery|prize|इनाम|winner|जीत|₹.*crore|करोड़)/i, weight: 3 },
  { id: 'govt-impersonation', label: 'Fake government impersonation', pattern: /(पीएम|pm|सरकार|government|योजना.*link|scheme.*click)/i, weight: 2 },
  { id: 'link', label: 'Suspicious link / instruction to click', pattern: /(click here|यहां क्लिक|http|bit\.ly|tinyurl|link.*below)/i, weight: 2 },
  { id: 'payment', label: 'Upfront payment demand', pattern: /(pay.*fee|फीस दें|transfer.*रु|send.*money|पैसे भेजें)/i, weight: 3 },
  { id: 'kYC', label: 'Fake KYC update', pattern: /(kyc|केवाईसी|update.*account|खाता अपडेट)/i, weight: 2 },
];

// Heuristic indicators for URLs.
const URL_INDICATORS = [
  { id: 'shortener', label: 'URL shortener used', pattern: /(bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly)/i, weight: 2 },
  { id: 'http', label: 'Not secure (no HTTPS)', pattern: /^http:\/\//i, weight: 2 },
  { id: 'typosquat', label: 'Look-alike / typosquatted domain', pattern: /(govt|g0v|gov-in|uidia|pm-kisan|paytm|sbi|irctc)[^a-z]/i, weight: 3 },
  { id: 'free-host', label: 'Free/subdomain hosting', pattern: /(\.blogspot\.|\.wordpress\.|\.weebly\.|\.pages\.|netlify\.app|vercel\.app)/i, weight: 1 },
  { id: 'long-random', label: 'Excessive random subdomains', pattern: /(\w+\.){4,}/i, weight: 2 },
];

function analyzeWithIndicators(text, indicators) {
  const found = [];
  let score = 0;
  indicators.forEach((ind) => {
    if (ind.pattern.test(text)) {
      found.push({ id: ind.id, label: ind.label });
      score += ind.weight;
    }
  });

  let risk = 'low';
  if (score >= 5) risk = 'high';
  else if (score >= 2) risk = 'medium';

  return { found, score, risk };
}

// POST /api/scam/analyze
router.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const { text } = req.body || {};
    if (!text) {
      const err = new Error('text is required');
      err.statusCode = 400;
      throw err;
    }
    const { found, score, risk } = analyzeWithIndicators(text, TEXT_INDICATORS);

    const advice =
      risk === 'high'
        ? '⚠️ यह संदेश बहुत high-risk है। कोई OTP, पासवर्ड या पैसे शेयर न करें। सीधे आधिकारिक वेबसाइट पर जाएं।'
        : risk === 'medium'
        ? '⚠️ इस संदेश में संदिग्ध संकेत हैं। सावधानी बरतें और लिंक पर क्लिक न करें।'
        : 'इस संदेश में कोई स्पष्ट स्कैम संकेत नहीं मिला, फिर भी सावधानी बरतें।';

    res.json({
      success: true,
      riskLevel: risk,
      riskScore: score,
      indicatorsFound: found,
      safetyAdvice: advice,
      note: 'Mock heuristic engine. Integrate a real threat-intel / ML classifier for production.',
    });
  })
);

// POST /api/scam/check-url
router.post(
  '/check-url',
  asyncHandler(async (req, res) => {
    const { url } = req.body || {};
    if (!url) {
      const err = new Error('url is required');
      err.statusCode = 400;
      throw err;
    }
    const { found, score, risk } = analyzeWithIndicators(url, URL_INDICATORS);

    const advice =
      risk === 'high'
        ? '⚠️ यह लिंक खतरनाक लग रहा है। इस पर क्लिक न करें और न ही कोई जानकारी भरें।'
        : risk === 'medium'
        ? '⚠️ इस लिंक में संदिग्ध लक्षण हैं। सत्यापित करें कि यह आधिकारिक साइट है या नहीं।'
        : 'इस लिंक में कोई स्पष्ट खतरा नहीं दिखा। फिर भी आधिकारिक डोमेन की जांच करें।';

    res.json({
      success: true,
      url,
      riskLevel: risk,
      riskScore: score,
      indicatorsFound: found,
      safetyAdvice: advice,
    });
  })
);

export default router;
