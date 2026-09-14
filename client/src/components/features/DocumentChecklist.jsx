import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle, ExternalLink, Upload, Loader2,
  AlertTriangle, XCircle, ShieldCheck, FileText,
  ChevronDown, ChevronUp, RefreshCw, AlertCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoice } from '@/contexts/VoiceContext';
import { documentsApi } from '@/services/api';

// ── Status metadata ───────────────────────────────────────────────────────────
const STATUS_META = {
  verified:       { badge: 'success', icon: ShieldCheck,  labelEn: 'Verified',       labelHi: 'सत्यापित',        rowBg: 'bg-green-50 border-green-200' },
  warning:        { badge: 'warning', icon: AlertTriangle, labelEn: 'Review needed',  labelHi: 'जाँचें',          rowBg: 'bg-amber-50 border-amber-200' },
  error:          { badge: 'error',   icon: XCircle,       labelEn: 'Issue found',    labelHi: 'समस्या मिली',     rowBg: 'bg-red-50 border-red-200' },
  wrong_document: { badge: 'error',   icon: XCircle,       labelEn: 'Wrong document', labelHi: 'गलत दस्तावेज़',   rowBg: 'bg-red-50 border-red-200' },
  uploading:      { badge: 'info',    icon: Loader2,       labelEn: 'Verifying…',     labelHi: 'जाँच हो रही है…', rowBg: 'bg-blue-50 border-blue-200' },
};

const FIELD_LABELS = {
  name: 'Name', aadhaarNumber: 'Aadhaar No.', panNumber: 'PAN',
  dateOfBirth: 'Date of Birth', gender: 'Gender', address: 'Address',
  accountNumber: 'Account No.', ifsc: 'IFSC', annualIncome: 'Annual Income',
  fatherName: 'Father/Guardian', issuedBy: 'Issued By', issueDate: 'Issue Date',
  validUntil: 'Valid Until', institution: 'Institution', rollNumber: 'Roll No.',
  headOfFamily: 'Head of Family', ownerName: 'Owner Name', surveyNumber: 'Survey No.',
  disabilityType: 'Disability Type', percentage: 'Percentage',
  caste: 'Caste', category: 'Category',
};

// ── verifyState localStorage helpers ─────────────────────────────────────────
// Key: janvaani_verify_<schemeId>
// Only verified/warning results are persisted — never uploading/error/wrong_document
const PERSIST_STATUSES = new Set(['verified', 'warning']);

function verifyKey(schemeId) {
  return `janvaani_verify_${schemeId}`;
}

