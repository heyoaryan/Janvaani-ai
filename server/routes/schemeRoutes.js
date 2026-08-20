// server/routes/schemeRoutes.js
// Schemes listing, detail, and AI-powered search endpoints.

import express from 'express';
import {
  loadSchemes,
  getSchemeById,
  searchSchemes,
  rankSchemes,
  extractEntities,
} from '../services/schemeService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// GET /api/schemes?category=Education&state=Bihar&search=kisan
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, state, search } = req.query;
    const results = searchSchemes({ category, state, search });
    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  })
);

// GET /api/schemes/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const scheme = getSchemeById(req.params.id);
    if (!scheme) {
      const err = new Error('Scheme not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({ success: true, data: scheme });
  })
);

// POST /api/schemes/search
// AI-powered scheme search with intent/entity extraction and match scoring.
router.post(
  '/search',
  asyncHandler(async (req, res) => {
    const { query, profile = {} } = req.body || {};

    // Extract intent + entities from natural language (Hindi/Hinglish).
    const extracted = extractEntities(query || '');

    // Build a search filter from extracted entities. NOTE: we do NOT pass the
    // raw sentence as a `search` substring filter (it would match nothing);
    // the detected category/state are reliable structured signals.
    const filters = {};
    if (extracted.category) filters.category = extracted.category;
    if (extracted.entities.state) filters.state = extracted.entities.state;

    const baseResults = searchSchemes(filters);

    // Combine query entities with explicit profile for scoring.
    const scoringProfile = {
      ...profile,
      age: profile.age ?? extracted.entities.age,
      gender: profile.gender ?? extracted.entities.gender,
      state: profile.state ?? extracted.entities.state,
      occupation: profile.occupation ?? extracted.entities.occupation,
      annualIncome: profile.annualIncome ?? extracted.entities.income,
      category: profile.category ?? extracted.entities.occupation,
    };

    const ranked = rankSchemes(baseResults, scoringProfile);
    const topMatches = ranked.slice(0, 5).map((m) => ({
      id: m.scheme.id,
      name: m.scheme.name,
      category: m.scheme.category,
      matchPercentage: m.matchPercentage,
      reasons: m.reasons,
      eligibilitySummary: m.eligibilitySummary,
      benefits: m.scheme.benefits,
      officialSource: m.scheme.officialSource,
    }));

    res.json({
      success: true,
      query: query || '',
      intent: extracted.intent,
      detectedCategory: extracted.category,
      entities: extracted.entities,
      count: topMatches.length,
      data: topMatches,
    });
  })
);

export default router;
