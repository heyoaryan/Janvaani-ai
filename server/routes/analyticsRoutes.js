// server/routes/analyticsRoutes.js
// Demo analytics dashboard data for JanVaani AI.

import express from 'express';
import { loadSchemes } from '../services/schemeService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// GET /api/analytics/dashboard
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const schemes = loadSchemes();

    // Demo metrics (in production, aggregate from DB / event logs).
    const metrics = {
      schemesDiscovered: 1284,
      eligibilityChecks: 642,
      documentsIdentified: 319,
      applicationsAssisted: 207,
      familiesHelped: 158,
    };

    // Category distribution from the live scheme dataset.
    const byCategory = {};
    schemes.forEach((s) => {
      byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    });

    // A small sparkline-style series for the last 7 days (demo).
    const weeklyTrend = [
      { day: 'Mon', checks: 78 },
      { day: 'Tue', checks: 92 },
      { day: 'Wed', checks: 110 },
      { day: 'Thu', checks: 101 },
      { day: 'Fri', checks: 134 },
      { day: 'Sat', checks: 88 },
      { day: 'Sun', checks: 39 },
    ];

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      metrics,
      schemeCategoryBreakdown: byCategory,
      totalSchemes: schemes.length,
      weeklyTrend,
    });
  })
);

export default router;