function loadVerifyState(schemeId) {
  if (!schemeId) return {};
  try {
    const raw = localStorage.getItem(verifyKey(schemeId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVerifyState(schemeId, state) {
  if (!schemeId) return;
  // Only persist clean states — drop uploading / error / wrong_document
  const clean = Object.fromEntries(
    Object.entries(state).filter(([, v]) => PERSIST_STATUSES.has(v?.status))
  );
  localStorage.setItem(verifyKey(schemeId), JSON.stringify(clean));
}

// ── Client-side Jaccard (mirrors backend, includes stopwords) ────────────────
const NAME_STOPWORDS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'sh', 'shri', 'smt', 'kumari',
  'kumar', 'late', 's/o', 'd/o', 'w/o',
]);

function nameTokens(name) {
  return new Set(
    name.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(t => t && !NAME_STOPWORDS.has(t))
  );
}

function jaccard(a, b) {
  const ta = nameTokens(a), tb = nameTokens(b);
  if (!ta.size || !tb.size) return 0;
  const inter = [...ta].filter(t => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return union > 0 ? inter / union : 1;
}

// ── Client-side cross-doc field comparison ───────────────────────────────────
const CROSS_FIELDS = [
  { key: 'name',        label: 'Name',                    labelHi: 'नाम',                    type: 'jaccard' },
  { key: 'dateOfBirth', label: 'Date of Birth',           labelHi: 'जन्म तिथि',              type: 'exact'   },
  { key: 'gender',      label: 'Gender',                  labelHi: 'लिंग',                   type: 'exact'   },
  { key: 'fatherName',  label: 'Father/Guardian Name',    labelHi: 'पिता/अभिभावक का नाम',    type: 'jaccard' },
];

function normaliseDob(v) { return (v || '').replace(/[.\-]/g, '/').trim(); }

function fieldSimilarity(key, type, a, b) {
  if (!a || !b) return 1;          // missing = no conflict
  if (type === 'jaccard') return jaccard(a, b);
  if (type === 'exact')   return normaliseDob(a) === normaliseDob(b) ? 1 : 0;
  return 1;
}

function computeCrossFieldMismatches(verifyState) {
  // Build list of { id, extractedFields } for all non-uploading docs
  const docs = Object.entries(verifyState)
    .filter(([, v]) => v?.status && v.status !== 'uploading' && v.extractedFields)
    .map(([id, v]) => ({ id, fields: v.extractedFields }));

  const mismatches = [];    // cross-doc banner items  { docA, docB, field, ... }
  const perDoc = {};        // per-doc warnings        { [docId]: [{ field, otherDocId, ... }] }

  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const da = docs[i], db = docs[j];

      for (const { key, label, labelHi, type } of CROSS_FIELDS) {
        const va = (da.fields[key] || '').trim();
        const vb = (db.fields[key] || '').trim();
        if (!va || !vb) continue;

        const sim = fieldSimilarity(key, type, va, vb);
        const threshold = key === 'name' ? 0.85 : 1.0;
        if (sim >= threshold) continue;

        const severity = sim < 0.5 ? 'error' : 'warning';
        const entry = {
          field: key, fieldLabel: label, fieldLabelHi: labelHi,
          docA: da.id, valueA: va, docB: db.id, valueB: vb,
          similarity: Math.round(sim * 100) / 100, severity,
          message:   `${label} mismatch: '${da.id}' has '${va}' but '${db.id}' has '${vb}'.`,
          messageHi: `${labelHi} में अंतर: '${da.id}' में '${va}' लेकिन '${db.id}' में '${vb}'।`,
        };

        mismatches.push(entry);
        // Attach to docA — otherDoc is docB
        if (!perDoc[da.id]) perDoc[da.id] = [];
        perDoc[da.id].push({ ...entry, otherDoc: db.id, otherValue: vb });
        // Attach to docB — otherDoc is docA
        if (!perDoc[db.id]) perDoc[db.id] = [];
        perDoc[db.id].push({ ...entry, otherDoc: da.id, otherValue: va });
      }
    }
  }
  return { mismatches, perDoc };
}

const MISMATCH_COPY = {
  'hi-IN': {
    heading: 'दस्तावेज़ों में जानकारी मेल नहीं खा रही है',
    collapsed: 'विवरण और सुधार का तरीका देखें',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field} में अंतर है। ${docA} में “${valueA}” और ${docB} में “${valueB}” लिखा है।`,
    action: ({ field, docA, docB }) => `${field} सही दस्तावेज़ से मिलाकर देखें। अगर ${docA} सही है, तो ${docB} को उसी जानकारी के साथ अपडेट या दोबारा जारी कराएँ।`,
    tip: 'सुधार के बाद दोनों दस्तावेज़ फिर से अपलोड करें। आवेदन करने से पहले सभी दस्तावेज़ों में जानकारी एक जैसी होनी चाहिए।',
  },
  'en-IN': {
    heading: 'The information does not match across your documents',
    collapsed: 'View the details and how to fix them',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field} is different: ${docA} says “${valueA}”, while ${docB} says “${valueB}”.`,
    action: ({ field, docA, docB }) => `Compare ${field} with the original record. If ${docA} is correct, update or reissue ${docB} with the same information.`,
    tip: 'After correcting a document, upload both documents again. All details should match before you apply.',
  },
  'bn-IN': {
    heading: 'আপনার নথিগুলিতে তথ্য মিলছে না', collapsed: 'বিস্তারিত ও সমাধান দেখুন',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field}-এ অমিল আছে। ${docA}-তে “${valueA}”, কিন্তু ${docB}-তে “${valueB}” লেখা আছে।`,
    action: ({ field, docA, docB }) => `মূল নথির সঙ্গে ${field} মিলিয়ে দেখুন। ${docA} সঠিক হলে ${docB} একই তথ্য দিয়ে সংশোধন বা পুনরায় তৈরি করুন।`,
    tip: 'সংশোধনের পরে দুই নথিই আবার আপলোড করুন এবং আবেদনের আগে সব তথ্য মিলিয়ে নিন।',
  },
  'ta-IN': {
    heading: 'உங்கள் ஆவணங்களில் தகவல்கள் பொருந்தவில்லை', collapsed: 'விவரங்களையும் சரிசெய்யும் முறையையும் பார்க்கவும்',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field} வேறுபட்டுள்ளது. ${docA}-வில் “${valueA}”, ஆனால் ${docB}-வில் “${valueB}” உள்ளது.`,
    action: ({ field, docA, docB }) => `மூல ஆவணத்துடன் ${field}-ஐ சரிபார்க்கவும். ${docA} சரியானது என்றால் ${docB}-ஐ அதே தகவலுடன் திருத்தவும் அல்லது மறுபடியும் பெறவும்.`,
    tip: 'திருத்திய பிறகு இரண்டு ஆவணங்களையும் மீண்டும் பதிவேற்றவும். விண்ணப்பிக்கும் முன் அனைத்து தகவல்களும் ஒன்றாக இருக்க வேண்டும்.',
  },
  'te-IN': {
    heading: 'మీ పత్రాల్లో సమాచారం సరిపోలడం లేదు', collapsed: 'వివరాలు, సరిచేసే విధానం చూడండి',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field}లో తేడా ఉంది. ${docA}లో “${valueA}”, కానీ ${docB}లో “${valueB}” ఉంది.`,
    action: ({ field, docA, docB }) => `అసలు రికార్డుతో ${field}ను సరిపోల్చండి. ${docA} సరైనదైతే ${docB}ను అదే సమాచారంతో సరిచేయండి లేదా మళ్లీ జారీ చేయించండి.`,
    tip: 'సరిచేసిన తర్వాత రెండు పత్రాలను మళ్లీ అప్‌లోడ్ చేయండి. దరఖాస్తు ముందు అన్ని వివరాలు ఒకేలా ఉండాలి.',
  },
  'mr-IN': {
    heading: 'तुमच्या कागदपत्रांमधील माहिती जुळत नाही', collapsed: 'तपशील आणि दुरुस्तीचा मार्ग पहा',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field} मध्ये फरक आहे. ${docA} मध्ये “${valueA}”, तर ${docB} मध्ये “${valueB}” आहे.`,
    action: ({ field, docA, docB }) => `मूळ नोंदीशी ${field} तपासा. ${docA} बरोबर असल्यास ${docB} त्याच माहितीसह दुरुस्त किंवा पुन्हा जारी करा.`,
    tip: 'दुरुस्तीनंतर दोन्ही कागदपत्रे पुन्हा अपलोड करा. अर्ज करण्यापूर्वी सर्व माहिती समान असावी.',
  },
  'gu-IN': {
    heading: 'તમારા દસ્તાવેજોની માહિતી મેળ ખાતી નથી', collapsed: 'વિગતો અને સુધારવાની રીત જુઓ',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field}માં ફરક છે. ${docA}માં “${valueA}”, પરંતુ ${docB}માં “${valueB}” છે.`,
    action: ({ field, docA, docB }) => `મૂળ રેકોર્ડ સાથે ${field} તપાસો. જો ${docA} સાચો હોય, તો ${docB}ને એ જ માહિતીથી સુધારો અથવા ફરીથી બનાવો.`,
    tip: 'સુધારા પછી બંને દસ્તાવેજો ફરી અપલોડ કરો. અરજી પહેલાં બધી માહિતી સરખી હોવી જોઈએ.',
  },
  'kn-IN': {
    heading: 'ನಿಮ್ಮ ದಾಖಲೆಗಳಲ್ಲಿನ ಮಾಹಿತಿ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ', collapsed: 'ವಿವರಗಳು ಮತ್ತು ಸರಿಪಡಿಸುವ ವಿಧಾನ ನೋಡಿ',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field} ವಿಭಿನ್ನವಾಗಿದೆ. ${docA}ಯಲ್ಲಿ “${valueA}”, ಆದರೆ ${docB}ಯಲ್ಲಿ “${valueB}” ಇದೆ.`,
    action: ({ field, docA, docB }) => `ಮೂಲ ದಾಖಲೆಯೊಂದಿಗೆ ${field} ಪರಿಶೀಲಿಸಿ. ${docA} ಸರಿಯಾಗಿದ್ದರೆ ${docB}ಯನ್ನು ಅದೇ ಮಾಹಿತಿಯೊಂದಿಗೆ ಸರಿಪಡಿಸಿ ಅಥವಾ ಮರುಜಾರಿ ಮಾಡಿಸಿ.`,
    tip: 'ಸರಿಪಡಿಸಿದ ನಂತರ ಎರಡೂ ದಾಖಲೆಗಳನ್ನು ಮತ್ತೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಎಲ್ಲ ಮಾಹಿತಿ ಒಂದೇ ಆಗಿರಬೇಕು.',
  },
  'ml-IN': {
    heading: 'നിങ്ങളുടെ രേഖകളിലെ വിവരങ്ങൾ പൊരുത്തപ്പെടുന്നില്ല', collapsed: 'വിശദാംശങ്ങളും പരിഹാരവും കാണുക',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field}-ൽ വ്യത്യാസമുണ്ട്. ${docA}-ൽ “${valueA}”, എന്നാൽ ${docB}-ൽ “${valueB}” ആണ്.`,
    action: ({ field, docA, docB }) => `യഥാർത്ഥ രേഖയുമായി ${field} പരിശോധിക്കുക. ${docA} ശരിയാണെങ്കിൽ ${docB} അതേ വിവരങ്ങളോടെ തിരുത്തുകയോ വീണ്ടും എടുക്കുകയോ ചെയ്യുക.`,
    tip: 'തിരുത്തിയ ശേഷം രണ്ട് രേഖകളും വീണ്ടും അപ്‌ലോഡ് ചെയ്യുക. അപേക്ഷിക്കുന്നതിന് മുമ്പ് എല്ലാ വിവരങ്ങളും ഒരുപോലെ ആയിരിക്കണം.',
  },
  'pa-IN': {
    heading: 'ਤੁਹਾਡੇ ਦਸਤਾਵੇਜ਼ਾਂ ਦੀ ਜਾਣਕਾਰੀ ਮੇਲ ਨਹੀਂ ਖਾਂਦੀ', collapsed: 'ਵੇਰਵੇ ਅਤੇ ਠੀਕ ਕਰਨ ਦਾ ਤਰੀਕਾ ਵੇਖੋ',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field} ਵਿੱਚ ਫਰਕ ਹੈ। ${docA} ਵਿੱਚ “${valueA}”, ਪਰ ${docB} ਵਿੱਚ “${valueB}” ਹੈ।`,
    action: ({ field, docA, docB }) => `ਅਸਲ ਰਿਕਾਰਡ ਨਾਲ ${field} ਮਿਲਾਓ। ਜੇ ${docA} ਸਹੀ ਹੈ ਤਾਂ ${docB} ਨੂੰ ਉਸੇ ਜਾਣਕਾਰੀ ਨਾਲ ਠੀਕ ਜਾਂ ਦੁਬਾਰਾ ਜਾਰੀ ਕਰਵਾਓ।`,
    tip: 'ਸੁਧਾਰ ਤੋਂ ਬਾਅਦ ਦੋਵੇਂ ਦਸਤਾਵੇਜ਼ ਦੁਬਾਰਾ ਅਪਲੋਡ ਕਰੋ। ਅਰਜ਼ੀ ਤੋਂ ਪਹਿਲਾਂ ਸਾਰੀ ਜਾਣਕਾਰੀ ਇੱਕੋ ਜਿਹੀ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ।',
  },
  'od-IN': {
    heading: 'ଆପଣଙ୍କ ଦଲିଲର ସୂଚନା ମେଳ ଖାଉନାହିଁ', collapsed: 'ବିବରଣୀ ଓ ସମାଧାନ ଦେଖନ୍ତୁ',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field}ରେ ଅମିଳ ଅଛି। ${docA}ରେ “${valueA}”, କିନ୍ତୁ ${docB}ରେ “${valueB}” ଅଛି।`,
    action: ({ field, docA, docB }) => `ମୂଳ ରେକର୍ଡ ସହ ${field} ଯାଞ୍ଚ କରନ୍ତୁ। ${docA} ସଠିକ୍ ହେଲେ ${docB}କୁ ସେହି ସୂଚନାରେ ସଂଶୋଧନ କିମ୍ବା ପୁନଃ ଜାରି କରନ୍ତୁ।`,
    tip: 'ସଂଶୋଧନ ପରେ ଦୁଇଟି ଦଲିଲ ପୁଣି ଅପଲୋଡ୍ କରନ୍ତୁ। ଆବେଦନ ପୂର୍ବରୁ ସମସ୍ତ ସୂଚନା ଏକା ହେବା ଦରକାର।',
  },
  'mai-IN': {
    heading: 'अहाँक दस्तावेजक जानकारी नहि मिलैत अछि', collapsed: 'विवरण आ सुधारक तरीका देखू',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field} मे अन्तर अछि। ${docA} मे “${valueA}”, मुदा ${docB} मे “${valueB}” लिखल अछि।`,
    action: ({ field, docA, docB }) => `मूल रिकॉर्ड सँ ${field} मिलाउ। जँ ${docA} सही अछि तँ ${docB} केँ ओही जानकारी सँ सुधारू वा फेर जारी कराउ।`,
    tip: 'सुधारक बाद दुनू दस्तावेज फेर अपलोड करू। आवेदन सँ पहिने सभ जानकारी एक समान होयबाक चाही।',
  },
  'bho-IN': {
    heading: 'रउरा के दस्तावेजन के जानकारी ना मिलत बा', collapsed: 'विवरण आ ठीक करे के तरीका देखीं',
    detail: ({ field, docA, valueA, docB, valueB }) => `${field} में फरक बा। ${docA} में “${valueA}”, बाकिर ${docB} में “${valueB}” लिखल बा।`,
    action: ({ field, docA, docB }) => `मूल रिकॉर्ड से ${field} मिला लीं। अगर ${docA} सही बा, त ${docB} के ओही जानकारी से सुधाराईं या दोबारा बनवाईं।`,
    tip: 'सुधार के बाद दुनो दस्तावेज फेर अपलोड करीं। आवेदन से पहिले सभ जानकारी एक जइसन होखे के चाहीं।',
  },
};

