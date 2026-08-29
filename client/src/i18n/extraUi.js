const statesHi = {
  'andhra-pradesh': 'आंध्र प्रदेश', assam: 'असम', bihar: 'बिहार', chhattisgarh: 'छत्तीसगढ़',
  delhi: 'दिल्ली', goa: 'गोवा', gujarat: 'गुजरात', haryana: 'हरियाणा', 'himachal-pradesh': 'हिमाचल प्रदेश',
  jharkhand: 'झारखंड', karnataka: 'कर्नाटक', kerala: 'केरल', 'madhya-pradesh': 'मध्य प्रदेश',
  maharashtra: 'महाराष्ट्र', odisha: 'ओडिशा', punjab: 'पंजाब', rajasthan: 'राजस्थान',
  'tamil-nadu': 'तमिलनाडु', telangana: 'तेलंगाना', 'uttar-pradesh': 'उत्तर प्रदेश',
  uttarakhand: 'उत्तराखंड', 'west-bengal': 'पश्चिम बंगाल', 'jammu-kashmir': 'जम्मू और कश्मीर',
  ladakh: 'लद्दाख', chandigarh: 'चंडीगढ़', puducherry: 'पुडुचेरी', manipur: 'मणिपुर',
  meghalaya: 'मेघालय', mizoram: 'मिजोरम', nagaland: 'नागालैंड', sikkim: 'सिक्किम', tripura: 'त्रिपुरा',
  'arunachal-pradesh': 'अरुणाचल प्रदेश',
};

const statesEn = Object.fromEntries(Object.keys(statesHi).map((id) => [id, id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())]));

const docsHi = {
  aadhaar: 'आधार कार्ड', pan: 'पैन कार्ड', 'income-cert': 'आय प्रमाण पत्र', domicile: 'निवास प्रमाण पत्र',
  'bank-account': 'बैंक पासबुक / खाता', 'college-id': 'छात्र पहचान पत्र', marksheet: 'मार्कशीट',
  'ration-card': 'राशन कार्ड', 'land-docs': 'भूमि दस्तावेज', 'birth-cert': 'जन्म प्रमाण पत्र',
  'caste-cert': 'जाति प्रमाण पत्र', 'disability-cert': 'विकलांगता प्रमाण पत्र', 'mcp-card': 'एमसीपी कार्ड',
  'farmer-id': 'किसान कार्ड', 'electricity-bill': 'बिजली बिल', 'vendor-cert': 'वेंडर प्रमाण पत्र',
  'mobile-number': 'पंजीकृत मोबाइल', 'shg-membership': 'एसएचजी सदस्यता', 'education-cert': 'शिक्षा प्रमाण पत्र',
};

const docsEn = {
  aadhaar: 'Aadhaar card', pan: 'PAN card', 'income-cert': 'Income certificate', domicile: 'Domicile / address proof',
  'bank-account': 'Bank passbook / account', 'college-id': 'Student ID', marksheet: 'Marksheet',
  'ration-card': 'Ration card', 'land-docs': 'Land records', 'birth-cert': 'Birth certificate',
  'caste-cert': 'Caste certificate', 'disability-cert': 'Disability certificate', 'mcp-card': 'MCP card',
  'farmer-id': 'Farmer / Kisan card', 'electricity-bill': 'Electricity bill', 'vendor-cert': 'Vendor certificate',
  'mobile-number': 'Registered mobile number', 'shg-membership': 'SHG membership proof', 'education-cert': 'Education certificate',
};

const howToHi = {
  aadhaar: 'uidai.gov.in या नज़दीकी आधार केंद्र / CSC पर अपॉइंटमेंट लेकर बनवाएँ या अपडेट करें।',
  pan: 'incometax.gov.in पर नया पैन आवेदन करें, या NSDL/UTIITSL केंद्र जाएँ।',
  'income-cert': ' तहसील / e-District / CSC पर आधार और आय प्रमाण देकर बनवाएँ।',
  domicile: 'जिला कार्यालय या राज्य e-District पोर्टल पर निवास प्रमाण के साथ आवेदन करें।',
  'bank-account': 'किसी बैंक या इंडिया पोस्ट पेमेंट्स बैंक में आधार लेकर खाता खोलें (जन धन भी)।',
  'college-id': 'अपने कॉलेज/स्कूल कार्यालय से बोनाफाइड या आईडी कार्ड लें।',
  marksheet: 'बोर्ड/विश्वविद्यालय पोर्टल से डिजिटल मार्कशीट डाउनलोड करें या संस्था से प्रतिलिपि लें।',
  'ration-card': 'राज्य खाद्य एवं नागरिक आपूर्ति पोर्टल या CSC पर आधार से नया/अपडेट राशन कार्ड।',
  'land-docs': 'तहसील / भू-अभिलेख पोर्टल (जैसे भूलेख) से खसरा-खतौनी निकालें।',
  'birth-cert': 'नगर निगम / CRS (crsorgi.gov.in) से जन्म प्रमाण पत्र डाउनलोड करें।',
  'caste-cert': 'तहसील या राज्य जाति प्रमाण पोर्टल पर आवेदन करें।',
  'disability-cert': 'UDID पोर्टल (swavlambancard.gov.in) या जिला अस्पताल से दिव्यांग प्रमाण पत्र।',
  'mcp-card': 'आंगनवाड़ी / ANM / सरकारी अस्पताल से मातृ-शिशु कार्ड बनवाएँ।',
  'farmer-id': 'कृषि विभाग / CSC से किसान आईडी या PM-KISAN पंजीकरण करवाएँ।',
  'electricity-bill': 'बिजली डिस्कॉम ऐप/केंद्र से नवीनतम बिल डाउनलोड करें।',
  'vendor-cert': 'नगर निगम / वेंडिंग कमेटी से स्ट्रीट वेंडर प्रमाण पत्र लें।',
  'mobile-number': 'आधार से लिंक सिम किसी CSC/स्टोर पर KYC करवाकर पंजीकृत करें।',
  'shg-membership': 'नज़दीकी SRLM / NRLM कार्यालय से SHG सदस्यता प्रमाण लें।',
  'education-cert': 'स्कूल/कॉलेज से स्थानांतरण या Bonafide प्रमाण पत्र लें।',
};

const howToEn = {
  aadhaar: 'Book at uidai.gov.in or visit an Aadhaar centre / CSC to enrol or update.',
  pan: 'Apply on incometax.gov.in or at an NSDL/UTIITSL centre.',
  'income-cert': 'Apply at tehsil / e-District / CSC with Aadhaar and income proof.',
  domicile: 'Apply at the district office or the state e-District portal with residence proof.',
  'bank-account': 'Open an account at any bank or IPPB with Aadhaar (Jan Dhan is also fine).',
  'college-id': 'Collect a bonafide or ID card from your college/school office.',
  marksheet: 'Download from the board/university portal or request a copy from the institute.',
  'ration-card': 'Apply on the state food & civil supplies portal or at a CSC using Aadhaar.',
  'land-docs': 'Get khata/khasra from the tehsil or the state land-records portal.',
  'birth-cert': 'Download from the municipality or CRS (crsorgi.gov.in).',
  'caste-cert': 'Apply at tehsil or the state caste-certificate portal.',
  'disability-cert': 'Apply on the UDID portal (swavlambancard.gov.in) or district hospital.',
  'mcp-card': 'Get a mother-and-child card at anganwadi / ANM / government hospital.',
  'farmer-id': 'Register at the agriculture office / CSC or on PM-KISAN.',
  'electricity-bill': 'Download the latest bill from your DISCOM app or office.',
  'vendor-cert': 'Get a street-vendor certificate from the municipal vending committee.',
  'mobile-number': 'Complete SIM KYC at a store/CSC and keep it linked to Aadhaar.',
  'shg-membership': 'Ask the local SRLM/NRLM office for SHG membership proof.',
  'education-cert': 'Ask the school/college for a bonafide or transfer certificate.',
};

