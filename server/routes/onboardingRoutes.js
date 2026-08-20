import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// In-memory profile store (in production, use MongoDB)
const profiles = new Map();

// POST /api/onboarding/complete
router.post('/complete', asyncHandler(async (req, res) => {
  const { name, occupation, age, sessionId } = req.body || {};

  if (!name || !occupation || !age) {
    const err = new Error('name, occupation, and age are required');
    err.statusCode = 400;
    throw err;
  }

  const sid = sessionId || `profile-${Date.now()}`;
  const profile = {
    sessionId: sid,
    name: String(name).trim(),
    occupation: String(occupation).trim(),
    age: parseInt(age, 10),
    createdAt: new Date().toISOString(),
  };

  profiles.set(sid, profile);

  res.json({
    success: true,
    profile,
    message: `Namaste ${profile.name}! I am JanVaani AI, your personal assistant for government schemes. I know you are a ${profile.occupation} aged ${profile.age}. How can I help you today?`,
  });
}));

// GET /api/onboarding/profile/:sessionId
router.get('/profile/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const profile = profiles.get(sessionId) || null;

  res.json({
    success: true,
    profile,
  });
}));

export default router;
