import { schemes as localSchemes } from '@/data/schemes';
import { isSchemeForState, schemeCoverage, normalizeState } from '@/data/indianStates';

export function findSchemeById(id) {
  if (id == null || id === '') return undefined;
  const key = String(id);
  return localSchemes.find((s) => String(s.id) === key);
}

export function categoryKey(category = '') {
  return String(category).toLowerCase().replace(/\s+/g, '-');
}

export function localizeCategory(category, t) {
  if (!category) return '';
  const translated = t(`categories.${category}`);
  if (translated && translated !== `categories.${category}`) return translated;
  return category;
}

export function occupationLabel(occupation, t) {
  if (!occupation) return '—';
  const keyMap = { 'self-employed': 'selfEmployed', self_employed: 'selfEmployed', selfEmployed: 'selfEmployed' };
  const key = keyMap[occupation] || occupation;
  const translated = t(`onboarding.occupations.${key}`);
  if (translated && !translated.includes('.')) return translated;
  return occupation;
}

export function localizeScheme(scheme, language = 'en-IN') {
  if (!scheme) return scheme;
  const hi = language === 'hi-IN';
  return {
    ...scheme,
    displayName: hi && scheme.nameHi ? scheme.nameHi : (scheme.localizedName || scheme.name),
    displayDescription: hi && scheme.descriptionHi ? scheme.descriptionHi : (scheme.localizedDescription || scheme.description),
    displayBenefits: scheme.localizedBenefits || scheme.benefits || [],
    displaySteps: scheme.localizedSteps || scheme.applicationSteps || [],
  };
}

export function normalizeSearchQuery(query) {
  let q = String(query || '').toLowerCase();
  q = q.replace(/\bkishan\b/g, 'kisan').replace(/\bkisaan\b/g, 'kisan').replace(/\byojna\b/g, 'yojana');
  return q;
}

export function inferOccupationFromQuery(query) {
  const q = normalizeSearchQuery(query);
  if (/(kisan|farmer|kheti|कृषि|किसान)/.test(q)) return 'farmer';
  if (/(student|vidyarthi|chhatra|scholarship|छात्र|पढ़ाई)/.test(q)) return 'student';
  if (/(naukri|job|rozgar|unemployed|बेरोजगार)/.test(q)) return 'unemployed';
  if (/(business|mudra|dukan|व्यवसाय)/.test(q)) return 'business';
  return '';
}