function eligibilityExtras(lang) {
  const hi = lang === 'hi';
  return hi ? {
    reasonAgeLow: 'आपकी आयु {age} वर्ष है, जबकि इस योजना के लिए न्यूनतम आयु {min} वर्ष है।',
    reasonAgeHigh: 'आपकी आयु {age} वर्ष है, जबकि इस योजना की अधिकतम आयु {max} वर्ष है।',
    reasonAgeOk: 'आयु {age} वर्ष सीमा {min}–{max} में है।',
    reasonAgeMissing: 'आयु नहीं भरी। योजना {min}–{max} वर्ष वालों के लिए है।',
    reasonIncomeOver: 'आपकी वार्षिक आय ₹{income} है, सीमा ₹{limit} है — इसलिए पात्र नहीं।',
    reasonIncomeOk: 'वार्षिक आय ₹{income} सीमा ₹{limit} के अंदर है।',
    reasonIncomeMissing: 'आय नहीं भरी। सीमा ₹{limit} है।',
    reasonIncomeNone: 'इस योजना पर आय की ऊपरी सीमा नहीं है।',
    reasonGenderFail: 'यह योजना आपके लिंग के लिए नहीं है।',
    reasonGenderOk: 'लिंग की शर्त पूरी होती है।',
    reasonGenderMissing: 'लिंग चुनें ताकि पात्रता पक्की हो।',
    reasonStateFail: 'यह योजना {places} के लिए है। आप {state} से हैं, इसलिए पात्र नहीं।',
    reasonStateOk: 'यह योजना आपके राज्य ({state}) में लागू है।',
    reasonStateAll: 'यह अखिल भारतीय योजना है।',
    reasonStateMissing: 'राज्य चुनें। यह योजना यहाँ चलती है: {places}।',
    reasonFarmerFail: 'यह योजना किसानों के लिए है। आपकी प्रोफ़ाइल में पेशा {occupation} है।',
    reasonFarmerOk: 'किसान होने की शर्त पूरी होती है।',
    reasonStudentFail: 'यह योजना छात्रों के लिए है। आपकी प्रोफ़ाइल में पेशा {occupation} है।',
    reasonStudentOk: 'छात्र होने की शर्त पूरी होती है।',
    allIndia: 'पूरा भारत',
    whyNotTitle: 'पात्र क्यों नहीं',
    whyYesTitle: 'पात्र क्यों',
  } : {
    reasonAgeLow: 'Your age is {age}, but this scheme needs a minimum age of {min}.',
    reasonAgeHigh: 'Your age is {age}, but this scheme allows a maximum age of {max}.',
    reasonAgeOk: 'Age {age} is within {min}–{max} years.',
    reasonAgeMissing: 'Age is missing. This scheme is for ages {min}–{max}.',
    reasonIncomeOver: 'Your annual income is ₹{income}, above the limit of ₹{limit}.',
    reasonIncomeOk: 'Annual income ₹{income} is within the ₹{limit} limit.',
    reasonIncomeMissing: 'Income is missing. The limit is ₹{limit}.',
    reasonIncomeNone: 'This scheme has no income ceiling.',
    reasonGenderFail: 'This scheme is not open for your gender.',
    reasonGenderOk: 'Gender requirement is met.',
    reasonGenderMissing: 'Select gender to confirm eligibility.',
    reasonStateFail: 'This scheme is for {places}. You selected {state}, so you are not eligible.',
    reasonStateOk: 'This scheme is available in your state ({state}).',
    reasonStateAll: 'This is an all-India scheme.',
    reasonStateMissing: 'Select your state. This scheme runs in: {places}.',
    reasonFarmerFail: 'This scheme is for farmers. Your profile occupation is {occupation}.',
    reasonFarmerOk: 'Farmer requirement is met.',
    reasonStudentFail: 'This scheme is for students. Your profile occupation is {occupation}.',
    reasonStudentOk: 'Student requirement is met.',
    allIndia: 'All India',
    whyNotTitle: 'Why you are not eligible',
    whyYesTitle: 'Why you qualify',
  };
}

function scamExtras(lang) {
  const hi = lang === 'hi';
  return hi ? {
    analyzeTitle: 'संदिग्ध संदेश जाँचें',
    pasteLabel: 'संदिग्ध संदेश यहाँ लिखें',
    urlLabel: 'संदिग्ध लिंक (वैकल्पिक)',
    analyzeButton: 'धोखाधड़ी जाँचें',
    examples: 'उदाहरण संदेश',
    tryThis: 'इसे आज़माएँ',
    stayProtected: 'सुरक्षित रहें',
    stayProtectedBody: 'हमेशा आधिकारिक सरकारी पोर्टल से जाँचें। अनजान कॉल/एसएमएस पर OTP या बैंक जानकारी न दें।',
    riskAssessment: 'जोखिम आकलन',
    analyzedText: 'जाँचा गया पाठ',
    riskIndicators: 'जोखिम संकेत',
    lowDesc: 'यह संदेश सुरक्षित लग रहा है, फिर भी सावधानी रखें।',
    mediumDesc: 'सावधानी बरतें — लिंक या पैसे की माँग संदिग्ध हो सकती है।',
    highDesc: 'यह संभवतः धोखाधड़ी है। आगे न बढ़ें।',
    staySafe: 'सतर्क रहें',
    staySafeBody: 'सरकारी अधिकारी फोन या संदेश पर OTP, पासवर्ड या बैंक विवरण नहीं माँगते।',
    checkAnother: 'दूसरा संदेश जाँचें',
    sms: 'एसएमएस', call: 'कॉल', whatsapp: 'व्हाट्सएप',
  } : {
    analyzeTitle: 'Check suspicious content',
    pasteLabel: 'Paste the suspicious message',
    urlLabel: 'Suspicious URL (optional)',
    analyzeButton: 'Check for scam',
    examples: 'Example messages',
    tryThis: 'Try this',
    stayProtected: 'Stay protected',
    stayProtectedBody: 'Always verify on official government portals. Never share OTP or bank details on unknown calls or SMS.',
    riskAssessment: 'Risk assessment',
    analyzedText: 'Analyzed text',
    riskIndicators: 'Risk indicators',
    lowDesc: 'This looks relatively safe, but stay careful.',
    mediumDesc: 'Be careful — links or money requests may be fake.',
    highDesc: 'This is likely a scam. Do not proceed.',
    staySafe: 'Stay safe',
    staySafeBody: 'Government officials never ask for OTP, passwords or bank details by phone or message.',
    checkAnother: 'Check another message',
    sms: 'SMS', call: 'Call', whatsapp: 'WhatsApp',
  };
}

