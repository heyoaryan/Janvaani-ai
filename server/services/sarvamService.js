import axios from 'axios';

const SARVAM_BASE = 'https://api.sarvam.ai';
const API_KEY = process.env.SARVAM_API_KEY || '';

let _client = null;
if (API_KEY && API_KEY !== 'your_sarvam_api_key_here') {
  _client = axios.create({
    baseURL: SARVAM_BASE,
    headers: {
      'api-subscription-key': API_KEY,
    },
  });
}

const SARVAM_ENABLED = !!_client;

const FALLBACK_STT_RESPONSES = [
  { audioHint: 'education', text: 'मेरी बेटी कॉलेज जाती है, क्या उसके लिए कोई स्कॉलरशिप योजना है?', translation: 'My daughter goes to college, is there any scholarship scheme for her?' },
  { audioHint: 'farmer', text: 'मैं किसान हूं, मुझे सरकार से क्या मदद मिल सकती है?', translation: 'I am a farmer, what help can I get from the government?' },
  { audioHint: 'house', text: 'मेरे पास अपना घर नहीं है, क्या सरकार घर बनाने में मदद करती है?', translation: 'I do not have my own house, does the government help build one?' },
  { audioHint: 'pregnant', text: 'मेरी पत्नी गर्भवती है, क्या कोई योजना है?', translation: 'My wife is pregnant, is there any scheme?' },
  { audioHint: 'job', text: 'मुझे नौकरी नहीं मिल रही, क्या कोई ट्रेनिंग योजना है?', translation: 'I am not getting a job, is there any training scheme?' },
  { audioHint: 'old', text: 'मेरे बूढ़े पिता जी की उम्र 65 है, क्या पेंशन मिलती है?', translation: 'My old father is 65, does he get a pension?' },
];

const FALLBACK_TTS_RESPONSE = {
  success: true,
  language: 'hi-IN',
  audioUrl: null,
  provider: 'mock',
  note: 'No SARVAM_API_KEY set. Using mock TTS. Set SARVAM_API_KEY in .env for real TTS.',
};

const FALLBACK_CHAT_RESPONSE =
  'नमस्ते! मैं JanVaani हूं, आपकी सरकारी योजना सहायक। आप शिक्षा, स्वास्थ्य, किसान, घर, या रोजगार के बारे में पूछ सकते हैं। मैं आपको सही योजना ढूंढकर बताऊंगी।';

async function sarvamSTT({ audioFile, languageCode = 'hi-IN', model = 'saaras:v3', mode = 'transcribe' }) {
  if (!SARVAM_ENABLED) {
    const match = FALLBACK_STT_RESPONSES[0];
    return {
      request_id: `mock-${Date.now()}`,
      transcript: match.text,
      language_code: languageCode,
      provider: 'mock',
      note: 'No SARVAM_API_KEY set. Using mock STT. Set SARVAM_API_KEY in .env for real transcription.',
    };
  }

  const form = new FormData();
  form.append('file', audioFile);
  form.append('model', model);
  form.append('mode', mode);
  if (languageCode) form.append('language_code', languageCode);

  const res = await _client.post('/speech-to-text', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

async function sarvamTTS({ text, languageCode = 'hi-IN', speaker = 'shubh', model = 'bulbul:v3', pace = 1.0, speechSampleRate = 24000 }) {
  if (!SARVAM_ENABLED) {
    return { ...FALLBACK_TTS_RESPONSE, text, provider: 'mock' };
  }

  const body = {
    text,
    language_code: languageCode,
    speaker,
    model,
    pace,
    speech_sample_rate: speechSampleRate,
  };

  const res = await _client.post('/text-to-speech', body);
  return res.data;
}

async function sarvamChat({ messages, model = 'sarvam-105b', temperature = 0.5, maxTokens = 2048, stream = false }) {
  if (!SARVAM_ENABLED) {
    return {
      id: `mock-${Date.now()}`,
      object: 'chat.completion',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: FALLBACK_CHAT_RESPONSE },
          finish_reason: 'stop',
        },
      ],
      provider: 'mock',
      note: 'No SARVAM_API_KEY set. Using mock chat. Set SARVAM_API_KEY in .env for real AI responses.',
    };
  }

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream,
  };

  const res = await _client.post('/v1/chat/completions', body);
  return res.data;
}

export { sarvamSTT, sarvamTTS, sarvamChat, SARVAM_ENABLED };
export default { sarvamSTT, sarvamTTS, sarvamChat, SARVAM_ENABLED };
