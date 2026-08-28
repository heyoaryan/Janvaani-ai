export const INDIAN_STATES = [
  { id: 'andhra-pradesh', aliases: ['andhra pradesh', 'andhra', 'ap', 'आंध्र प्रदेश'] },
  { id: 'arunachal-pradesh', aliases: ['arunachal pradesh', 'arunachal'] },
  { id: 'assam', aliases: ['assam', 'असम'] },
  { id: 'bihar', aliases: ['bihar', 'बिहार'] },
  { id: 'chhattisgarh', aliases: ['chhattisgarh', 'छत्तीसगढ़'] },
  { id: 'delhi', aliases: ['delhi', 'nct', 'nct of delhi', 'new delhi', 'ncr', 'दिल्ली'] },
  { id: 'goa', aliases: ['goa', 'गोवा'] },
  { id: 'gujarat', aliases: ['gujarat', 'गुजरात'] },
  { id: 'haryana', aliases: ['haryana', 'हरियाणा'] },
  { id: 'himachal-pradesh', aliases: ['himachal pradesh', 'himachal', 'hp', 'हिमाचल'] },
  { id: 'jharkhand', aliases: ['jharkhand', 'झारखंड'] },
  { id: 'karnataka', aliases: ['karnataka', 'कर्नाटक'] },
  { id: 'kerala', aliases: ['kerala', 'केरल'] },
  { id: 'madhya-pradesh', aliases: ['madhya pradesh', 'mp', 'मध्य प्रदेश'] },
  { id: 'maharashtra', aliases: ['maharashtra', 'महाराष्ट्र'] },
  { id: 'manipur', aliases: ['manipur'] },
  { id: 'meghalaya', aliases: ['meghalaya'] },
  { id: 'mizoram', aliases: ['mizoram'] },
  { id: 'nagaland', aliases: ['nagaland'] },
  { id: 'odisha', aliases: ['odisha', 'orissa', 'ओडिशा'] },
  { id: 'punjab', aliases: ['punjab', 'पंजाब'] },
  { id: 'rajasthan', aliases: ['rajasthan', 'राजस्थान'] },
  { id: 'sikkim', aliases: ['sikkim'] },
  { id: 'tamil-nadu', aliases: ['tamil nadu', 'tn', 'tamilnadu', 'तमिलनाडु'] },
  { id: 'telangana', aliases: ['telangana', 'तेलंगाना'] },
  { id: 'tripura', aliases: ['tripura'] },
  { id: 'uttar-pradesh', aliases: ['uttar pradesh', 'up', 'उत्तर प्रदेश'] },
  { id: 'uttarakhand', aliases: ['uttarakhand', 'उत्तराखंड'] },
  { id: 'west-bengal', aliases: ['west bengal', 'bengal', 'wb', 'पश्चिम बंगाल'] },
  { id: 'jammu-kashmir', aliases: ['jammu and kashmir', 'jammu kashmir', 'j&k', 'jk'] },
  { id: 'ladakh', aliases: ['ladakh'] },
  { id: 'chandigarh', aliases: ['chandigarh'] },
  { id: 'puducherry', aliases: ['puducherry', 'pondicherry'] },
];

export function normalizeState(value) {
  const n = String(value || '').toLowerCase().trim();
  if (!n || n === 'all' || n === 'all india') return n === 'all' || n === 'all india' ? 'all' : '';
  const hit = INDIAN_STATES.find((s) => s.id === n || s.aliases.includes(n));
  return hit ? hit.id : n.replace(/\s+/g, '-');
}

export function schemeCoverage(scheme) {
  const fromRules = scheme?.eligibilityRules?.states;
  if (Array.isArray(fromRules) && fromRules.length) {
    return fromRules.map((s) => normalizeState(s) || s);
  }
  const raw = scheme?.state || 'All India';
  if (!raw || /^all india$/i.test(raw) || raw === 'all') return ['all'];
  return [normalizeState(raw) || raw];
}

export function isSchemeForState(scheme, userState) {
  const coverage = schemeCoverage(scheme);
  if (coverage.includes('all')) return true;
  const user = normalizeState(userState);
  if (!user) return null;
  return coverage.includes(user);
}