const docsChecklistHi = {
  status: 'दस्तावेज़ सूची',
  ofUploaded: '{have} में से {total} आपके पास हैं',
  haveIt: 'मेरे पास है',
  missing: 'नहीं है',
  howToGet: 'जो नहीं है, उसे कैसे बनवाएँ',
  markHave: 'टिक करें अगर आपके पास है',
  selectScheme: 'पहले योजना चुनें',
};

const docsChecklistEn = {
  status: 'Document checklist',
  ofUploaded: '{have} of {total} marked as with you',
  haveIt: 'I have this',
  missing: 'I do not have this',
  howToGet: 'How to get missing documents',
  markHave: 'Tick every document you already have',
  selectScheme: 'Select a scheme first',
};

export const extraUi = {
  'hi-IN': {
    onboarding: { stepStateTitle: 'आप किस राज्य में रहते हैं?', stepStateSubtitle: 'राज्य की योजनाएँ दिखाने के लिए' },
    schemeFinder: { filterByState: 'स्थान से छानें', myState: 'मेरा राज्य', allLocations: 'सभी स्थान', locationHint: 'आपके राज्य की योजनाएँ पहले' },
    dashboard: {
      foundIntro: 'आप {role} हैं। भारत में आपके लिए {count} योजनाएं मिलीं।',
      foundIntroGeneric: 'भारत में आपके लिए {count} योजनाएं मिलीं।',
      foundIntroHint: 'नीचे पात्रता जाँच कर सकते हैं और पूरा विवरण पढ़ सकते हैं।',
      roleFarmer: 'किसान',
      roleStudent: 'छात्र',
    },
    eligibility: eligibilityExtras('hi'),
    scamCheck: scamExtras('hi'),
    docsChecklist: docsChecklistHi,
    docNames: docsHi,
    docHowTo: howToHi,
    states: statesHi,
  },
  'en-IN': {
    onboarding: { stepStateTitle: 'Which state do you live in?', stepStateSubtitle: 'So we can show state schemes' },
    schemeFinder: { filterByState: 'Filter by location', myState: 'My state', allLocations: 'All locations', locationHint: 'State schemes for your location first' },
    dashboard: {
      foundIntro: 'You are a {role}. These {count} schemes were found for you in India.',
      foundIntroGeneric: 'Found {count} schemes for you in India.',
      foundIntroHint: 'You can check eligibility and read full details below.',
      roleFarmer: 'farmer',
      roleStudent: 'student',
    },
    eligibility: eligibilityExtras('en'),
    scamCheck: scamExtras('en'),
    docsChecklist: docsChecklistEn,
    docNames: docsEn,
    docHowTo: howToEn,
    states: statesEn,
  },
};

