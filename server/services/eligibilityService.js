// server/services/eligibilityService.js
// Deterministic, rule-based eligibility engine for JanVaani AI.
// Given a scheme's eligibilityRules and a user profile, it evaluates each
// criterion and returns structured pass/fail/warning results.

const DEFAULT_INCOME = Number.MAX_SAFE_INTEGER;

/**
 * Evaluate a single user profile against one scheme's eligibility rules.
 * @param {object} scheme - scheme object with `eligibilityRules`
 * @param {object} profile - user profile
 *   { age, gender: 'male'|'female', state, annualIncome, category, occupation }
 * @returns {object} { eligible, score, criteria: [{name, status, detail}] }
 */
export function evaluateEligibility(scheme, profile = {}) {
  const rules = scheme.eligibilityRules || {};
  const criteria = [];

  // ---- Age ----
  const ageRule = rules.age || { min: 0, max: 200 };
  const age = toNumber(profile.age);
  if (age == null || Number.isNaN(age)) {
    criteria.push({
      name: 'Age',
      status: 'warning',
      detail: `Age requirement ${ageRule.min}-${ageRule.max} years. Provide your age to confirm.`,
    });
  } else if (age >= ageRule.min && age <= ageRule.max) {
    criteria.push({
      name: 'Age',
      status: 'pass',
      detail: `Age ${age} is within the required ${ageRule.min}-${ageRule.max} years.`,
    });
  } else {
    criteria.push({
      name: 'Age',
      status: 'fail',
      detail: `Age ${age} is outside the required ${ageRule.min}-${ageRule.max} years.`,
    });
  }

  // ---- Income ----
  const incomeMax = rules.income?.max ?? DEFAULT_INCOME;
  const income = toNumber(profile.annualIncome);
  if (income == null || Number.isNaN(income)) {
    criteria.push({
      name: 'Income',
      status: 'warning',
      detail: `Income should be ₹${incomeMax.toLocaleString('en-IN')} or less. Provide income to confirm.`,
    });
  } else if (income <= incomeMax) {
    criteria.push({
      name: 'Income',
      status: 'pass',
      detail: `Annual income ₹${income.toLocaleString('en-IN')} is within limit ₹${incomeMax.toLocaleString('en-IN')}.`,
    });
  } else {
    criteria.push({
      name: 'Income',
      status: 'fail',
      detail: `Annual income ₹${income.toLocaleString('en-IN')} exceeds limit ₹${incomeMax.toLocaleString('en-IN')}.`,
    });
  }

  // ---- Gender ----
  const genderRule = rules.gender || 'all';
  const gender = normalizeGender(profile.gender);
  if (genderRule === 'all') {
    criteria.push({ name: 'Gender', status: 'pass', detail: 'Open to all genders.' });
  } else if (!gender) {
    criteria.push({
      name: 'Gender',
      status: 'warning',
      detail: `This scheme is for ${genderRule} applicants only. Provide gender to confirm.`,
    });
  } else if (gender === genderRule) {
    criteria.push({ name: 'Gender', status: 'pass', detail: `Eligible as ${gender} applicant.` });
  } else {
    criteria.push({
      name: 'Gender',
      status: 'fail',
      detail: `This scheme is for ${genderRule} applicants only.`,
    });
  }

  // ---- State / Region ----
  const states = rules.states || ['all'];
  const state = normalizeState(profile.state);
  if (states.includes('all')) {
    criteria.push({ name: 'State', status: 'pass', detail: 'Available across all of India.' });
  } else if (!state) {
    criteria.push({
      name: 'State',
      status: 'warning',
      detail: `Available in: ${states.join(', ')}. Provide your state to confirm.`,
    });
  } else if (states.some((s) => s.toLowerCase() === state.toLowerCase())) {
    criteria.push({ name: 'State', status: 'pass', detail: `Available in ${state}.` });
  } else {
    criteria.push({
      name: 'State',
      status: 'fail',
      detail: `Not available in ${state}. Available in: ${states.join(', ')}.`,
    });
  }

  // ---- Category / Occupation ----
  const categories = rules.categories || ['any'];
  const userCategory = profile.category;
  const userOccupation = profile.occupation;
  const categoryMatch =
    categories.includes('any') ||
    (userCategory && categories.includes(userCategory)) ||
    (userOccupation && categories.includes(userOccupation));
  if (categories.includes('any')) {
    criteria.push({ name: 'Category', status: 'pass', detail: 'Open to all categories.' });
  } else if (!userCategory && !userOccupation) {
    criteria.push({
      name: 'Category',
      status: 'warning',
      detail: `Preferred categories: ${categories.join(', ')}. Provide more details to confirm.`,
    });
  } else if (categoryMatch) {
    criteria.push({
      name: 'Category',
      status: 'pass',
      detail: `Matches preferred category: ${categories.join(', ')}.`,
    });
  } else {
    criteria.push({
      name: 'Category',
      status: 'fail',
      detail: `Requires one of: ${categories.join(', ')}.`,
    });
  }

  // ---- Aggregate ----
  const fails = criteria.filter((c) => c.status === 'fail').length;
  const passes = criteria.filter((c) => c.status === 'pass').length;
  const totalDecisive = passes + fails;
  const score = totalDecisive === 0 ? 50 : Math.round((passes / totalDecisive) * 100);
  const eligible = fails === 0; // warnings do not block; they only need confirmation

  return { eligible, score, criteria };
}

/**
 * Quick eligibility check with minimal info (only age + scheme id required).
 */
export function quickCheck(scheme, minimalProfile = {}) {
  return evaluateEligibility(scheme, minimalProfile);
}

// ---- helpers ----
function toNumber(v) {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isNaN(n) ? null : n;
}

function normalizeGender(g) {
  if (!g) return null;
  const s = String(g).toLowerCase();
  if (s === 'm' || s.startsWith('male')) return 'male';
  if (s === 'f' || s.startsWith('female')) return 'female';
  return null;
}

function normalizeState(s) {
  if (!s) return null;
  return String(s).trim().toLowerCase();
}

export default { evaluateEligibility, quickCheck };
