// server/routes/locationRoutes.js
// Nearby government offices and location search.

import express from 'express';
import { governmentOffices } from '../data/locations.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// GET /api/locations/nearby?limit=5
router.get(
  '/nearby',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const sorted = [...governmentOffices].sort((a, b) => a.distance - b.distance).slice(0, limit);
    res.json({
      success: true,
      count: sorted.length,
      data: sorted,
    });
  })
);

// POST /api/locations/search
// Search by type, city, state, or service keyword.
router.post(
  '/search',
  asyncHandler(async (req, res) => {
    const { type, city, state, service } = req.body || {};
    let results = governmentOffices;

    if (type) {
      results = results.filter((o) => o.type.toLowerCase() === String(type).toLowerCase());
    }
    if (city) {
      results = results.filter((o) => o.city.toLowerCase() === String(city).toLowerCase());
    }
    if (state) {
      results = results.filter((o) => o.state.toLowerCase() === String(state).toLowerCase());
    }
    if (service) {
      const s = String(service).toLowerCase();
      results = results.filter((o) =>
        o.services.some((svc) => svc.toLowerCase().includes(s))
      );
    }

    results = results.sort((a, b) => a.distance - b.distance);
    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  })
);

export default router;