function mismatchCopy(language) {
  return MISMATCH_COPY[language] || MISMATCH_COPY['en-IN'];
}

function displayDocumentId(id) {
  return String(id || 'document').replace(/[-_]/g, ' ');
}

const FIELD_LABELS_BY_LANGUAGE = {
  'bn-IN': { name: 'নাম', dateOfBirth: 'জন্ম তারিখ', gender: 'লিঙ্গ', fatherName: 'বাবা বা অভিভাবকের নাম' },
  'ta-IN': { name: 'பெயர்', dateOfBirth: 'பிறந்த தேதி', gender: 'பாலினம்', fatherName: 'தந்தை அல்லது பாதுகாவலர் பெயர்' },
  'te-IN': { name: 'పేరు', dateOfBirth: 'పుట్టిన తేదీ', gender: 'లింగం', fatherName: 'తండ్రి లేదా సంరక్షకుడి పేరు' },
  'mr-IN': { name: 'नाव', dateOfBirth: 'जन्मतारीख', gender: 'लिंग', fatherName: 'वडील किंवा पालकांचे नाव' },
  'gu-IN': { name: 'નામ', dateOfBirth: 'જન્મ તારીખ', gender: 'લિંગ', fatherName: 'પિતા અથવા વાલીનું નામ' },
  'kn-IN': { name: 'ಹೆಸರು', dateOfBirth: 'ಜನ್ಮ ದಿನಾಂಕ', gender: 'ಲಿಂಗ', fatherName: 'ತಂದೆ ಅಥವಾ ಪಾಲಕರ ಹೆಸರು' },
  'ml-IN': { name: 'പേര്', dateOfBirth: 'ജനന തീയതി', gender: 'ലിംഗം', fatherName: 'അച്ഛൻ അല്ലെങ്കിൽ രക്ഷിതാവിന്റെ പേര്' },
  'pa-IN': { name: 'ਨਾਮ', dateOfBirth: 'ਜਨਮ ਮਿਤੀ', gender: 'ਲਿੰਗ', fatherName: 'ਪਿਤਾ ਜਾਂ ਸਰਪ੍ਰਸਤ ਦਾ ਨਾਮ' },
  'od-IN': { name: 'ନାମ', dateOfBirth: 'ଜନ୍ମ ତାରିଖ', gender: 'ଲିଙ୍ଗ', fatherName: 'ବାପା କିମ୍ବା ଅଭିଭାବକଙ୍କ ନାମ' },
  'mai-IN': { name: 'नाम', dateOfBirth: 'जन्म तिथि', gender: 'लिंग', fatherName: 'पिता वा अभिभावकक नाम' },
  'bho-IN': { name: 'नाँव', dateOfBirth: 'जनम के तारीख', gender: 'लिंग', fatherName: 'बाबूजी भा अभिभावक के नाँव' },
};

