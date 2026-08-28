import axios from 'axios';

export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Schemes
export const schemesApi = {
  getAll: () => api.get('/schemes').then(r => r.data),
  getById: (id) => api.get(`/schemes/${id}`).then(r => r.data),
  search: (query) => api.post('/schemes/search', { query }).then(r => r.data),
};

// Voice
export const voiceApi = {
  transcribe: (audio, languageCode = 'hi-IN') => {
    const form = new FormData();
    const ext = (audio.type || '').includes('mp4') ? 'm4a' : 'webm';
    form.append('file', audio, `voice.${ext}`);
    form.append('language_code', languageCode);
    return api.post('/voice/transcribe', form, {
      headers: { 'Content-Type': undefined },
    }).then(r => r.data);
  },
  synthesize: (text, language = 'hi-IN') => api.post('/voice/synthesize', { text, language }).then(r => r.data),
  process: (input, sessionId, language = 'hi-IN', userProfile = {}) => api.post('/voice/process', { input, sessionId, language, userProfile }).then(r => r.data),
  getLanguages: () => api.get('/voice/languages').then(r => r.data),
};

// Onboarding
export const onboardingApi = {
  complete: (name, occupation, age, sessionId) => api.post('/onboarding/complete', { name, occupation, age, sessionId }).then(r => r.data),
  getProfile: (sessionId) => api.get(`/onboarding/profile/${sessionId}`).then(r => r.data),
};

// Documents
export const documentsApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  check: (docId, schemeId) => api.post('/documents/check', { docId, schemeId }).then(r => r.data),
  getMissing: (schemeId, uploadedDocs) => api.post('/documents/missing', { schemeId, uploadedDocs }).then(r => r.data),
};

// Eligibility
export const eligibilityApi = {
  check: (profile, schemeId) => api.post('/eligibility/check', { profile, schemeId }).then(r => r.data),
  quickCheck: (profile) => api.post('/eligibility/quick-check', { profile }).then(r => r.data),
};

// Family
export const familyApi = {
  createProfile: (members) => api.post('/family/create-profile', { members }).then(r => r.data),
  analyze: (profileId) => api.get(`/family/analyze/${profileId}`).then(r => r.data),
  getProfiles: () => api.get('/family/profiles').then(r => r.data),
};

// Scam
export const scamApi = {
  analyze: (text) => api.post('/scam/analyze', { text }).then(r => r.data),
  checkUrl: (url) => api.post('/scam/check-url', { url }).then(r => r.data),
};

// Locations
export const locationsApi = {
  getNearby: (lat, lng, radius = 5) => api.get(`/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`).then(r => r.data),
  search: (query) => api.get(`/locations/search?q=${query}`).then(r => r.data),
};

// Helper for fallback
export const getSchemesLocal = () => {
  return import('../data/schemes.js').then(m => m.schemes);
};

export const getDocumentsLocal = () => {
  return import('../data/schemes.js').then(m => m.documents);
};
