// server/services/schemeService.js
// Scheme matching engine: load, search/filter, score match %, rank, and
// extract entities from natural language input.

import { schemes } from '../data/schemes.js';
import eligibilityService from './eligibilityService.js';

// ---------- Data access ----------
export function loadSchemes() {
  // In production, replace with: return await SchemeModel.find(filters);
  return schemes;
}

export function getSchemeById(id) {
  return schemes.find((s) => s.id === id) || null;
}

// ---------- Search & filter ----------
export function searchSchemes({ category, state, search } = {}) {
  let results = loadSchemes();

  if (category) {
    results = results.filter(
      (s) => s.category.toLowerCase() === String(category).toLowerCase()
    );
  }
  if (state) {
    results = results.filter(
      (s) => s.state.toLowerCase() === 'all india' || s.state.toLowerCase() === String(state).toLowerCase()
    );
  }
  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter((s) => {
      const haystack = [
        s.name,
        s.description,
        s.category,
        ...(s.keywords || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }
  return results;
}

// ---------- Match scoring ----------
/**
 * Calculate how well a scheme matches a user profile.
 * @returns {object} { matchPercentage, reasons[], eligibilitySummary }
 */
export function calculateMatch(scheme, profile = {}) {
  const eligibilitySummary = eligibilityService.evaluateEligibility(scheme, profile);
  const reasons = [];

  // Reasons derived from passing criteria
  eligibilitySummary.criteria
    .filter((c) => c.status === 'pass')
    .forEach((c) => reasons.push(`${c.name}: ${c.detail}`));

  // Keyword / interest relevance boost
  let relevanceBoost = 0;
  const interest = (profile.interest || profile.category || '').toLowerCase();
  if (interest && (scheme.category.toLowerCase() === interest || (scheme.keywords || []).some((k) => k.toLowerCase().includes(interest)))) {
    relevanceBoost = 15;
    reasons.push(`Category match: scheme is in "${scheme.category}", aligned with your interest.`);
  }

  // Warning notes (not blocking but informative)
  eligibilitySummary.criteria
    .filter((c) => c.status === 'warning')
    .forEach((c) => reasons.push(`Needs confirmation - ${c.detail}`));

  let matchPercentage = eligibilitySummary.score + relevanceBoost;
  matchPercentage = Math.max(0, Math.min(100, matchPercentage));

  return {
    matchPercentage,
    reasons,
    eligibilitySummary: {
      eligible: eligibilitySummary.eligible,
      score: eligibilitySummary.score,
      criteria: eligibilitySummary.criteria,
    },
  };
}

/**
 * Rank schemes for a profile by match percentage (descending).
 */
export function rankSchemes(profiles, profile = {}) {
  return profiles
    .map((scheme) => {
      const m = calculateMatch(scheme, profile);
      return { scheme, ...m };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
}

// ---------- Natural language entity extraction ----------
// Lightweight deterministic extractor for Hindi/Hinglish queries.
// INTEGRATION POINT: Replace with an LLM / NLU service (e.g. a multilingual model)
// for production-grade intent + entity extraction.

const CATEGORY_HINTS = {
  Education: ['padhai', 'school', 'college', 'study', 'student', 'scholarship', 'fees', 'शिक्षा', 'छात्र'],
  Housing: ['house', 'home', 'ghar', 'makaan', 'flat', 'construction', 'घर', 'मकान'],
  Agriculture: ['kisan', 'farmer', 'farm', 'crop', 'kheti', 'fasal', 'खेत', 'किसान', 'फसल'],
  Healthcare: ['health', 'hospital', 'bimaar', 'treatment', 'medicine', 'swasth', 'इलाज', 'स्वास्थ्य'],
  Employment: ['job', 'naukri', 'employment', 'rojgar', 'नौकरी', 'रोजगार'],
  Maternity: ['pregnancy', 'mother', 'maternity', 'garbh', 'delivery', 'गर्भ', 'मातृत्व'],
  'Skill Development': ['skill', 'training', 'course', 'प्रशिक्षण', 'कौशल'],
  'Senior Citizens': ['pension', 'old age', 'senior', 'budhapa', 'vardhakya', 'पेंशन', 'बुढ़ापा'],
  'Girl Child': ['beti', 'girl', 'daughter', 'bacchi', 'ladki', 'बेटी', 'लड़की'],
  Business: ['business', 'startup', 'entrepreneur', 'vyavasaay', 'funding', 'व्यवसाय', 'स्टार्टअप'],
  'Women Welfare': ['women', 'mahila', 'aurat', 'lpg', 'gas', 'महिला', 'औरत'],
};

const STATE_HINTS = [
  'bihar', 'बिहार', 'up', 'uttar pradesh', 'uttar Pradesh', 'प्रदेश',
  'mp', 'madhya pradesh', 'मध्य प्रदेश', 'rajashtan', 'rajasthan', 'राजस्थान',
  'maharashtra', 'महाराष्ट्र', 'west bengal', 'bengal', 'बंगाल',
  'tamil nadu', 'punjab', 'haryana', 'delhi', 'kerala',
];

const GENDER_HINTS = {
  female: ['mahila', 'aurat', 'ladki', 'beti', 'mother', 'woman', 'women', 'महिला', 'औरत', 'लड़की', 'बेटी'],
  male: ['purush', 'ladka', 'man', 'boy', 'पुरुष', 'लड़का'],
};

const OCCUPATION_HINTS = {
  farmer: ['kisan', 'farmer', 'kheti', 'खेत', 'किसान'],
  student: ['student', 'vidyaarthi', 'छात्र', 'पढ़ाई'],
  unemployed: ['berozgaar', 'unemployed', 'निरुद्योग'],
  self_employed: ['vyavasaay', 'business', 'व्यवसाय'],
};

export function extractEntities(text = '') {
  const lower = String(text).toLowerCase();
  const entities = { age: null, gender: null, state: null, occupation: null, income: null };
  let intent = 'general_inquiry';
  let category = null;

  // Age: look for a number followed by "saal"/"year"/"age" or standalone digit 1-120
  const ageMatch = lower.match(/(\d{1,3})\s*(saal|year|age|वर्ष|साल)?/);
  if (ageMatch) {
    const a = parseInt(ageMatch[1], 10);
    if (a >= 1 && a <= 120) entities.age = a;
  }

  // Gender
  for (const [g, words] of Object.entries(GENDER_HINTS)) {
    if (words.some((w) => lower.includes(w))) {
      entities.gender = g;
      break;
    }
  }

  // State
  for (const s of STATE_HINTS) {
    if (lower.includes(s.toLowerCase())) {
      entities.state = s;
      break;
    }
  }

  // Occupation
  for (const [o, words] of Object.entries(OCCUPATION_HINTS)) {
    if (words.some((w) => lower.includes(w))) {
      entities.occupation = o;
      break;
    }
  }

  // Income (e.g. "income 200000" or "2 lakh")
  const incomeMatch = lower.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|हज़ार|hazar|thousand)?\s*(income|कमाई|आय)?/);
  if (incomeMatch) {
    let val = parseFloat(incomeMatch[1]);
    if (incomeMatch[2] && /lakh|lac|लाख/.test(incomeMatch[2])) val *= 100000;
    if (incomeMatch[2] && /thousand|hazar|हज़ार/.test(incomeMatch[2])) val *= 1000;
    entities.income = Math.round(val);
  }

  // Intent + category detection
  if (/(eligible|资格|पात्र|योग्य|क्या मिलेगा|milta|mil sakta)/i.test(text)) {
    intent = 'eligibility_check';
  } else if (/(apply|कैसे|kaise|registration|आवेदन)/i.test(text)) {
    intent = 'application_help';
  } else if (/(document|kagaz|कागज|दस्तावेज)/i.test(text)) {
    intent = 'document_help';
  } else if (/(scheme|योजना|yojana|benefit|लाभ)/i.test(text)) {
    intent = 'scheme_discovery';
  }

  for (const [cat, hints] of Object.entries(CATEGORY_HINTS)) {
    if (hints.some((h) => lower.includes(h))) {
      category = cat;
      intent = intent === 'general_inquiry' ? 'scheme_discovery' : intent;
      break;
    }
  }

  return { intent, category, entities };
}

export default {
  loadSchemes,
  getSchemeById,
  searchSchemes,
  calculateMatch,
  rankSchemes,
  extractEntities,
};
