// server/services/aiService.js
// Mock AI service for JanVaani AI voice co-pilot.
// Provides intent classification, entity extraction, NL response generation,
// and simple conversation context management for Hindi/Hinglish queries.
//
// INTEGRATION POINT: Swap these functions for a real NLU/LLM provider
// (e.g. a multilingual Indic model or hosted LLM) by keeping the same
// function signatures. Everything here works offline with mock data.

import { extractEntities, searchSchemes, rankSchemes } from './schemeService.js';

// Curated Hindi/Hinglish responses keyed by topic for a realistic demo.
const RESPONSE_TEMPLATES = {
  Education:
    'शिक्षा के लिए PM Scholarship Scheme बहुत अच्छा विकल्प है। अगर आप छात्र हैं और परिवार की सालाना आय ₹6 लाख से कम है, तो आप आवेदन कर सकते हैं। क्या मैं आपको आवेदन के चरण बताऊं?',
  Housing:
    'घर बनवाने के लिए Pradhan Mantri Awas Yojana (PMAY) मिलता है। गरीब परिवारों को ब्याज में सब्सिडी मिलती है। क्या आपके पास आय प्रमाण पत्र है?',
  Agriculture:
    'किसानों के लिए PM Kisan Samman Nidhi में साल में ₹6,000 मिलते हैं, और Fasal Bima Yojana से फसल का बीमा होता है। क्या आपके पास खाता और जमीन के कागज हैं?',
  Healthcare:
    'स्वास्थ्य के लिए National Health Mission के तहत सरकारी अस्पताल में मुफ़्त इलाज और टीकाकरण मिलता है। नज़दीकी PHC पर जाएं।',
  Employment:
    'रोजगार के लिए PMEGP में अपना व्यवसाय शुरू करने पर सब्सिडी मिलती है, और DDGKY में मुफ़्त प्रशिक्षण व नौकरी मिलती है।',
  Maternity:
    'गर्भवती महिलाओं के लिए Indira Gandhi Matritva Sahyog Yojana में ₹5,000 की सहायता मिलती है। आंगनवाड़ी केंद्र पर रजिस्टर करें।',
  'Skill Development':
    'कौशल प्रशिक्षण के लिए Deen Dayal Upadhyaya Grameen Kaushalya Yojana (DDGKY) बेहतरीन है - मुफ़्त रहने-खाने के साथ ट्रेनिंग और नौकरी।',
  'Senior Citizens':
    'बुज़ुर्गों के लिए Old Age Pension में 60 साल से ऊपर को हर महीने पेंशन मिलती है। ग्राम पंचायत में आवेदन करें।',
  'Girl Child':
    'बेटी के लिए Beti Bachao Beti Padhao और Sukanya Samriddhi खाता खोलें - पढ़ाई और भविष्य के लिए फायदेमंद।',
  Business:
    'व्यवसाय के लिए Startup India से टैक्स छूट व फंडिंग मिलती है। क्या आपका व्यवसाय रजिस्टर्ड है?',
  'Women Welfare':
    'महिलाओं के लिए Ujjwala Yojana में मुफ़्त LPG कनेक्शन मिलता है। नज़दीकी गैस एजेंसी पर जाएं।',
};

// Fallback generic response.
const FALLBACK_RESPONSE =
  'नमस्ते! मैं JanVaani हूं, आपकी सरकारी योजना सहायक। आप शिक्षा, स्वास्थ्य, किसान, घर, या रोजगार के बारे में पूछ सकते हैं। मैं आपको सही योजना ढूंढकर बताऊंगी।';

/**
 * Classify intent + extract entities from a query.
 * Delegates entity extraction to schemeService.extractEntities.
 */
export function classifyIntent(text = '') {
  const { intent, category, entities } = extractEntities(text);
  return { intent, category, entities };
}

/**
 * Generate a natural language response in Hindi/Hinglish for a query.
 * @param {string} text - user query
 * @param {object} context - conversation context (history, profile)
 * @returns {object} { response, intent, category, entities, suggestedSchemes }
 */
export function generateResponse(text = '', context = {}) {
  const { intent, category, entities } = extractEntities(text);

  // Find matching schemes using extracted category/entities.
  let matched = [];
  if (category) {
    matched = rankSchemes(searchSchemes({ category }), entities).slice(0, 3);
  } else {
    matched = rankSchemes(searchSchemes({}), entities).slice(0, 3);
  }

  let response;
  if (category && RESPONSE_TEMPLATES[category]) {
    response = RESPONSE_TEMPLATES[category];
  } else if (intent === 'eligibility_check' && matched.length) {
    const top = matched[0];
    response = `आपकी जानकारी के अनुसार, "${top.scheme.name}" के लिए आपकी संभावना ${top.matchPercentage}% है। ${top.reasons[0] || ''}`;
  } else {
    response = FALLBACK_RESPONSE;
  }

  return {
    response,
    intent,
    category,
    entities,
    suggestedSchemes: matched.map((m) => ({
      id: m.scheme.id,
      name: m.scheme.name,
      category: m.scheme.category,
      matchPercentage: m.matchPercentage,
    })),
  };
}

// ---------- Conversation context management (in-memory, demo only) ----------
const sessions = new Map();

export function getContext(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { sessionId, history: [], profile: {} });
  }
  return sessions.get(sessionId);
}

export function updateContext(sessionId, { message, role = 'user', entities } = {}) {
  const ctx = getContext(sessionId);
  ctx.history.push({ role, message, timestamp: new Date().toISOString() });
  if (entities) {
    // Merge extracted entities into the running profile.
    ctx.profile = { ...ctx.profile, ...entities };
  }
  // Keep last 20 messages to bound memory.
  if (ctx.history.length > 20) ctx.history = ctx.history.slice(-20);
  return ctx;
}

export function resetContext(sessionId) {
  sessions.delete(sessionId);
  return { sessionId, history: [], profile: {} };
}

export default {
  classifyIntent,
  generateResponse,
  getContext,
  updateContext,
  resetContext,
};
