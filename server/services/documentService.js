// server/services/documentService.js
// Mock document analysis: recognize doc types, extract fields, check against
// scheme requirements, and identify missing documents.

import { documentTypes, getDocumentRequirements } from '../data/documents.js';
import { getSchemeById } from './schemeService.js';

// ---------- Mock OCR / classification ----------
/**
 * Recognize a document type from a filename + (mock) content hint.
 * INTEGRATION POINT: Replace with real OCR/ML document classifier.
 */
export function recognizeDocumentType(fileName = '', hint = '') {
  const text = `${fileName} ${hint}`.toLowerCase();
  const keywordMap = {
    aadhaar: ['aadhaar', 'uidai', 'आधार'],
    pan: ['pan', 'permanent account'],
    'income-certificate': ['income', 'आय', 'income certificate'],
    'student-id': ['student', 'college', 'school', 'roll'],
    'bank-passbook': ['passbook', 'bank', 'account'],
    'ration-card': ['ration', 'राशन'],
    'land-proof': ['khata', 'land', 'patta', 'खसरा', 'जमीन'],
    'age-proof': ['birth', 'age', 'जन्म'],
    'birth-certificate': ['birth', 'जन्म'],
    'project-report': ['project', 'business plan', 'परियोजना'],
    'incorporation-cert': ['incorporation', 'cin', 'company'],
    'business-plan': ['business plan', 'funding'],
    'maternal-card': ['maternal', 'anc', 'गर्भ'],
    'sowing-certificate': ['sowing', 'crop', 'बुवाई'],
  };

  for (const [type, keys] of Object.entries(keywordMap)) {
    if (keys.some((k) => text.includes(k))) return type;
  }
  return 'unknown';
}

/**
 * Mock field extraction for a recognized document type.
 * INTEGRATION POINT: Replace with real OCR text parsing.
 */
export function extractFields(type, rawContent = {}) {
  const fields = documentTypes[type]?.fields || [];
  const extracted = {};
  fields.forEach((f) => {
    extracted[f] = rawContent[f] != null ? rawContent[f] : `[extracted ${f}]`;
  });
  return extracted;
}

/**
 * Analyze an uploaded document (mock). Returns recognized type, fields, and
 * confidence. Accepts a `file` (filename) and optional `content` blob.
 */
export function analyzeDocument({ fileName, content = {}, hint } = {}) {
  const type = recognizeDocumentType(fileName, hint);
  const extractedFields = type === 'unknown' ? {} : extractFields(type, content);
  return {
    type,
    label: documentTypes[type]?.label || 'Unknown Document',
    confidence: type === 'unknown' ? 0.4 : 0.92,
    extractedFields,
    fileName: fileName || 'uploaded-file',
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Check a user's uploaded documents against a scheme's requirements.
 * @returns {object} { schemeId, satisfied[], missing[] }
 */
export function checkDocumentsForScheme(schemeId, userDocuments = []) {
  const scheme = getSchemeById(schemeId);
  if (!scheme) throw new Error('Scheme not found');

  const required = scheme.requiredDocuments || [];
  const haveTypes = new Set(userDocuments.map((d) => d.type));
  const satisfied = [];
  const missing = [];

  required.forEach((docKey) => {
    const meta = documentTypes[docKey] || { label: docKey, howToGet: '', description: '' };
    if (haveTypes.has(docKey)) {
      satisfied.push({ key: docKey, label: meta.label });
    } else {
      missing.push({
        key: docKey,
        label: meta.label,
        description: meta.description,
        howToGet: meta.howToGet,
      });
    }
  });

  return { schemeId, schemeName: scheme.name, satisfied, missing };
}

/**
 * Get missing documents for a scheme given the user's uploaded docs.
 */
export function getMissingDocuments(schemeId, userDocuments = []) {
  const result = checkDocumentsForScheme(schemeId, userDocuments);
  return {
    schemeId,
    schemeName: result.schemeName,
    missing: result.missing,
    satisfied: result.satisfied,
    hasAll: result.missing.length === 0,
    guidance:
      result.missing.length === 0
        ? 'सभी आवश्यक दस्तावेज़ उपलब्ध हैं। आप आवेदन कर सकते हैं।'
        : 'कुछ दस्तावेज़ अभी लापता हैं। नीचे दिए गए तरीके से प्राप्त करें।',
  };
}

export { getDocumentRequirements };

export default {
  recognizeDocumentType,
  extractFields,
  analyzeDocument,
  checkDocumentsForScheme,
  getMissingDocuments,
  getDocumentRequirements,
};
