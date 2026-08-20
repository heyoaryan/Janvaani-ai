// server/routes/eligibilityRoutes.js
// Eligibility check endpoints backed by the deterministic rule engine.

import express from 'express';
import { evaluateEligibility, quickCheck } from '../services/eligibilityService.js';
import { getSchemeById } from '../services/schemeService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/eligibility/check
router.post(
  '/check',
  asyncHandler(async (req, res) => {
    const { schemeId, profile } = req.body || {};
    if (!schemeId || !profile) {
      const err = new Error('schemeId and profile are required');
      err.statusCode = 400;
      throw err;
    }
    const scheme = getSchemeById(schemeId);
    if (!scheme) {
      const err = new Error('Scheme not found');
      err.statusCode = 404;
      throw err;
    }

    const result = evaluateEligibility(scheme, profile);
    res.json({
      success: true,
      schemeId,
      schemeName: scheme.name,
      eligible: result.eligible,
      eligibilityPercentage: result.score,
      criteria: result.criteria,
    });
  })
);

// POST /api/eligibility/quick-check
// Minimal info: only schemeId + age required.
router.post(
  '/quick-check',
  asyncHandler(async (req, res) => {
    const { schemeId, age, gender, state } = req.body || {};
    if (!schemeId || age == null) {
      const err = new Error('schemeId and age are required');
      err.statusCode = 400;
      throw err;
    }
    const scheme = getSchemeById(schemeId);
    if (!scheme) {
      const err = new Error('Scheme not found');
      err.statusCode = 404;
      throw err;
    }

    const result = quickCheck(scheme, { age, gender, state });
    res.json({
      success: true,
      schemeId,
      schemeName: scheme.name,
      eligible: result.eligible,
      eligibilityPercentage: result.score,
      criteria: result.criteria,
      message: result.eligible
        ? 'आप इस योजना के लिए पात्र लग रहे हैं। और जानकारी दें for full check.'
        : 'अभी पूरी जांच के लिए और विवरण दें।',
    });
  })
);

export default router;
