// server/routes/documentRoutes.js
// Document upload (mock), scheme requirement check, and missing-doc retrieval.

import express from 'express';
import {
  analyzeDocument,
  checkDocumentsForScheme,
  getMissingDocuments,
} from '../services/documentService.js';
import { sampleUploadedDocuments } from '../data/documents.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/documents/upload  (mock analysis; multer would supply req.file in prod)
router.post(
  '/upload',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const fileName = body.fileName || (req.file && req.file.originalname) || 'document';
    const content = body.content || {};

    const analysis = analyzeDocument({ fileName, content, hint: body.hint });
    res.json({
      success: true,
      message: 'Document analyzed (mock).',
      data: analysis,
    });
  })
);

// POST /api/documents/check
// Check the user's uploaded docs against a scheme's requirements.
router.post(
  '/check',
  asyncHandler(async (req, res) => {
    const { schemeId, documents } = req.body || {};
    if (!schemeId) {
      const err = new Error('schemeId is required');
      err.statusCode = 400;
      throw err;
    }
    // Use provided documents, or fall back to demo sample docs.
    const userDocs = documents && documents.length ? documents : sampleUploadedDocuments;
    const result = checkDocumentsForScheme(schemeId, userDocs);
    res.json({ success: true, data: result });
  })
);

// POST /api/documents/missing
// Return clearly which documents are missing and how to get them.
router.post(
  '/missing',
  asyncHandler(async (req, res) => {
    const { schemeId, documents } = req.body || {};
    if (!schemeId) {
      const err = new Error('schemeId is required');
      err.statusCode = 400;
      throw err;
    }
    const userDocs = documents && documents.length ? documents : sampleUploadedDocuments;
    const result = getMissingDocuments(schemeId, userDocs);
    res.json({ success: true, data: result });
  })
);

export default router;