const regionalScam = {
  'bn-IN': { analyzeTitle: 'সন্দেহজনক বার্তা যাচাই', pasteLabel: 'সন্দেহজনক বার্তা পেস্ট করুন', urlLabel: 'সন্দেহজনক লিংক (ঐচ্ছিক)', analyzeButton: 'প্রতারণা যাচাই', examples: 'উদাহরণ', tryThis: 'এটি ব্যবহার করুন', stayProtected: 'সুরক্ষিত থাকুন', stayProtectedBody: 'সরকারি পোর্টালে যাচাই করুন। OTP বা ব্যাংক তথ্য দেবেন না।', riskAssessment: 'ঝুঁকি মূল্যায়ন', analyzedText: 'বিশ্লেষিত পাঠ', riskIndicators: 'ঝুঁকির ইঙ্গিত', lowDesc: 'নিরাপদ মনে হচ্ছে, তবু সাবধান।', mediumDesc: 'সতর্ক থাকুন।', highDesc: 'এটি প্রতারণা হতে পারে।', staySafe: 'সতর্ক থাকুন', staySafeBody: 'সরকারি কর্মী ফোনে OTP চান না।', checkAnother: 'আরেকটি বার্তা যাচাই', sms: 'এসএমএস', call: 'কল', whatsapp: 'হোয়াটসঅ্যাপ' },
  'ta-IN': { analyzeTitle: 'சந்தேக செய்தியை சோதிக்கவும்', pasteLabel: 'சந்தேக செய்தியை ஒட்டவும்', urlLabel: 'சந்தேக இணைப்பு (விருப்பம்)', analyzeButton: 'மோசடி சோதனை', examples: 'எடுத்துக்காட்டுகள்', tryThis: 'இதை முயலவும்', stayProtected: 'பாதுகாப்பாக இருங்கள்', stayProtectedBody: 'அதிகாரப்பூர்வ இணையதளத்தில் சரிபார்க்கவும். OTP பகிர வேண்டாம்.', riskAssessment: 'அபாய மதிப்பீடு', analyzedText: 'சோதித்த உரை', riskIndicators: 'அபாய குறிகள்', lowDesc: 'பாதுகாப்பாகத் தெரிகிறது.', mediumDesc: 'கவனமாக இருங்கள்.', highDesc: 'இது மோசடியாக இருக்கலாம்.', staySafe: 'பாதுகாப்பாக இருங்கள்', staySafeBody: 'அரசு அலுவலர் தொலைபேசியில் OTP கேட்கமாட்டார்.', checkAnother: 'மற்றொரு செய்தி', sms: 'SMS', call: 'அழைப்பு', whatsapp: 'வாட்ஸ்அப்' },
  'te-IN': { analyzeTitle: 'అనుమాన సందేశం తనిఖీ', pasteLabel: 'సందేశం పేస్ట్ చేయండి', urlLabel: 'అనుమాన లింక్ (ఐచ్ఛికం)', analyzeButton: 'మోసం తనిఖీ', examples: 'ఉదాహరణలు', tryThis: 'దీన్ని ప్రయత్నించండి', stayProtected: 'సురక్షితంగా ఉండండి', stayProtectedBody: 'అధికారిక పోర్టల్‌లో ధృవీకరించండి. OTP ఇవ్వకండి.', riskAssessment: 'ప్రమాద అంచనా', analyzedText: 'విశ్లేషించిన పాఠం', riskIndicators: 'సూచనలు', lowDesc: 'సురక్షితంగా కనిపిస్తోంది.', mediumDesc: 'జాగ్రత్తగా ఉండండి.', highDesc: 'ఇది మోసం కావచ్చు.', staySafe: 'జాగ్రత్త', staySafeBody: 'ప్రభుత్వ అధికారి ఫోన్‌లో OTP అడగరు.', checkAnother: 'మరో సందేశం', sms: 'SMS', call: 'కాల్', whatsapp: 'వాట్సాప్' },
  'mr-IN': { analyzeTitle: 'संशयास्पद संदेश तपासा', pasteLabel: 'संदेश पेस्ट करा', urlLabel: 'संशयास्पद लिंक (ऐच्छिक)', analyzeButton: 'घोटाळा तपासा', examples: 'उदाहरणे', tryThis: 'हे वापरा', stayProtected: 'सुरक्षित रहा', stayProtectedBody: 'अधिकृत पोर्टलवर तपासा. OTP देऊ नका.', riskAssessment: 'धोका मूल्यांकन', analyzedText: 'तपासलेला मजकूर', riskIndicators: 'संकेत', lowDesc: 'सुरक्षित वाटते.', mediumDesc: 'सावध रहा.', highDesc: 'हा घोटाळा असू शकतो.', staySafe: 'सावध रहा', staySafeBody: 'सरकारी अधिकारी फोनवर OTP मागत नाहीत.', checkAnother: 'दुसरा संदेश', sms: 'SMS', call: 'कॉल', whatsapp: 'WhatsApp' },
  'gu-IN': { analyzeTitle: 'શંકાસ્પદ સંદેશ તપાસો', pasteLabel: 'સંદેશ પેસ્ટ કરો', urlLabel: 'શંકાસ્પદ લિંક (વૈકલ્પિક)', analyzeButton: 'છેતરપિંડી તપાસ', examples: 'ઉદાહરણ', tryThis: 'આ અજમાવો', stayProtected: 'સુરક્ષિત રહો', stayProtectedBody: 'સરકારી પોર્ટલ પર ચકાસો. OTP ન આપો.', riskAssessment: 'જોખમ મૂલ્યાંકન', analyzedText: 'તપાસેલ લખાણ', riskIndicators: 'સંકેતો', lowDesc: 'સુરક્ષિત લાગે છે.', mediumDesc: 'સાવધ રહો.', highDesc: 'આ છેતરપિંડી હોઈ શકે.', staySafe: 'સાવધ રહો', staySafeBody: 'સરકારી અધિકારી ફોન પર OTP માગતા નથી.', checkAnother: 'બીજો સંદેશ', sms: 'SMS', call: 'કૉલ', whatsapp: 'વોટ્સએપ' },
  'kn-IN': { analyzeTitle: 'ಅನುಮಾನ ಸಂದೇಶ ಪರಿಶೀಲಿಸಿ', pasteLabel: 'ಸಂದೇಶ ಅಂಟಿಸಿ', urlLabel: 'ಅನುಮಾನ ಲಿಂಕ್ (ಐಚ್ಛಿಕ)', analyzeButton: 'ವಂಚನೆ ಪರಿಶೀಲನೆ', examples: 'ಉದಾಹರಣೆಗಳು', tryThis: 'ಇದನ್ನು ಪ್ರಯತ್ನಿಸಿ', stayProtected: 'ಸುರಕ್ಷಿತರಾಗಿರಿ', stayProtectedBody: 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ. OTP ನೀಡಬೇಡಿ.', riskAssessment: 'ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ', analyzedText: 'ವಿಶ್ಲೇಷಿಸಿದ ಪಠ್ಯ', riskIndicators: 'ಸೂಚನೆಗಳು', lowDesc: 'ಸುರಕ್ಷಿತವಾಗಿ ಕಾಣುತ್ತದೆ.', mediumDesc: 'ಜಾಗರೂಕರಾಗಿರಿ.', highDesc: 'ಇದು ವಂಚನೆಯಾಗಿರಬಹುದು.', staySafe: 'ಜಾಗರೂಕತೆ', staySafeBody: 'ಸರ್ಕಾರಿ ಅಧಿಕಾರಿ ಫೋನ್‌ನಲ್ಲಿ OTP ಕೇಳುವುದಿಲ್ಲ.', checkAnother: 'ಮತ್ತೊಂದು ಸಂದೇಶ', sms: 'SMS', call: 'ಕರೆ', whatsapp: 'ವಾಟ್ಸಾಪ್' },
  'ml-IN': { analyzeTitle: 'സംശയ സന്ദേശം പരിശോധിക്കുക', pasteLabel: 'സന്ദേശം ഒട്ടിക്കുക', urlLabel: 'സംശയ ലിങ്ക് (ഓപ്ഷണൽ)', analyzeButton: 'തട്ടിപ്പ് പരിശോധന', examples: 'ഉദാഹരണങ്ങൾ', tryThis: 'ഇത് പരീക്ഷിക്കുക', stayProtected: 'സുരക്ഷിതരായിരിക്കുക', stayProtectedBody: 'ഔദ്യോഗിക പോർട്ടലിൽ പരിശോധിക്കുക. OTP നൽകരുത്.', riskAssessment: 'അപകട വിലയിരുത്തൽ', analyzedText: 'വിശകലനം ചെയ്ത വാചകം', riskIndicators: 'സൂചനകൾ', lowDesc: 'സുരക്ഷിതമായി തോന്നുന്നു.', mediumDesc: 'ജാഗ്രത പാലിക്കുക.', highDesc: 'ഇത് തട്ടിപ്പാകാം.', staySafe: 'ജാഗ്രത', staySafeBody: 'സർക്കാർ ഉദ്യോഗസ്ഥൻ ഫോണിൽ OTP ചോദിക്കില്ല.', checkAnother: 'മറ്റൊരു സന്ദേശം', sms: 'SMS', call: 'കോൾ', whatsapp: 'വാട്ട്‌സ്ആപ്പ്' },
  'pa-IN': { analyzeTitle: 'ਸ਼ੱਕੀ ਸੁਨੇਹਾ ਜਾਂਚੋ', pasteLabel: 'ਸੁਨੇਹਾ ਪੇਸਟ ਕਰੋ', urlLabel: 'ਸ਼ੱਕੀ ਲਿੰਕ (ਵਿਕਲਪਿਕ)', analyzeButton: 'ਧੋਖਾਧੜੀ ਜਾਂਚ', examples: 'ਉਦਾਹਰਨਾਂ', tryThis: 'ਇਹ ਅਜ਼ਮਾਓ', stayProtected: 'ਸੁਰੱਖਿਅਤ ਰਹੋ', stayProtectedBody: 'ਸਰਕਾਰੀ ਪੋਰਟਲ ਤੇ ਜਾਂਚੋ। OTP ਨਾ ਦਿਓ।', riskAssessment: 'ਖਤਰਾ ਮੁਲਾਂਕਣ', analyzedText: 'ਜਾਂਚਿਆ ਲਿਖਤ', riskIndicators: 'ਸੰਕੇਤ', lowDesc: 'ਸੁਰੱਖਿਅਤ ਲੱਗਦਾ ਹੈ।', mediumDesc: 'ਸਾਵਧਾਨ ਰਹੋ।', highDesc: 'ਇਹ ਧੋਖਾ ਹੋ ਸਕਦਾ ਹੈ।', staySafe: 'ਸਾਵਧਾਨ', staySafeBody: 'ਸਰਕਾਰੀ ਅਧਿਕਾਰੀ ਫ਼ੋਨ ਤੇ OTP ਨਹੀਂ ਮੰਗਦੇ।', checkAnother: 'ਹੋਰ ਸੁਨੇਹਾ', sms: 'SMS', call: 'ਕਾਲ', whatsapp: 'ਵਟਸਐਪ' },
  'od-IN': { analyzeTitle: 'ସନ୍ଦେହଜନକ ସନ୍ଦେଶ ଯାଞ୍ଚ', pasteLabel: 'ସନ୍ଦେଶ ପେଷ୍ଟ କରନ୍ତୁ', urlLabel: 'ସନ୍ଦେହଜନକ ଲିଙ୍କ୍ (ବୈକଳ୍ପିକ)', analyzeButton: 'ଠକାମି ଯାଞ୍ଚ', examples: 'ଉଦାହରଣ', tryThis: 'ଏହା ଚେଷ୍ଟା କରନ୍ତୁ', stayProtected: 'ସୁରକ୍ଷିତ ରୁହନ୍ତୁ', stayProtectedBody: 'ସରକାରୀ ପୋର୍ଟାଲରେ ଯାଞ୍ଚ କରନ୍ତୁ। OTP ଦିଅନ୍ତୁ ନାହିଁ।', riskAssessment: 'ବିପଦ ମୂଲ୍ୟାଙ୍କନ', analyzedText: 'ଯାଞ୍ଚିତ ପାଠ', riskIndicators: 'ସୂଚନା', lowDesc: 'ସୁରକ୍ଷିତ ଲାଗୁଛି।', mediumDesc: 'ସତର୍କ ରୁହନ୍ତୁ।', highDesc: 'ଏହା ଠକାମି ହୋଇପାରେ।', staySafe: 'ସତର୍କ', staySafeBody: 'ସରକାରୀ ଅଧିକାରୀ ଫୋନରେ OTP ମାଗନ୍ତି ନାହିଁ।', checkAnother: 'ଅନ୍ୟ ସନ୍ଦେଶ', sms: 'SMS', call: 'କଲ୍', whatsapp: 'ହ୍ୱାଟସଆପ୍' },
};

const regionalDashboard = {
  'bn-IN': {
    foundIntro: 'আপনি {role}। ভারতে আপনার জন্য {count}টি প্রকল্প পাওয়া গেছে।',
    foundIntroGeneric: 'ভারতে আপনার জন্য {count}টি প্রকল্প পাওয়া গেছে।',
    foundIntroHint: 'নিচে যোগ্যতা যাচাই করতে পারেন এবং পুরো বিবরণ পড়তে পারেন।',
    roleFarmer: 'কৃষক',
    roleStudent: 'শিক্ষার্থী',
  },
  'ta-IN': {
    foundIntro: 'நீங்கள் {role}. இந்தியாவில் உங்களுக்காக {count} திட்டங்கள் கிடைத்தன.',
    foundIntroGeneric: 'இந்தியாவில் உங்களுக்காக {count} திட்டங்கள் கிடைத்தன.',
    foundIntroHint: 'கீழே தகுதியைச் சோதித்து முழு விவரங்களையும் படிக்கலாம்.',
    roleFarmer: 'விவசாயி',
    roleStudent: 'மாணவர்',
  },
  'te-IN': {
    foundIntro: 'మీరు {role}. భారతదేశంలో మీ కోసం {count} పథకాలు దొరికాయి.',
    foundIntroGeneric: 'భారతదేశంలో మీ కోసం {count} పథకాలు దొరికాయి.',
    foundIntroHint: 'కింద అర్హతను తనిఖీ చేసి పూర్తి వివరాలు చదవవచ్చు.',
    roleFarmer: 'రైతు',
    roleStudent: 'విద్యార్థి',
  },
  'mr-IN': {
    foundIntro: 'तुम्ही {role} आहात. भारतात तुमच्यासाठी {count} योजना सापडल्या.',
    foundIntroGeneric: 'भारतात तुमच्यासाठी {count} योजना सापडल्या.',
    foundIntroHint: 'खाली पात्रता तपासू शकता आणि पूर्ण तपशील वाचू शकता.',
    roleFarmer: 'शेतकरी',
    roleStudent: 'विद्यार्थी',
  },
  'gu-IN': {
    foundIntro: 'તમે {role} છો. ભારતમાં તમારા માટે {count} યોજનાઓ મળી.',
    foundIntroGeneric: 'ભારતમાં તમારા માટે {count} યોજનાઓ મળી.',
    foundIntroHint: 'નીચે પાત્રતા તપાસી શકો અને સંપૂર્ણ વિગતો વાંચી શકો.',
    roleFarmer: 'ખેડૂત',
    roleStudent: 'વિદ્યાર્થી',
  },
  'kn-IN': {
    foundIntro: 'ನೀವು {role}. ಭಾರತದಲ್ಲಿ ನಿಮಗಾಗಿ {count} ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ.',
    foundIntroGeneric: 'ಭಾರತದಲ್ಲಿ ನಿಮಗಾಗಿ {count} ಯೋಜನೆಗಳು ಸಿಕ್ಕಿವೆ.',
    foundIntroHint: 'ಕೆಳಗೆ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪೂರ್ಣ ವಿವರಗಳನ್ನು ಓದಬಹುದು.',
    roleFarmer: 'ರೈತ',
    roleStudent: 'ವಿದ್ಯಾರ್ಥಿ',
  },
  'ml-IN': {
    foundIntro: 'നിങ്ങൾ {role} ആണ്. ഇന്ത്യയിൽ നിങ്ങൾക്കായി {count} പദ്ധതികൾ കണ്ടെത്തി.',
    foundIntroGeneric: 'ഇന്ത്യയിൽ നിങ്ങൾക്കായി {count} പദ്ധതികൾ കണ്ടെത്തി.',
    foundIntroHint: 'താഴെ യോഗ്യത പരിശോധിക്കാം, പൂർണ്ണ വിവരങ്ങളും വായിക്കാം.',
    roleFarmer: 'കർഷകൻ',
    roleStudent: 'വിദ്യാർത്ഥി',
  },
  'pa-IN': {
    foundIntro: 'ਤੁਸੀਂ {role} ਹੋ। ਭਾਰਤ ਵਿੱਚ ਤੁਹਾਡੇ ਲਈ {count} ਯੋਜਨਾਵਾਂ ਮਿਲੀਆਂ।',
    foundIntroGeneric: 'ਭਾਰਤ ਵਿੱਚ ਤੁਹਾਡੇ ਲਈ {count} ਯੋਜਨਾਵਾਂ ਮਿਲੀਆਂ।',
    foundIntroHint: 'ਹੇਠਾਂ ਯੋਗਤਾ ਜਾਂਚ ਸਕਦੇ ਹੋ ਅਤੇ ਪੂਰਾ ਵਿਵਰਣ ਪੜ੍ਹ ਸਕਦੇ ਹੋ।',
    roleFarmer: 'ਕਿਸਾਨ',
    roleStudent: 'ਵਿਦਿਆਰਥੀ',
  },
  'od-IN': {
    foundIntro: 'ଆପଣ {role}। ଭାରତରେ ଆପଣଙ୍କ ପାଇଁ {count} ଯୋଜନା ମିଳିଛି।',
    foundIntroGeneric: 'ଭାରତରେ ଆପଣଙ୍କ ପାଇଁ {count} ଯୋଜନା ମିଳିଛି।',
    foundIntroHint: 'ତଳେ ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରିପାରିବେ ଏବଂ ସମ୍ପୂର୍ଣ୍ଣ ବିବରଣୀ ପଢ଼ିପାରିବେ।',
    roleFarmer: 'କୃଷକ',
    roleStudent: 'ଛାତ୍ର',
  },
};

Object.keys(regionalScam).forEach((code) => {
  extraUi[code] = {
    onboarding: extraUi['en-IN'].onboarding,
    schemeFinder: extraUi['en-IN'].schemeFinder,
    dashboard: { ...extraUi['en-IN'].dashboard, ...(regionalDashboard[code] || {}) },
    eligibility: { ...eligibilityExtras('en'), ...extraUi['en-IN'].eligibility },
    scamCheck: regionalScam[code],
    docsChecklist: docsChecklistEn,
    docNames: docsEn,
    docHowTo: howToEn,
    states: statesEn,
  };
});

// Overlay regional eligibility/docs checklist in native language where we have it
extraUi['bn-IN'].eligibility = { ...eligibilityExtras('en'), whyNotTitle: 'কেন যোগ্য নন', whyYesTitle: 'কেন যোগ্য', allIndia: 'সারা ভারত', reasonStateFail: 'এই প্রকল্প {places} এর জন্য। আপনি {state} থেকে, তাই যোগ্য নন।', reasonFarmerFail: 'এই প্রকল্প কৃষকদের জন্য। আপনার পেশা {occupation}।', reasonStudentFail: 'এই প্রকল্প শিক্ষার্থীদের জন্য। আপনার পেশা {occupation}।', reasonAgeLow: 'আপনার বয়স {age}, ন্যূনতম বয়স {min}।', reasonAgeHigh: 'আপনার বয়স {age}, সর্বোচ্চ বয়স {max}।' };
extraUi['ta-IN'].eligibility = { ...eligibilityExtras('en'), whyNotTitle: 'ஏன் தகுதி இல்லை', whyYesTitle: 'ஏன் தகுதி', allIndia: 'அகில இந்தியா', reasonStateFail: 'இத்திட்டம் {places} க்கானது. நீங்கள் {state} என்பதால் தகுதியில்லை.', reasonFarmerFail: 'இது விவசாயிகளுக்கான திட்டம். உங்கள் தொழில் {occupation}.', reasonStudentFail: 'இது மாணவர்களுக்கான திட்டம். உங்கள் தொழில் {occupation}.', reasonAgeLow: 'உங்கள் வயது {age}. குறைந்தபட்சம் {min} வேண்டும்.', reasonAgeHigh: 'உங்கள் வயது {age}. அதிகபட்சம் {max} மட்டுமே.' };
extraUi['te-IN'].eligibility = { ...eligibilityExtras('en'), whyNotTitle: 'ఎందుకు అర్హత లేదు', whyYesTitle: 'ఎందుకు అర్హులు', allIndia: 'ఆల్ ఇండియా', reasonStateFail: 'ఈ పథకం {places} కోసం. మీరు {state} కాబట్టి అర్హులు కారు.', reasonFarmerFail: 'ఇది రైతుల పథకం. మీ వృత్తి {occupation}.', reasonStudentFail: 'ఇది విద్యార్థుల పథకం. మీ వృత్తి {occupation}.', reasonAgeLow: 'మీ వయసు {age}. కనీసం {min} కావాలి.', reasonAgeHigh: 'మీ వయసు {age}. గరిష్టం {max}.' };
extraUi['mr-IN'].eligibility = { ...eligibilityExtras('en'), whyNotTitle: 'पात्र का नाही', whyYesTitle: 'पात्र का', allIndia: 'संपूर्ण भारत', reasonStateFail: 'ही योजना {places} साठी आहे. तुम्ही {state} मधून आहात.', reasonFarmerFail: 'ही शेतकऱ्यांसाठी आहे. तुमचा व्यवसाय {occupation}.', reasonStudentFail: 'ही विद्यार्थ्यांसाठी आहे. तुमचा व्यवसाय {occupation}.', reasonAgeLow: 'तुमचे वय {age} आहे, किमान {min} हवे.', reasonAgeHigh: 'तुमचे वय {age} आहे, कमाल {max}.' };
extraUi['gu-IN'].eligibility = { ...eligibilityExtras('en'), whyNotTitle: 'શા માટે પાત્ર નથી', whyYesTitle: 'શા માટે પાત્ર', allIndia: 'આખું ભારત', reasonStateFail: 'આ યોજના {places} માટે છે. તમે {state} ના છો.', reasonFarmerFail: 'આ ખેડૂતો માટે છે. તમારો વ્યવસાય {occupation}.', reasonStudentFail: 'આ વિદ્યાર્થીઓ માટે છે. તમારો વ્યવસાય {occupation}.', reasonAgeLow: 'તમારી ઉંમર {age} છે, ઓછામાં ઓછી {min} જોઈએ.', reasonAgeHigh: 'તમારી ઉંમર {age} છે, વધુમાં વધુ {max}.' };
extraUi['kn-IN'].eligibility = { ...eligibilityExtras('en'), whyNotTitle: 'ಯಾಕೆ ಅರ್ಹರಲ್ಲ', whyYesTitle: 'ಯಾಕೆ ಅರ್ಹ', allIndia: 'ಇಡೀ ಭಾರತ', reasonStateFail: 'ಈ ಯೋಜನೆ {places} ಗಾಗಿ. ನೀವು {state} ನವರು.', reasonFarmerFail: 'ಇದು ರೈತರಿಗಾಗಿ. ನಿಮ್ಮ ಉದ್ಯೋಗ {occupation}.', reasonStudentFail: 'ಇದು ವಿದ್ಯಾರ್ಥಿಗಳಿಗಾಗಿ. ನಿಮ್ಮ ಉದ್ಯೋಗ {occupation}.', reasonAgeLow: 'ನಿಮ್ಮ ವಯಸ್ಸು {age}, ಕನಿಷ್ಠ {min} ಬೇಕು.', reasonAgeHigh: 'ನಿಮ್ಮ ವಯಸ್ಸು {age}, ಗರಿಷ್ಠ {max}.' };
extraUi['ml-IN'].eligibility = { ...eligibilityExtras('en'), whyNotTitle: 'എന്തുകൊണ്ട് അർഹതയില്ല', whyYesTitle: 'എന്തുകൊണ്ട് അർഹത', allIndia: 'അഖിലേന്ത്യ', reasonStateFail: 'ഈ പദ്ധതി {places} ക്കുള്ളതാണ്. നിങ്ങൾ {state} ൽ നിന്നാണ്.', reasonFarmerFail: 'കർഷകർക്കുള്ളതാണ്. നിങ്ങളുടെ തൊഴിൽ {occupation}.', reasonStudentFail: 'വിദ്യാർത്ഥികൾക്കുള്ളതാണ്. നിങ്ങളുടെ തൊഴിൽ {occupation}.', reasonAgeLow: 'നിങ്ങളുടെ പ്രായം {age}. കുറഞ്ഞത് {min} വേണം.', reasonAgeHigh: 'നിങ്ങളുടെ പ്രായം {age}. പരമാവധി {max}.' };
extraUi['pa-IN'].eligibility = { ...eligibilityExtras('en'), whyNotTitle: 'ਯੋਗ ਕਿਉਂ ਨਹੀਂ', whyYesTitle: 'ਯੋਗ ਕਿਉਂ', allIndia: 'ਸਾਰਾ ਭਾਰਤ', reasonStateFail: 'ਇਹ ਯੋਜਨਾ {places} ਲਈ ਹੈ। ਤੁਸੀਂ {state} ਤੋਂ ਹੋ।', reasonFarmerFail: 'ਇਹ ਕਿਸਾਨਾਂ ਲਈ ਹੈ। ਤੁਹਾਡਾ ਕਿੱਤਾ {occupation} ਹੈ।', reasonStudentFail: 'ਇਹ ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਹੈ। ਤੁਹਾਡਾ ਕਿੱਤਾ {occupation} ਹੈ।', reasonAgeLow: 'ਤੁਹਾਡੀ ਉਮਰ {age} ਹੈ, ਘੱਟੋ-ਘੱਟ {min} ਚਾਹੀਦੀ ਹੈ।', reasonAgeHigh: 'ਤੁਹਾਡੀ ਉਮਰ {age} ਹੈ, ਵੱਧ ਤੋਂ ਵੱਧ {max}।' };
extraUi['od-IN'].eligibility = { ...eligibilityExtras('en'), whyNotTitle: 'କାହିଁକି ଯୋଗ୍ୟ ନୁହଁ', whyYesTitle: 'କାହିଁକି ଯୋଗ୍ୟ', allIndia: 'ସମଗ୍ର ଭାରତ', reasonStateFail: 'ଏହି ଯୋଜନା {places} ପାଇଁ। ଆପଣ {state}ରୁ।', reasonFarmerFail: 'ଏହା କୃଷକଙ୍କ ପାଇଁ। ଆପଣଙ୍କ ବୃତ୍ତି {occupation}।', reasonStudentFail: 'ଏହା ଛାତ୍ରଙ୍କ ପାଇଁ। ଆପଣଙ୍କ ବୃତ୍ତି {occupation}।', reasonAgeLow: 'ଆପଣଙ୍କ ବୟସ {age}, ସର୍ବନିମ୍ନ {min} ଦରକାର।', reasonAgeHigh: 'ଆପଣଙ୍କ ବୟସ {age}, ସର୍ବାଧିକ {max}।' };

extraUi['bn-IN'].docsChecklist = { status: 'নথির তালিকা', ofUploaded: '{total} এর মধ্যে {have} আপনার কাছে', haveIt: 'আমার আছে', missing: 'নেই', howToGet: 'যা নেই তা কীভাবে পাবেন', markHave: 'যা আছে তাতে টিক দিন', selectScheme: 'আগে একটি প্রকল্প বেছে নিন' };
extraUi['ta-IN'].docsChecklist = { status: 'ஆவண பட்டியல்', ofUploaded: '{total} இல் {have} உங்களிடம் உள்ளது', haveIt: 'என்னிடம் உள்ளது', missing: 'இல்லை', howToGet: 'இல்லாத ஆவணத்தை எப்படி பெறுவது', markHave: 'உங்களிடம் உள்ளதை தேர்வு செய்யுங்கள்', selectScheme: 'முதலில் திட்டத்தை தேர்வு செய்யுங்கள்' };
extraUi['te-IN'].docsChecklist = { status: 'పత్రాల జాబితా', ofUploaded: '{total}లో {have} మీ వద్ద ఉన్నాయి', haveIt: 'నా వద్ద ఉంది', missing: 'లేదు', howToGet: 'లేని పత్రాలు ఎలా పొందాలి', markHave: 'ఉన్నవాటిని టిక్ చేయండి', selectScheme: 'ముందు పథకం ఎంచుకోండి' };
extraUi['mr-IN'].docsChecklist = { status: 'कागदपत्र यादी', ofUploaded: '{total} पैकी {have} तुमच्याकडे', haveIt: 'माझ्याकडे आहे', missing: 'नाही', howToGet: 'नसलेली कागदपत्रे कशी काढावीत', markHave: 'जे आहे ते टिक करा', selectScheme: 'आधी योजना निवडा' };
extraUi['gu-IN'].docsChecklist = { status: 'દસ્તાવેજ યાદી', ofUploaded: '{total}માંથી {have} તમારી પાસે', haveIt: 'મારી પાસે છે', missing: 'નથી', howToGet: 'ન હોય તે કેવી રીતે મેળવવું', markHave: 'જે હોય તે ટિક કરો', selectScheme: 'પહેલા યોજના પસંદ કરો' };
extraUi['kn-IN'].docsChecklist = { status: 'ದಾಖಲೆ ಪಟ್ಟಿ', ofUploaded: '{total}ರಲ್ಲಿ {have} ನಿಮ್ಮ ಬಳಿ', haveIt: 'ನನ್ನ ಬಳಿ ಇದೆ', missing: 'ಇಲ್ಲ', howToGet: 'ಇಲ್ಲದ ದಾಖಲೆ ಹೇಗೆ ಪಡೆಯುವುದು', markHave: 'ಇರುವುದನ್ನು ಟಿಕ್ ಮಾಡಿ', selectScheme: 'ಮೊದಲು ಯೋಜನೆ ಆಯ್ಕೆಮಾಡಿ' };
extraUi['ml-IN'].docsChecklist = { status: 'രേഖകളുടെ പട്ടിക', ofUploaded: '{total}-ൽ {have} നിങ്ങളുടെ പക്കലുണ്ട്', haveIt: 'എന്റെ പക്കലുണ്ട്', missing: 'ഇല്ല', howToGet: 'ഇല്ലാത്ത രേഖ എങ്ങനെ നേടാം', markHave: 'ഉള്ളത് ടിക് ചെയ്യുക', selectScheme: 'ആദ്യം പദ്ധതി തിരഞ്ഞെടുക്കുക' };
extraUi['pa-IN'].docsChecklist = { status: 'ਦਸਤਾਵੇਜ਼ ਸੂਚੀ', ofUploaded: '{total} ਵਿੱਚੋਂ {have} ਤੁਹਾਡੇ ਕੋਲ', haveIt: 'ਮੇਰੇ ਕੋਲ ਹੈ', missing: 'ਨਹੀਂ ਹੈ', howToGet: 'ਗੈਰਹਾਜ਼ਰ ਦਸਤਾਵੇਜ਼ ਕਿਵੇਂ ਬਣਵਾਈਏ', markHave: 'ਜੋ ਹੈ ਉਸ ਤੇ ਟਿਕ ਕਰੋ', selectScheme: 'ਪਹਿਲਾਂ ਯੋਜਨਾ ਚੁਣੋ' };
extraUi['od-IN'].docsChecklist = { status: 'ଦଲିଲ ତାଲିକା', ofUploaded: '{total} ରୁ {have} ଆପଣଙ୍କ ପାଖରେ', haveIt: 'ମୋ ପାଖରେ ଅଛି', missing: 'ନାହିଁ', howToGet: 'ନଥିବା ଦଲିଲ କିପରି ପାଇବେ', markHave: 'ଥିବା ଦଲିଲ ଟିକ୍ କରନ୍ତୁ', selectScheme: 'ପ୍ରଥମେ ଯୋଜନା ବାଛନ୍ତୁ' };

extraUi['ta-IN'].onboarding = { stepStateTitle: 'நீங்கள் எந்த மாநிலத்தில் வாழ்கிறீர்கள்?', stepStateSubtitle: 'மாநில திட்டங்களை காட்ட' };
extraUi['bn-IN'].onboarding = { stepStateTitle: 'আপনি কোন রাজ্যে থাকেন?', stepStateSubtitle: 'রাজ্যের প্রকল্প দেখাতে' };
extraUi['te-IN'].onboarding = { stepStateTitle: 'మీరు ఏ రాష్ట్రంలో ఉంటారు?', stepStateSubtitle: 'రాష్ట్ర పథకాలు చూపడానికి' };
extraUi['mr-IN'].onboarding = { stepStateTitle: 'तुम्ही कोणत्या राज्यात राहता?', stepStateSubtitle: 'राज्य योजना दाखवण्यासाठी' };
extraUi['gu-IN'].onboarding = { stepStateTitle: 'તમે કયા રાજ્યમાં રહો છો?', stepStateSubtitle: 'રાજ્ય યોજનાઓ બતાવવા' };
extraUi['kn-IN'].onboarding = { stepStateTitle: 'ನೀವು ಯಾವ ರಾಜ್ಯದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?', stepStateSubtitle: 'ರಾಜ್ಯ ಯೋಜನೆಗಳನ್ನು ತೋರಿಸಲು' };
extraUi['ml-IN'].onboarding = { stepStateTitle: 'നിങ്ങൾ ഏത് സംസ്ഥാനത്താണ് താമസിക്കുന്നത്?', stepStateSubtitle: 'സംസ്ഥാന പദ്ധതികൾ കാണിക്കാൻ' };
extraUi['pa-IN'].onboarding = { stepStateTitle: 'ਤੁਸੀਂ ਕਿਹੜੇ ਰਾਜ ਵਿੱਚ ਰਹਿੰਦੇ ਹੋ?', stepStateSubtitle: 'ਰਾਜ ਯੋਜਨਾਵਾਂ ਵਿਖਾਉਣ ਲਈ' };
extraUi['od-IN'].onboarding = { stepStateTitle: 'ଆପଣ କେଉଁ ରାଜ୍ୟରେ ରହନ୍ତି?', stepStateSubtitle: 'ରାଜ୍ୟ ଯୋଜନା ଦେଖାଇବାକୁ' };

extraUi['ta-IN'].docNames = {
  aadhaar: 'ஆதார் அட்டை', pan: 'பான் அட்டை', 'income-cert': 'வருமான சான்றிதழ்', domicile: 'வசிப்பிட சான்றிதழ்',
  'bank-account': 'வங்கி பாஸ்புக்', 'college-id': 'மாணவர் அடையாள அட்டை', marksheet: 'மதிப்பெண் பட்டியல்',
  'ration-card': 'ரேஷன் கார்டு', 'land-docs': 'நில ஆவணங்கள்', 'birth-cert': 'பிறப்பு சான்றிதழ்',
  'caste-cert': 'சாதி சான்றிதழ்', 'disability-cert': 'மாற்றுத்திறன் சான்றிதழ்', 'mcp-card': 'MCP அட்டை',
  'farmer-id': 'உழவர் அட்டை', 'electricity-bill': 'மின்சார பில்', 'vendor-cert': 'வியாபாரி சான்றிதழ்',
  'mobile-number': 'பதிவு செய்த கைபேசி', 'shg-membership': 'SHG உறுப்பினர் சான்று', 'education-cert': 'கல்வி சான்றிதழ்',
};
extraUi['bn-IN'].docNames = {
  aadhaar: 'আধার কার্ড', pan: 'প্যান কার্ড', 'income-cert': 'আয়ের সনদ', domicile: 'বাসস্থানের সনদ',
  'bank-account': 'ব্যাংক পাসবুক', 'college-id': 'ছাত্র পরিচয়পত্র', marksheet: 'মার্কশিট',
  'ration-card': 'রেশন কার্ড', 'land-docs': 'জমির কাগজ', 'birth-cert': 'জন্ম সনদ',
  'caste-cert': 'জাতি সনদ', 'disability-cert': 'প্রতিবন্ধী সনদ', 'mcp-card': 'MCP কার্ড',
  'farmer-id': 'কৃষক কার্ড', 'electricity-bill': 'বিদ্যুৎ বিল', 'vendor-cert': 'ভেন্ডর সনদ',
  'mobile-number': 'নিবন্ধিত মোবাইল', 'shg-membership': 'SHG সদস্যপদ', 'education-cert': 'শিক্ষার সনদ',
};
extraUi['te-IN'].docNames = {
  aadhaar: 'ఆధార్ కార్డు', pan: 'పాన్ కార్డు', 'income-cert': 'ఆదాయ ధృవీకరణ', domicile: 'నివాస ధృవీకరణ',
  'bank-account': 'బ్యాంక్ పాస్‌బుక్', 'college-id': 'విద్యార్థి ఐడి', marksheet: 'మార్కుల జాబితా',
  'ration-card': 'రేషన్ కార్డు', 'land-docs': 'భూమి పత్రాలు', 'birth-cert': 'పుట్టిన సర్టిఫికెట్',
  'caste-cert': 'కుల ధృవీకరణ', 'disability-cert': 'వికలాంగ ధృవీకరణ', 'farmer-id': 'రైతు కార్డు',
  'electricity-bill': 'కరెంట్ బిల్లు', 'mobile-number': 'రిజిస్టర్డ్ మొబైల్', 'education-cert': 'విద్యా సర్టిఫికెట్',
  'vendor-cert': 'విక్రేత సర్టిఫికెట్', 'shg-membership': 'SHG సభ్యత్వం', 'mcp-card': 'MCP కార్డు',
};
extraUi['mr-IN'].docNames = {
  aadhaar: 'आधार कार्ड', pan: 'पॅन कार्ड', 'income-cert': 'उत्पन्न प्रमाणपत्र', domicile: 'अधिवास प्रमाणपत्र',
  'bank-account': 'बँक पासबुक', 'college-id': 'विद्यार्थी ओळखपत्र', marksheet: 'गुणपत्रिका',
  'ration-card': 'शिधापत्रिका', 'land-docs': 'जमीन कागदपत्रे', 'birth-cert': 'जन्म प्रमाणपत्र',
  'caste-cert': 'जाती प्रमाणपत्र', 'disability-cert': 'दिव्यांग प्रमाणपत्र', 'farmer-id': 'शेतकरी कार्ड',
  'electricity-bill': 'वीज बिल', 'mobile-number': 'नोंदणीकृत मोबाइल', 'education-cert': 'शिक्षण प्रमाणपत्र',
  'vendor-cert': 'विक्रेता प्रमाणपत्र', 'shg-membership': 'SHG सदस्यत्व', 'mcp-card': 'MCP कार्ड',
};

export function deepMerge(target, source) {
  const out = { ...(target || {}) };
  Object.keys(source || {}).forEach((key) => {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      out[key] = deepMerge(out[key], val);
    } else {
      out[key] = val;
    }
  });
  return out;
}