export function schemeMatchesQuery(scheme, query) {
  if (!query || !query.trim()) return true;
  const q = normalizeSearchQuery(query).trim();
  const stop = new Set(['mai', 'main', 'hu', 'hun', 'hoon', 'hai', 'hain', 'konsi', 'kaunsi', 'milegi', 'milega', 'milenge', 'kya', 'ke', 'ki', 'ka', 'ko', 'se', 'aur', 'yojana', 'yojna', 'scheme', 'schemes', 'please', 'for', 'the', 'and']);
  const words = q.split(/\s+/).filter((w) => w.length > 1 && !stop.has(w));
  const haystack = [
    scheme.name,
    scheme.nameHi,
    scheme.description,
    scheme.descriptionHi,
    scheme.category,
    scheme.state,
    scheme.localizedName,
    scheme.localizedDescription,
    ...(scheme.keywords || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (haystack.includes(q)) return true;
  if (!words.length) return false;
  const farmerAsk = words.some((w) => ['kisan', 'farmer', 'agriculture', 'kheti'].includes(w));
  if (farmerAsk) {
    return scheme.category === 'Agriculture' || Boolean(scheme.eligibilityRules?.farmerRequired);
  }
  const hits = words.filter((w) => haystack.includes(w)).length;
  return hits >= 1;
}

export function eligibilityBounds(rules = {}) {
  return {
    minAge: rules.minAge ?? rules.age?.min ?? 0,
    maxAge: rules.maxAge ?? rules.age?.max ?? 99,
    incomeLimit: rules.incomeLimit ?? rules.income?.max ?? null,
    gender: Array.isArray(rules.gender) ? rules.gender : (rules.gender && rules.gender !== 'all' ? [rules.gender] : ['male', 'female', 'other']),
    category: rules.categories || rules.category || [],
    studentRequired: Boolean(rules.studentRequired),
    farmerRequired: Boolean(rules.farmerRequired || (rules.categories || []).includes('farmer')),
    states: rules.states || [],
  };
}

export function evaluateSchemeEligibility(scheme, user, t, language = 'en-IN') {
  const rules = eligibilityBounds(scheme?.eligibilityRules || {});
  const age = Number(user.age) || 0;
  const income = Number(user.income) || 0;
  const gender = user.gender || '';
  const occupation = (user.occupation || '').toLowerCase();
  const occLabel = occupationLabel(occupation, t);
  const localized = localizeScheme(scheme, language);
  const criteria = [];
  const push = (name, value, status, reason) => criteria.push({ name, value, status, reason });

  if (!age) {
    push(t('eligibility.age'), '—', 'warning', t('eligibility.reasonAgeMissing', { min: rules.minAge, max: rules.maxAge }));
  } else if (age < rules.minAge) {
    push(t('eligibility.age'), `${age} ${t('onboarding.years')}`, 'fail', t('eligibility.reasonAgeLow', { age, min: rules.minAge, max: rules.maxAge }));
  } else if (age > rules.maxAge) {
    push(t('eligibility.age'), `${age} ${t('onboarding.years')}`, 'fail', t('eligibility.reasonAgeHigh', { age, min: rules.minAge, max: rules.maxAge }));
  } else {
    push(t('eligibility.age'), `${age} ${t('onboarding.years')}`, 'pass', t('eligibility.reasonAgeOk', { age, min: rules.minAge, max: rules.maxAge }));
  }

  const genderOk = !rules.gender?.length || rules.gender.includes('all') || (gender && rules.gender.includes(gender));
  const genderLabel = gender ? t(`eligibility.${gender}`) : '—';
  if (!gender) {
    push(t('eligibility.gender'), '—', 'warning', t('eligibility.reasonGenderMissing'));
  } else if (genderOk) {
    push(t('eligibility.gender'), genderLabel, 'pass', t('eligibility.reasonGenderOk'));
  } else {
    push(t('eligibility.gender'), genderLabel, 'fail', t('eligibility.reasonGenderFail'));
  }

  if (!rules.incomeLimit) {
    push(t('eligibility.annualIncome'), income ? `₹${income.toLocaleString('en-IN')}` : '—', 'pass', t('eligibility.reasonIncomeNone'));
  } else if (!income) {
    push(t('eligibility.annualIncome'), '—', 'warning', t('eligibility.reasonIncomeMissing', { limit: rules.incomeLimit.toLocaleString('en-IN') }));
  } else if (income <= rules.incomeLimit) {
    push(t('eligibility.annualIncome'), `₹${income.toLocaleString('en-IN')}`, 'pass', t('eligibility.reasonIncomeOk', { income: income.toLocaleString('en-IN'), limit: rules.incomeLimit.toLocaleString('en-IN') }));
  } else {
    push(t('eligibility.annualIncome'), `₹${income.toLocaleString('en-IN')}`, 'fail', t('eligibility.reasonIncomeOver', { income: income.toLocaleString('en-IN'), limit: rules.incomeLimit.toLocaleString('en-IN') }));
  }

  const stateMatch = isSchemeForState(scheme, user.state);
  const coverage = schemeCoverage(scheme);
  const coverageLabel = coverage.includes('all')
    ? t('eligibility.allIndia')
    : coverage.map((id) => {
      const label = t(`states.${id}`);
      return label.startsWith('states.') ? id : label;
    }).join(', ');
  const rawState = normalizeState(user.state) || user.state;
  const userStateLabel = user.state
    ? (t(`states.${rawState}`).startsWith('states.') ? user.state : t(`states.${rawState}`))
    : '—';
  if (coverage.includes('all')) {
    push(t('eligibility.state'), userStateLabel, 'pass', t('eligibility.reasonStateAll'));
  } else if (!user.state) {
    push(t('eligibility.state'), '—', 'warning', t('eligibility.reasonStateMissing', { places: coverageLabel }));
  } else if (stateMatch) {
    push(t('eligibility.state'), userStateLabel, 'pass', t('eligibility.reasonStateOk', { state: userStateLabel }));
  } else {
    push(t('eligibility.state'), userStateLabel, 'fail', t('eligibility.reasonStateFail', { state: userStateLabel, places: coverageLabel }));
  }

  if (rules.farmerRequired) {
    if (occupation.includes('farmer')) {
      push(t('schemeDetail.farmerRequired'), occLabel, 'pass', t('eligibility.reasonFarmerOk'));
    } else {
      push(t('schemeDetail.farmerRequired'), occLabel, 'fail', t('eligibility.reasonFarmerFail', { occupation: occLabel }));
    }
  }

  if (rules.studentRequired) {
    if (occupation.includes('student')) {
      push(t('schemeDetail.studentRequired'), occLabel, 'pass', t('eligibility.reasonStudentOk'));
    } else {
      push(t('schemeDetail.studentRequired'), occLabel, 'fail', t('eligibility.reasonStudentFail', { occupation: occLabel }));
    }
  }

  const scored = criteria.filter((c) => c.status === 'pass' || c.status === 'fail');
  const passCount = scored.filter((c) => c.status === 'pass').length;
  const score = scored.length ? Math.round((passCount / scored.length) * 100) : 50;
  const fails = criteria.filter((c) => c.status === 'fail');

  return {
    score,
    criteria,
    whyQualify: criteria.filter((c) => c.status === 'pass').map((c) => c.reason),
    whyNotQualify: fails.map((c) => c.reason),
    schemeName: localized?.displayName || scheme?.name || '',
    eligible: fails.length === 0,
  };
}

function norm(value) {
  return String(value || '').toLowerCase().replace(/[\s_-]+/g, '');
}

export function requiredDocMatchesCatalog(requiredLabel, catalogDoc) {
  const r = norm(requiredLabel);
  return [catalogDoc.id, catalogDoc.name, catalogDoc.nameHi]
    .filter(Boolean)
    .some((part) => {
      const p = norm(part);
      return r.includes(p) || p.includes(r);
    });
}

export function extractedProfileUpdates(entities = {}, user = {}) {
  const updates = {};
  if (entities.age && !user.age) updates.age = entities.age;
  if (entities.occupation && !user.occupation) updates.occupation = entities.occupation;
  if (entities.gender && !user.gender) updates.gender = entities.gender;
  if (entities.state && !user.state) updates.state = entities.state;
  if (entities.income && !user.income) updates.income = entities.income;
  return updates;
}

const OCC_TO_CATEGORY = {
  farmer: 'Agriculture',
  student: 'Education',
  unemployed: 'Employment',
  employed: 'Employment',
  'self-employed': 'Business',
  self_employed: 'Business',
  selfEmployed: 'Business',
  business: 'Business',
  homemaker: 'Women Welfare',
  retired: 'Senior Citizens',
};

export function recommendSchemes(user = {}, schemes = localSchemes) {
  const age = Number(user.age) || 0;
  const occ = String(user.occupation || '').toLowerCase();
  const preferredCat = OCC_TO_CATEGORY[occ] || OCC_TO_CATEGORY[occ.replace('_', '-')];
  const income = Number(user.income) || 0;
  const gender = String(user.gender || '').toLowerCase();

  return schemes.map((scheme) => {
    const rules = eligibilityBounds(scheme.eligibilityRules || {});
    const reasons = [];
    let score = 20;
    const location = isSchemeForState(scheme, user.state);

    if (location === false) {
      score -= 40;
      reasons.push('state');
    } else if (location === true && user.state && !schemeCoverage(scheme).includes('all')) {
      score += 30;
      reasons.push('state');
    }

    if (preferredCat && scheme.category === preferredCat) {
      score += 35;
      reasons.push(scheme.category);
    }
    if (age && age >= rules.minAge && age <= rules.maxAge) {
      score += 20;
      reasons.push('age');
    }
    if (rules.farmerRequired && occ.includes('farmer')) {
      score += 20;
      reasons.push('farmer');
    }
    if (rules.studentRequired && occ.includes('student')) {
      score += 20;
      reasons.push('student');
    }
    if (income && rules.incomeLimit && income <= rules.incomeLimit) {
      score += 10;
    }
    if (gender && (rules.gender || []).includes(gender)) {
      score += 5;
    }

    return { ...scheme, matchPercentage: Math.max(0, Math.min(99, score)), reasons };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);
}
