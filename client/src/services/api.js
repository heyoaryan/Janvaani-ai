import axios from 'axios';

function resolveApiBase() {
  let base = String(import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '');
  if (!base || base === '/api') return '/api';
  if (!base.endsWith('/api')) base = `${base}/api`;
  return base;
}

export const API_BASE = resolveApiBase();

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
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
    const mime = audio.type || '';
    const ext = mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : 'webm';
    form.append('file', audio, `voice.${ext}`);
    form.append('language_code', languageCode);
    return api.post('/voice/transcribe', form, { timeout: 90000 }).then(r => r.data);
  },
  synthesize: (text, language = 'hi-IN') =>
    api.post('/voice/synthesize', { text, language }, { timeout: 30000 }).then(r => r.data),
  process: (input, sessionId, language = 'hi-IN', userProfile = {}) =>
    api.post('/voice/process', { input, sessionId, language, userProfile }, { timeout: 45000 }).then(r => r.data),
  getLanguages: () => api.get('/voice/languages').then(r => r.data),
};

// Onboarding
export const onboardingApi = {
  complete: (name, occupation, age, sessionId) => api.post('/onboarding/complete', { name, occupation, age, sessionId }).then(r => r.data),
  getProfile: (sessionId) => api.get(`/onboarding/profile/${sessionId}`).then(r => r.data),
};

// Documents
export const documentsApi = {
  /**
   * Upload a file for OCR analysis.
   * @param {File} file - the file object from an <input type="file">
   * @param {object} opts - optional { hint: string, profileName: string }
   */
  upload: (file, { hint = '', profileName = '' } = {}) => {
    const form = new FormData();
    form.append('file', file, file.name);
    if (hint)        form.append('hint', hint);
    if (profileName) form.append('profileName', profileName);
    return api.post('/documents/upload', form, { timeout: 60000 }).then(r => r.data);
  },

  /**
   * Verify one file against a specific scheme document key.
   * Returns { status: 'verified'|'warning'|'error'|'wrong_document', warnings, extractedFields, ... }
   * @param {File} file
   * @param {object} opts - { schemeDocKey: string, profileName: string }
   */
  verify: (file, { schemeDocKey = '', profileName = '' } = {}) => {
    const form = new FormData();
    form.append('file', file, file.name);
    if (schemeDocKey) form.append('schemeDocKey', schemeDocKey);
    if (profileName)  form.append('profileName', profileName);
    return api.post('/documents/verify', form, { timeout: 60000 }).then(r => r.data);
  },

  /**
   * Check multiple uploaded-doc objects against a scheme.
   * @param {string} schemeId
   * @param {Array}  documents - array of { type, extractedFields, ... }
   */
  check: (schemeId, documents) =>
    api.post('/documents/check', { schemeId, documents }).then(r => r.data),

  /**
   * Get missing documents for a scheme.
   * @param {string} schemeId
   * @param {Array}  uploadedDocs
   */
  getMissing: (schemeId, uploadedDocs) =>
    api.post('/documents/missing', { schemeId, uploadedDocs }).then(r => r.data),
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