function getMismatchGuidance(mismatch, language) {
  const copy = mismatchCopy(language);
  const localizedFields = FIELD_LABELS_BY_LANGUAGE[language];
  const data = {
    field: language === 'hi-IN'
      ? mismatch.fieldLabelHi
      : localizedFields?.[mismatch.field] || mismatch.fieldLabel,
    docA: displayDocumentId(mismatch.docA), valueA: mismatch.valueA,
    docB: displayDocumentId(mismatch.docB), valueB: mismatch.valueB,
  };
  return { detail: copy.detail(data), action: copy.action(data) };
}

// ── Cross-doc mismatch banner ─────────────────────────────────────────────────
function MismatchBanner({ mismatches, language }) {
  const [open, setOpen] = useState(true);
  const { speak } = useVoice();
  const spokenSignature = useRef('');
  const hasError = mismatches?.some(m => m.severity === 'error');
  const copy = mismatchCopy(language);
  const signature = `${language}:${(mismatches || []).map(m => `${m.field}:${m.docA}:${m.valueA}:${m.docB}:${m.valueB}`).join('|')}`;

  useEffect(() => {
    if (!mismatches?.length) return;
    if (spokenSignature.current === signature) return;
    spokenSignature.current = signature;
    const spokenText = [copy.heading, ...mismatches.map(m => {
      const guidance = getMismatchGuidance(m, language);
      return `${guidance.detail} ${guidance.action}`;
    }), copy.tip].join(' ');
    speak(spokenText, language);
  }, [copy, language, mismatches, signature, speak]);

  if (!mismatches?.length) return null;

  // Group by field for cleaner display
  const byField = {};
  mismatches.forEach(m => {
    if (!byField[m.field]) byField[m.field] = [];
    byField[m.field].push(m);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${hasError ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
    >
      <button type="button" className="w-full flex items-start gap-3 text-left" onClick={() => setOpen(o => !o)}>
        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${hasError ? 'text-red-600' : 'text-amber-600'}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${hasError ? 'text-red-800' : 'text-amber-800'}`}>
            {copy.heading}
          </p>
          {!open && <p className="text-xs text-gray-500 mt-0.5">{copy.collapsed}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-gray-400 mt-0.5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 pl-8">
              {Object.entries(byField).map(([field, items]) => (
                <div key={field}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${hasError ? 'text-red-600' : 'text-amber-600'}`}>
                    {language === 'hi-IN' ? items[0].fieldLabelHi : items[0].fieldLabel}
                  </p>
                  {items.map((m, i) => (
                    <div key={i} className="text-sm text-gray-700 mb-1.5">
                      {(() => {
                        const guidance = getMismatchGuidance(m, language);
                        return (
                          <>
                            <p className="font-medium">{guidance.detail}</p>
                            <p className="text-xs mt-1 text-gray-600">{guidance.action}</p>
                          </>
                        );
                      })()}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium">{m.docA}:</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-xs font-mono">{m.valueA}</span>
                        <span className="text-gray-400 text-xs">↔</span>
                        <span className="text-xs text-gray-500 font-medium">{m.docB}:</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-xs font-mono">{m.valueB}</span>
                        {m.field === 'name' && (
                          <Badge variant={m.severity === 'error' ? 'error' : 'warning'}>
                            {Math.round(m.similarity * 100)}% match
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <p className={`text-xs font-medium pt-1 ${hasError ? 'text-red-700' : 'text-amber-700'}`}>{copy.tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Single document row ───────────────────────────────────────────────────────
function DocRow({ doc, haveIds, onToggle, verifyState, crossWarnings, onUpload, language }) {
  const fileInputRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);

  const have   = haveIds.includes(doc.id);
  const vState = verifyState[doc.id];
  const meta   = vState?.status ? STATUS_META[vState.status] : null;
  const Icon   = meta?.icon;

  // Auto-open detail panel when result arrives
  useEffect(() => {
    if (vState?.status && vState.status !== 'uploading') setShowDetails(true);
  }, [vState?.status]);

  // Also open when cross warnings arrive for this doc
  useEffect(() => {
    if (crossWarnings?.length) setShowDetails(true);
  }, [crossWarnings?.length]);

  const rowBg = meta
    ? meta.rowBg
    : have
      ? 'bg-green-50/70 border-green-200'
      : 'bg-white border-gray-200 hover:border-primary-300';

  const ownWarnings   = vState?.warnings || [];
  const hasExtracted  = vState?.extractedFields &&
    Object.values(vState.extractedFields).some(v => v != null && v !== '');
  const hasCrossWarns = crossWarnings?.length > 0;
  const showExpander  = hasExtracted || ownWarnings.length > 0 || hasCrossWarns;

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(doc, file);
    e.target.value = '';
  }, [doc, onUpload]);

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border transition-all ${rowBg}`}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Toggle button — manual override */}
        <button type="button" onClick={() => onToggle?.(doc.id)}
          className="flex-shrink-0 focus:outline-none" aria-label="Toggle"
        >
          {vState?.status === 'uploading' ? (
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          ) : Icon ? (
            <Icon className={`w-6 h-6 ${
              meta.badge === 'success' ? 'text-green-600' :
              meta.badge === 'warning' ? 'text-amber-600' : 'text-red-600'}`}
            />
          ) : have ? (
            <ShieldCheck className="w-6 h-6 text-gray-300" />
          ) : (
            <Circle className="w-6 h-6 text-gray-300" />
          )}
        </button>

        {/* Name + badge */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{doc.name || doc.requiredLabel || doc.id}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {meta ? (
              <Badge variant={meta.badge} dot>{language === 'hi-IN' ? meta.labelHi : meta.labelEn}</Badge>
            ) : (
              <p className="text-xs text-gray-500">
                {language === 'hi-IN' ? 'अपलोड करें और सत्यापित करें' : 'Upload to verify'}
              </p>
            )}
            {vState?.extractedFields?.name && vState.status === 'verified' && (
              <span className="text-xs text-gray-500 font-mono truncate max-w-[140px]">
                {vState.extractedFields.name}
              </span>
            )}
          </div>
        </div>

        {/* Upload + expand */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={vState?.status === 'uploading'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${vState?.status === 'uploading'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : vState?.status
                  ? 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600'
                  : 'bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100'}`}
          >
            {vState?.status === 'uploading'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : vState?.status ? <RefreshCw className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {vState?.status
                ? (language === 'hi-IN' ? 'फिर अपलोड' : 'Re-upload')
                : (language === 'hi-IN' ? 'अपलोड' : 'Upload')}
            </span>
          </button>

          {showExpander && (
            <button type="button" onClick={() => setShowDetails(p => !p)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {showDetails && showExpander && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {/* Own verification warnings */}
              {ownWarnings.map((w, i) => (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm
                  ${w.severity === 'error'   ? 'bg-red-50 text-red-700 border border-red-200' :
                    w.severity === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                               'bg-blue-50 text-blue-700 border border-blue-200'}`}
                >
                  {w.severity === 'error'   ? <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                   w.severity === 'warning' ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                                              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <p>{language === 'hi-IN' ? (w.messageHi || w.message) : w.message}</p>
                </div>
              ))}

              {/* Cross-document field mismatches */}
              {hasCrossWarns && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {language === 'hi-IN' ? 'अन्य दस्तावेज़ों से तुलना' : 'Cross-document comparison'}
                  </p>
                  {crossWarnings.map((w, i) => (
                    <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm
                      ${w.severity === 'error' ? 'bg-red-50 text-red-700 border border-red-200'
                                               : 'bg-amber-50 text-amber-700 border border-amber-200'}`}
                    >
                      {w.severity === 'error'
                        ? <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {language === 'hi-IN' ? w.fieldLabelHi : w.fieldLabel}
                          {' '}{language === 'hi-IN' ? 'मेल नहीं खाता' : 'mismatch'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                          <span className="opacity-70">{language === 'hi-IN' ? 'यह दस्तावेज़:' : 'This doc:'}</span>
                          <span className="font-mono font-semibold bg-white/60 px-1.5 py-0.5 rounded">
                            {w.docA === doc.id ? w.valueA : w.valueB}
                          </span>
                          <span className="opacity-50">↔</span>
                          <span className="opacity-70">{w.otherDoc}:</span>
                          <span className="font-mono font-semibold bg-white/60 px-1.5 py-0.5 rounded">
                            {w.otherValue}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted fields */}
              {hasExtracted && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {language === 'hi-IN' ? 'दस्तावेज़ से निकाली जानकारी' : 'Document Details'}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {Object.entries(vState.extractedFields).map(([key, val]) =>
                      val ? (
                        <div key={key} className="text-xs">
                          <span className="text-gray-500">{FIELD_LABELS[key] || key}: </span>
                          <span className="font-medium text-gray-800">{val}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main DocumentChecklist component ──────────────────────────────────────────
const DocumentChecklist = ({
  schemeId      = '',
  schemeName    = '',
  schemeNameHi  = '',
  docs          = [],
  haveIds       = [],
  onToggle,
  profileName   = '',
}) => {
  const { t, language } = useLanguage();

  // Load verifyState from localStorage on mount (only verified/warning states persist)
  const [verifyState, setVerifyState] = useState(() => loadVerifyState(schemeId));
  const [crossMismatches, setCrossMismatches] = useState([]);
  const [crossPerDoc, setCrossPerDoc] = useState({});

  // Only verified/warning docs count toward progress — not wrong/error
  const verifiedDocIds = new Set(
    Object.entries(verifyState)
      .filter(([, v]) => PERSIST_STATUSES.has(v?.status))
      .map(([id]) => id)
  );
  // haveCount: manual ticks (from localStorage) OR uploaded+verified
  const haveCount     = docs.filter(d => haveIds.includes(d.id) || verifiedDocIds.has(d.id)).length;
  const verifiedCount = verifiedDocIds.size;
  const missing       = docs.filter(d => !haveIds.includes(d.id) && !verifiedDocIds.has(d.id));
  const progressPct   = docs.length > 0 ? Math.round((haveCount / docs.length) * 100) : 0;
  const allVerified   = docs.length > 0 && docs.every(d => verifiedDocIds.has(d.id));
  const hasAnyError   = Object.values(verifyState).some(
    v => v?.status === 'error' || v?.status === 'wrong_document'
  ) || crossMismatches.some(m => m.severity === 'error');

  // Persist verifyState to localStorage whenever it changes
  useEffect(() => {
    saveVerifyState(schemeId, verifyState);
  }, [schemeId, verifyState]);

  // Recompute cross-doc field mismatches after every upload
  const recomputeCrossMismatches = useCallback((nextState) => {
    const { mismatches, perDoc } = computeCrossFieldMismatches(nextState);
    setCrossMismatches(mismatches);
    setCrossPerDoc(perDoc);
  }, []);

  useEffect(() => {
    recomputeCrossMismatches(verifyState);
  }, [recomputeCrossMismatches, verifyState]);

  const handleUpload = useCallback(async (doc, file) => {
    // Spinner on — do NOT toggle haveId yet
    setVerifyState(prev => ({ ...prev, [doc.id]: { status: 'uploading' } }));

    try {
      const res  = await documentsApi.verify(file, {
        schemeDocKey: doc.id,
        profileName:  profileName || '',
      });
      const data = res?.data || {};
      const finalStatus = data.status || 'verified';

      setVerifyState(prev => {
        const next = {
          ...prev,
          [doc.id]: {
            status:          finalStatus,
            extractedFields: data.extractedFields || {},
            warnings:        data.warnings        || [],
            fileName:        file.name,
            typeMatch:       data.typeMatch,
            statusMessage:   data.statusMessage,
            statusMessageHi: data.statusMessageHi,
          },
        };
        recomputeCrossMismatches(next);
        return next;
      });

      // Only mark "have" when document is actually valid
      if (PERSIST_STATUSES.has(finalStatus) && !haveIds.includes(doc.id)) {
        onToggle?.(doc.id);
      }
    } catch (err) {
      setVerifyState(prev => {
        const next = {
          ...prev,
          [doc.id]: {
            status:   'error',
            extractedFields: {},
            warnings: [{
              type:      'UPLOAD_FAILED',
              message:   err?.response?.data?.detail || 'Upload failed. Please try again.',
              messageHi: 'अपलोड विफल। कृपया पुनः प्रयास करें।',
              severity:  'error',
            }],
            fileName: file.name,
          },
        };
        recomputeCrossMismatches(next);
        return next;
      });
      // Don't toggle haveId on failure
    }
  }, [haveIds, onToggle, profileName, recomputeCrossMismatches]);

  const displayName = language === 'hi-IN' ? (schemeNameHi || schemeName) : schemeName;

  return (
    <div className="space-y-4">

      <MismatchBanner mismatches={crossMismatches} language={language} />

      {/* Header + progress */}
      <Card>
        <div className="space-y-4">
          {displayName && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary-50 flex-shrink-0">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-0.5">
                  {language === 'hi-IN' ? 'योजना के लिए दस्तावेज़' : 'Documents required for'}
                </p>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">{displayName}</h2>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">
                {language === 'hi-IN' ? `${haveCount} / ${docs.length} दस्तावेज़` : `${haveCount} of ${docs.length} documents`}
              </span>
              <span className="text-sm font-semibold text-gray-900">{progressPct}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${progressPct === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {verifiedCount > 0 && (
              <Badge variant="success" dot>
                {language === 'hi-IN' ? `${verifiedCount} सत्यापित` : `${verifiedCount} verified`}
              </Badge>
            )}
            {allVerified && crossMismatches.length === 0 && (
              <Badge variant="success">{language === 'hi-IN' ? '✓ सभी दस्तावेज़ तैयार' : '✓ All docs ready'}</Badge>
            )}
            {hasAnyError && (
              <Badge variant="error" dot>{language === 'hi-IN' ? 'कुछ दस्तावेज़ में समस्या' : 'Issues found'}</Badge>
            )}
            {crossMismatches.length > 0 && (
              <Badge variant="error" dot>{language === 'hi-IN' ? 'नाम मेल नहीं खाता' : 'Name mismatch'}</Badge>
            )}
            {missing.length > 0 && (
              <Badge variant="warning" dot>
                {language === 'hi-IN' ? `${missing.length} अभी चाहिए` : `${missing.length} still needed`}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Doc rows */}
      <Card>
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900">
            {language === 'hi-IN' ? 'दस्तावेज़ सूची' : 'Document Checklist'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'hi-IN'
              ? 'प्रत्येक दस्तावेज़ अपलोड करें — नाम और जानकारी स्वचालित जाँची जाएगी'
              : 'Upload each document — name and details will be verified automatically'}
          </p>
        </div>

        <div className="space-y-3">
          {docs.map(doc => (
            <DocRow
              key={doc.id}
              doc={doc}
              haveIds={haveIds}
              onToggle={onToggle}
              verifyState={verifyState}
              crossWarnings={crossPerDoc[doc.id] || []}
              onUpload={handleUpload}
              language={language}
            />
          ))}
        </div>
      </Card>

      {/* How to get missing docs */}
      {missing.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">
            {language === 'hi-IN' ? 'ये दस्तावेज़ कैसे लें?' : 'How to get missing documents'}
          </h3>
          <div className="space-y-3">
            {missing.map(doc => {
              const translated = t(`docHowTo.${doc.id}`);
              const howToText  = translated && !translated.startsWith('docHowTo.')
                ? translated : doc.howTo || t('docsChecklist.howToGet');
              return (
                <div key={doc.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <ExternalLink className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{doc.name || doc.requiredLabel || doc.id}</p>
                    <p className="text-xs text-gray-600 mt-1">{howToText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* All-clear */}
      {allVerified && crossMismatches.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200"
        >
          <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">
              {language === 'hi-IN' ? 'सभी दस्तावेज़ सत्यापित!' : 'All documents verified!'}
            </p>
            <p className="text-sm text-green-700 mt-0.5">
              {language === 'hi-IN' ? 'आप इस योजना के लिए आवेदन कर सकते हैं।' : 'You are ready to apply for this scheme.'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DocumentChecklist;
