const MOCK_APPLICATIONS = [
  {
    applicationNumber: 'APP-1001',
    scheme: 'PM-Kisan',
    status: 'Under review',
    stage: 'Document verification',
    date: '12 August 2026',
    amount: '₹ 6,000',
  },
  {
    applicationNumber: 'APP-1002',
    scheme: 'Pradhan Mantri Awas Yojana',
    status: 'Approved',
    stage: 'Sanctioned',
    date: '5 September 2026',
    amount: '₹ 1,50,000',
  },
  {
    applicationNumber: 'APP-1003',
    scheme: 'National Scholarship Portal',
    status: 'Pending',
    stage: 'Last document pending',
    date: '18 July 2026',
    amount: '₹ 25,000',
  },
  {
    applicationNumber: 'APP-1004',
    scheme: 'PM Fasal Bima Yojana',
    status: 'In progress',
    stage: 'Claim processing',
    date: '11 September 2026',
    amount: '₹ 20,000',
  },
  {
    applicationNumber: 'APP-1005',
    scheme: 'Senior Citizen Pension',
    status: 'Payment scheduled',
    stage: 'Disbursement',
    date: '30 September 2026',
    amount: '₹ 3,000',
  },
];

const LANGUAGE_CHOICES = {
  '1': { code: 'hi-IN', label: 'हिन्दी', prompt: 'हिंदी' },
  '2': { code: 'en-IN', label: 'English', prompt: 'English' },
  '3': { code: 'pa-IN', label: 'ਪੰਜਾਬੀ', prompt: 'Punjabi' },
};

const SELECTION_CHOICES = {
  '1': 'scheme_info',
  '2': 'application_track',
  '3': 'talk_to_executor',
  '4': 'further_help',
};

function resolveLanguageChoice(digit) {
  const choice = LANGUAGE_CHOICES[String(digit)];
  return choice ? choice.code : null;
}

function resolveSelectionChoice(digit) {
  return SELECTION_CHOICES[String(digit)] || null;
}

function findApplicationByNumber(applicationNumber) {
  if (!applicationNumber) return null;
  const normalized = String(applicationNumber).trim().toUpperCase();
  return MOCK_APPLICATIONS.find((entry) => entry.applicationNumber.toUpperCase() === normalized) || null;
}

function getApplicationStatusText(applicationNumber, language = 'hi-IN') {
  const app = findApplicationByNumber(applicationNumber);
  if (!app) {
    const notFound = {
      'hi-IN': 'माफ कीजिए, यह आवेदन नंबर हमारी सूची में नहीं है। कृपया सही आवेदन नंबर बताइए।',
      'en-IN': 'Sorry, that application number is not in our list. Please provide the correct application number.',
      'pa-IN': 'ਮਾਫ਼ ਕਰਨਾ, ਇਹ ਅਰਜ਼ੀ ਨੰਬਰ ਸਾਡੀ ਸੂਚੀ ਵਿੱਚ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਅਰਜ਼ੀ ਨੰਬਰ ਦੱਸੋ।',
    };
    return notFound[language] || notFound['hi-IN'];
  }

  const templates = {
    'hi-IN': `आपका आवेदन नंबर ${app.applicationNumber} है। ${app.scheme} योजना के तहत स्थिति ${app.status} है। स्टेज: ${app.stage}. अगला अपडेट ${app.date} को होगा। कुल लाभ ${app.amount} है।`,
    'en-IN': `Your application number is ${app.applicationNumber}. Under the ${app.scheme} scheme, the status is ${app.status}. Stage: ${app.stage}. The next update is expected on ${app.date}. Total benefit: ${app.amount}.`,
    'pa-IN': `ਤੁਹਾਡਾ ਅਰਜ਼ੀ ਨੰਬਰ ${app.applicationNumber} ਹੈ। ${app.scheme} ਯੋਜਨਾਅਧੀਨ ਸਥਿਤੀ ${app.status} ਹੈ। ਸਟੇਜ: ${app.stage}. ਅਗਲਾ ਅਪਡੇਟ ${app.date} ਨੂੰ ਹੋਵੇਗਾ। ਕੁੱਲ ਲਾਭ ${app.amount} ਹੈ।`,
  };

  return templates[language] || templates['hi-IN'];
}

module.exports = {
  MOCK_APPLICATIONS,
  LANGUAGE_CHOICES,
  SELECTION_CHOICES,
  resolveLanguageChoice,
  resolveSelectionChoice,
  findApplicationByNumber,
  getApplicationStatusText,
};
