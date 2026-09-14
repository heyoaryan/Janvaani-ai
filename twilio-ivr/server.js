require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const {
  resolveLanguageChoice,
  resolveSelectionChoice,
  getApplicationStatusText,
} = require("./ivr-flow");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

const RESPONSES_FILE = path.join(__dirname, "responses.json");
const callState = new Map();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

function loadResponses() {
  if (!fs.existsSync(RESPONSES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(RESPONSES_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveResponse(entry) {
  const all = loadResponses();
  all.push(entry);
  fs.writeFileSync(RESPONSES_FILE, JSON.stringify(all, null, 2), "utf8");
  console.log("✅ Response saved:", entry);
}

function getState(callSid) {
  const existing = callState.get(callSid) || {};
  callState.set(callSid, existing);
  return existing;
}

function setState(callSid, patch) {
  const current = getState(callSid);
  const next = { ...current, ...patch };
  callState.set(callSid, next);
  return next;
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const LANGUAGE_PROMPTS = {
  "hi-IN": {
    greeting: "नमस्ते! मैं JanVaani टोल फ्री सहायक हूँ।",
    menu: "अपनी भाषा चुनें. 1 के लिए हिन्दी, 2 के लिए English, 3 के लिए ਪੰਜਾਬੀ।",
  },
  "en-IN": {
    greeting: "Hello! I am JanVaani voice assistant.",
    menu: "Please select your language. Press 1 for Hindi, 2 for English, 3 for Punjabi.",
  },
  "pa-IN": {
    greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ JanVaani ਆਵਾਜ਼ ਸਹਾਇਕ ਹਾਂ।",
    menu: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ। 1 ਲਈ हिन्दी, 2 ਲਈ English, 3 ਲਈ ਪੰਜਾਬੀ।",
  },
};

const MAIN_MENU_TEXT = {
  "hi-IN": "1 के लिए योजना की जानकारी, 2 के लिए application track, 3 के लिए executor से बात, 4 के लिए additional help।",
  "en-IN": "Press 1 for scheme information, 2 to track your application, 3 to talk to an executor, 4 for further help.",
  "pa-IN": "1 ਲਈ ਯੋਜਨਾ ਦੀ ਜਾਣਕਾਰੀ, 2 ਲਈ application track, 3 ਲਈ executor ਨਾਲ ਗੱਲ, 4 ਲਈ ਹੋਰ ਮਦਦ।",
};

function getLanguageVoice(language) {
  const voices = {
    "hi-IN": "Polly.Aditi",
    "en-IN": "Polly.Joanna",
    "pa-IN": "Polly.Aditi",
  };
  return voices[language] || "Polly.Aditi";
}

function buildSay(language, text) {
  return `<Say language="${language}" voice="${getLanguageVoice(language)}">${escapeXml(text)}</Say>`;
}

function getBaseUrl(req) {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000').split(',')[0].trim();
  return `${proto}://${host}`;
}

function buildGather(req, action, language, prompt, numDigits = 1, speech = false) {
  const baseUrl = getBaseUrl(req);
  const input = speech ? 'input="speech dtmf"' : `numDigits="${numDigits}"`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather ${input} action="${baseUrl}${action}" method="POST" timeout="8" speechTimeout="5">
    ${buildSay(language, prompt)}
  </Gather>
  <Say language="${language}" voice="${getLanguageVoice(language)}">${escapeXml(language === 'hi-IN' ? 'कृपया फिर से प्रयास करें।' : language === 'pa-IN' ? 'ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।' : 'Please try again.')}</Say>
</Response>`;
}

function isPublicWebhookConfigured() {
  const url = (process.env.WEBHOOK_BASE_URL || '').trim();
  return !!url && /^https:\/\//i.test(url) && !/(localhost|127\.0\.0\.1|ngrok)/i.test(url);
}

function readSpeechInput(req) {
  const body = req.body || {};
  return (body.SpeechResult || body.Transcript || body.Digits || '').trim();
}

async function callAiChat(input, language, sessionId) {
  const payload = {
    input,
    language,
    sessionId,
    userProfile: {
      source: 'twilio-ivr',
    },
  };

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/voice/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || 'AI service error');
    }
    return data.response || 'मैं आपकी मदद करने का प्रयास कर रहा हूँ।';
  } catch (error) {
    console.error('AI service chat failed:', error);
    if (language === 'en-IN') {
      return 'I can help with scheme information and application tracking. Please tell me your question in a sentence.';
    }
    if (language === 'pa-IN') {
      return 'ਮੈਂ ਯੋਜਨਾਵਾਂ ਅਤੇ ਅਰਜ਼ੀ ਟਰੈਕਿੰਗ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਵਾਲ ਦੱਸੋ।';
    }
    return 'मैं आपके लिए योजना और आवेदन ट्रैकिंग में मदद कर सकता हूँ। कृपया अपना सवाल बताइए।';
  }
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    publicWebhookConfigured: isPublicWebhookConfigured(),
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL || null,
    aiServiceUrl: AI_SERVICE_URL,
    port: PORT,
  });
});

app.post('/voice', (req, res) => {
  const callSid = req.body.CallSid || 'unknown';
  const state = getState(callSid);
  state.language = state.language || 'hi-IN';

  if (!isPublicWebhookConfigured()) {
    console.warn('⚠️ WEBHOOK_BASE_URL is not set to a public HTTPS URL. Twilio trial calls will fail.');
  }

  const baseUrl = getBaseUrl(req);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech dtmf" action="${baseUrl}/handle-language" method="POST" timeout="10" speechTimeout="7">
    ${buildSay('hi-IN', 'नमस्ते! मैं JanVaani सहायक हूँ। कृपया अपनी भाषा चुनें। 1 के लिए हिन्दी, 2 के लिए English, 3 के लिए ਪੰਜਾਬी।')}
  </Gather>
  <Say language="hi-IN" voice="Polly.Aditi">कोई विकल्प नहीं चुना गया। फिर से कोशिश करें।</Say>
</Response>`;

  res.type('text/xml').send(twiml);
});

app.post('/handle-language', (req, res) => {
  const callSid = req.body.CallSid || 'unknown';
  const digit = req.body.Digits || readSpeechInput(req) || '';
  const language = resolveLanguageChoice(digit) || 'hi-IN';
  setState(callSid, { language, selectedLanguage: language });

  const baseUrl = getBaseUrl(req);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech dtmf" action="${baseUrl}/handle-main-choice" method="POST" timeout="10" speechTimeout="7">
    ${buildSay(language, MAIN_MENU_TEXT[language] || MAIN_MENU_TEXT['hi-IN'])}
  </Gather>
  <Say language="${language}" voice="${getLanguageVoice(language)}">${escapeXml(language === 'hi-IN' ? 'कोई विकल्प नहीं चुना गया।' : language === 'pa-IN' ? 'ਕੋਈ ਵਿਕਲਪ ਨਹੀਂ ਚੁਣਿਆ ਗਿਆ।' : 'No option was selected.')}</Say>
</Response>`;

  res.type('text/xml').send(twiml);
});

app.post('/handle-main-choice', async (req, res) => {
  const callSid = req.body.CallSid || 'unknown';
  const digit = req.body.Digits || readSpeechInput(req) || '';
  const language = getState(callSid).language || 'hi-IN';
  const choice = resolveSelectionChoice(digit);

  setState(callSid, { mainChoice: choice });

  if (choice === 'scheme_info') {
    const prompt = language === 'en-IN'
      ? 'Please speak your scheme question in English or Hindi. We will answer in your selected language.'
      : language === 'pa-IN'
        ? 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਕੀਮ ਸਵਾਲ ਬੋਲੋ। ਅਸੀਂ ਤੁਹਾਨੂੰ ਤੁਹਾਡੀ ਚੁਣੀ ਹੋਈ ਭਾਸ਼ਾ ਵਿੱਚ ਜਵਾਬ ਦੇਵਾਂਗੇ।'
        : 'कृपया अपनी योजना से जुड़ा सवाल बोलिए। हम आपके चयनित भाषा में जवाब देंगे।';

    const twiml = buildGather(req, '/handle-scheme-query', language, prompt, 1, true);
    res.type('text/xml').send(twiml);
    return;
  }

  if (choice === 'application_track') {
    const prompt = language === 'en-IN'
      ? 'Please type or say your application number. We will tell you the application status.'
      : language === 'pa-IN'
        ? 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਅਰਜ਼ੀ ਨੰਬਰ ਦੱਸੋ ਜਾਂ ਟਾਈਪ ਕਰੋ। ਅਸੀਂ ਅਰਜ਼ੀ ਦੀ ਸਥਿਤੀ ਦੱਸਾਂਗੇ।'
        : 'कृपया अपना आवेदन नंबर बताइए या टाइप कीजिए। हम आवेदन की स्थिति बताएंगे।';

    const baseUrl = getBaseUrl(req);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="10" action="${baseUrl}/handle-application-status" method="POST" timeout="10">
    ${buildSay(language, prompt)}
  </Gather>
  <Say language="${language}" voice="${getLanguageVoice(language)}">${escapeXml(language === 'hi-IN' ? 'कोई आवेदन नंबर दर्ज नहीं किया गया।' : language === 'pa-IN' ? 'ਕੋਈ ਅਰਜ਼ੀ ਨੰਬਰ ਦਰਜ ਨਹੀਂ ਕੀਤਾ ਗਿਆ।' : 'No application number was entered.')}</Say>
</Response>`;
    res.type('text/xml').send(twiml);
    return;
  }

  if (choice === 'talk_to_executor') {
    const text = language === 'en-IN'
      ? 'Your executor will contact you soon. Our team will speak with you about the next steps.'
      : language === 'pa-IN'
        ? 'ਸਾਡਾ executor ਤੁਹਾਡੇ ਨਜ਼ਦਰ ਤੁਰੰਤ ਸੰਪਰਕ ਕਰੇਗਾ। ਅਗਲੇ ਕਦਮਾਂ ਬਾਰੇ ਗੱਲ ਹੋਵੇਗੀ।'
        : 'हमारे executor आपसे जल्द संपर्क करेंगे। अगले चरणों के बारे में वे आपसे बात करेंगे।';

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(language, text)}
</Response>`;
    res.type('text/xml').send(twiml);
    return;
  }

  if (choice === 'further_help') {
    const text = language === 'en-IN'
      ? 'We are here to help. You can ask about schemes, track applications, or speak with our executor.'
      : language === 'pa-IN'
        ? 'ਅਸੀਂ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਇੱਥੇ ਹਾਂ। ਤੁਸੀਂ ਯੋਜਨਾਵਾਂ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ, ਅਰਜ਼ੀਆਂ ਦੀ ਪਾਲਣਾ ਕਰ ਸਕਦੇ ਹੋ, ਜਾਂ executor ਨਾਲ ਗੱਲ ਕਰ ਸਕਦੇ ਹੋ।'
        : 'हम आपकी मदद के लिए यहाँ हैं। आप योजना के बारे में पूछ सकते हैं, आवेदन ट्रैक कर सकते हैं, या executor से बात कर सकते हैं।';

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(language, text)}
  <Redirect method="POST">/voice</Redirect>
</Response>`;
    res.type('text/xml').send(twiml);
    return;
  }

  const fallback = language === 'en-IN'
    ? 'I did not understand that option. Please press a valid key.'
    : language === 'pa-IN'
      ? 'ਮੈਨੂੰ ਇਹ ਵਿਕਲਪ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਵੈਧ ਕੁੰਜੀ ਦਬਾਓ।'
      : 'मैंने विकल्प समझा नहीं। कृपया सही नंबर दबाइए।';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(language, fallback)}
</Response>`;
  res.type('text/xml').send(twiml);
});

app.post('/handle-scheme-query', async (req, res) => {
  const callSid = req.body.CallSid || 'unknown';
  const language = getState(callSid).language || 'hi-IN';
  const userInput = readSpeechInput(req);

  if (!userInput) {
    const prompt = language === 'en-IN'
      ? 'I did not hear your question clearly. Please say your scheme question again.'
      : language === 'pa-IN'
        ? 'ਮੈਨੂੰ ਤੁਹਾਡਾ ਸਵਾਲ ਸਹੀ ਨਹੀਂ ਸੁਣਾਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਵਾਲ ਦੁਬਾਰਾ ਬੋਲੋ।'
        : 'मैंने सवाल ठीक से नहीं सुना। कृपया अपना सवाल फिर से बताइए।';

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(language, prompt)}
</Response>`;
    res.type('text/xml').send(twiml);
    return;
  }

  const answer = await callAiChat(userInput, language, `call-${callSid}`);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(language, answer)}
  <Redirect method="POST">/voice</Redirect>
</Response>`;

  saveResponse({
    timestamp: new Date().toISOString(),
    callSid,
    intent: 'scheme_info',
    language,
    userInput,
    assistantResponse: answer,
  });

  res.type('text/xml').send(twiml);
});

app.post('/handle-application-status', (req, res) => {
  const callSid = req.body.CallSid || 'unknown';
  const language = getState(callSid).language || 'hi-IN';
  const digits = (req.body.Digits || '').trim();
  const spokenValue = (req.body.SpeechResult || req.body.Transcript || '').trim();
  const applicationNumber = digits || spokenValue || '';
  const formatted = applicationNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const statusText = getApplicationStatusText(formatted || 'APP-1001', language);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(language, statusText)}
  <Redirect method="POST">/voice</Redirect>
</Response>`;

  saveResponse({
    timestamp: new Date().toISOString(),
    callSid,
    intent: 'application_track',
    language,
    applicationNumber: formatted || 'APP-1001',
    statusText,
  });

  res.type('text/xml').send(twiml);
});

app.post('/status', (req, res) => {
  const { CallSid, CallStatus, To, From, Duration } = req.body;
  console.log(`📊 Call status update — SID: ${CallSid}, Status: ${CallStatus}, Duration: ${Duration}s`);

  const all = loadResponses();
  const idx = all.findIndex((r) => r.callSid === CallSid);
  if (idx !== -1) {
    all[idx].finalStatus = CallStatus;
    all[idx].duration = Duration;
    fs.writeFileSync(RESPONSES_FILE, JSON.stringify(all, null, 2), "utf8");
  } else {
    saveResponse({
      timestamp: new Date().toISOString(),
      callSid: CallSid,
      caller: From,
      to: To,
      digit: null,
      intent: 'no_input',
      finalStatus: CallStatus,
      duration: Duration,
    });
  }

  res.sendStatus(200);
});

app.get('/responses', (req, res) => {
  res.json(loadResponses());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Twilio IVR server running on http://localhost:${PORT}`);
  console.log(`   AI service URL: ${AI_SERVICE_URL}`);
  console.log('   Endpoints: /voice, /handle-language, /handle-main-choice, /handle-scheme-query, /handle-application-status, /status');
});
