import express from 'express';
import sarvamService, { SARVAM_ENABLED } from '../services/sarvamService.js';
import { generateResponse } from '../services/aiService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const LANGUAGES = [
  { code: 'hi-IN', name: 'हिन्दी (Hindi)', ttsSupported: true },
  { code: 'en-IN', name: 'English (Indian)', ttsSupported: true },
  { code: 'bn-IN', name: 'বাংলা (Bengali)', ttsSupported: true },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)', ttsSupported: true },
  { code: 'te-IN', name: 'తెలుగు (Telugu)', ttsSupported: true },
  { code: 'mr-IN', name: 'मराठी (Marathi)', ttsSupported: true },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)', ttsSupported: true },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', ttsSupported: true },
  { code: 'ml-IN', name: 'മലയാളം (Malayalam)', ttsSupported: true },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)', ttsSupported: true },
  { code: 'od-IN', name: 'ଓଡ଼ିଆ (Odia)', ttsSupported: true },
];

const SPEAKER_MAP = {
  'hi-IN': 'shubh',
  'en-IN': 'shubh',
  'bn-IN': 'shubh',
  'ta-IN': 'shubh',
  'te-IN': 'shubh',
  'mr-IN': 'shubh',
  'gu-IN': 'shubh',
  'kn-IN': 'shubh',
  'ml-IN': 'shubh',
  'pa-IN': 'shubh',
  'od-IN': 'shubh',
};

router.get('/languages', asyncHandler(async (req, res) => {
  res.json({ success: true, count: LANGUAGES.length, data: LANGUAGES });
}));

router.post('/transcribe', asyncHandler(async (req, res) => {
  if (!req.is('multipart/form-data')) {
    const err = new Error('Expected multipart/form-data');
    err.statusCode = 400;
    throw err;
  }

  const { file } = req.files || {};
  const { language_code = 'hi-IN', model = 'saaras:v3', mode = 'transcribe' } = req.body || {};

  if (!file) {
    const err = new Error('Audio file is required');
    err.statusCode = 400;
    throw err;
  }

  const result = await sarvamService.sarvamSTT({
    audioFile: file,
    languageCode: language_code,
    model,
    mode,
  });

  res.json({
    success: true,
    language: language_code,
    transcription: result.transcript,
    translation: result.transcript,
    confidence: SARVAM_ENABLED ? 0.95 : 0.7,
    durationSeconds: null,
    provider: SARVAM_ENABLED ? 'sarvam-ai' : 'mock',
    ...(result.note && { note: result.note }),
  });
}));

router.post('/synthesize', asyncHandler(async (req, res) => {
  const { text, language = 'hi-IN' } = req.body || {};
  if (!text) {
    const err = new Error('Text is required for synthesis');
    err.statusCode = 400;
    throw err;
  }

  const speaker = SPEAKER_MAP[language] || 'shubh';

  const result = await sarvamService.sarvamTTS({
    text,
    languageCode: language,
    speaker,
    model: 'bulbul:v3',
  });

  const audioBase64 = (result.audios && result.audios[0]) || '';
  const audioUrl = audioBase64 ? `data:audio/wav;base64,${audioBase64}` : null;

  res.json({
    success: true,
    language,
    text,
    audioUrl,
    provider: SARVAM_ENABLED ? 'sarvam-ai' : 'mock',
    ...(result.note && { note: result.note }),
  });
}));

router.post('/process', asyncHandler(async (req, res) => {
  const { input, sessionId, language = 'hi-IN', userProfile = {} } = req.body || {};

  const sid = sessionId || `sess-${Date.now()}`;

  const messages = [];

  const userName = userProfile.name || 'user';
  const userOccupation = userProfile.occupation || '';
  const occupationHint = userOccupation ? ` The user is a ${userOccupation}.` : '';

  messages.push({
    role: 'system',
    content: `You are JanVaani AI, a friendly and helpful assistant for Indian government schemes and citizen services. You understand and respond in Indian languages (especially Hindi and Hinglish) and English.${occupationHint} Address the user by name (${userName}) occasionally to make the conversation personal. Keep responses concise, warm, and actionable. When the user asks about schemes, benefits, eligibility, or documents, provide clear guidance.`,
  });

  const historyKey = `voice_history_${sid}`;
  const history = (global.voiceHistories && global.voiceHistories[historyKey]) || [];
  for (const turn of history.slice(-10)) {
    messages.push({ role: turn.role, content: turn.content });
  }

  const userText = input || '';
  messages.push({ role: 'user', content: userText });

  const localAnalysis = generateResponse(userText, { userProfile, history });

  let assistantText = '';
  try {
    if (SARVAM_ENABLED) {
      const chatResult = await sarvamService.sarvamChat({
        messages,
        model: 'sarvam-105b',
        temperature: 0.5,
        maxTokens: 1024,
      });
      assistantText = chatResult.choices && chatResult.choices[0] && chatResult.choices[0].message
        ? chatResult.choices[0].message.content
        : localAnalysis.response;
    } else {
      assistantText = localAnalysis.response;
    }
  } catch (err) {
    assistantText = localAnalysis.response;
  }

  if (!global.voiceHistories) global.voiceHistories = {};
  if (!global.voiceHistories[historyKey]) global.voiceHistories[historyKey] = [];
  global.voiceHistories[historyKey].push({ role: 'user', content: userText });
  global.voiceHistories[historyKey].push({ role: 'assistant', content: assistantText });

  if (global.voiceHistories[historyKey].length > 40) {
    global.voiceHistories[historyKey] = global.voiceHistories[historyKey].slice(-40);
  }

  res.json({
    success: true,
    sessionId: sid,
    language,
    transcription: userText,
    translation: userText,
    intent: localAnalysis.intent,
    category: localAnalysis.category,
    entities: localAnalysis.entities,
    response: assistantText,
    suggestedSchemes: localAnalysis.suggestedSchemes,
    provider: SARVAM_ENABLED ? 'sarvam-ai' : 'mock',
  });
}));

export default router;
