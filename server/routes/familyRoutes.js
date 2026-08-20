// server/routes/familyRoutes.js
// Household profile creation, analysis, and listing.

import express from 'express';
import { loadSchemes, calculateMatch } from '../services/schemeService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// In-memory store of family profiles (demo only).
const familyProfiles = [];

// Convert a family member record into an eligibility profile.
function memberToProfile(member) {
  const isStudent = member.studentStatus === true || member.studentStatus === 'true';
  const isFarmer = member.farmerStatus === true || member.farmerStatus === 'true';
  const isDisabled = member.disabilityStatus === true || member.disabilityStatus === 'true';

  let category = 'any';
  if (isStudent) category = 'student';
  else if (isFarmer) category = 'farmer';
  else if (isDisabled) category = 'senior-citizen'; // treated as priority category

  let occupation = 'any';
  if (isStudent) occupation = 'student';
  else if (isFarmer) occupation = 'farmer';
  else if (member.occupation) occupation = member.occupation;

  return {
    age: toNum(member.age),
    gender: member.gender,
    state: member.state,
    annualIncome: toNum(member.income),
    category,
    occupation,
  };
}

function toNum(v) {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isNaN(n) ? null : n;
}

// POST /api/family/create-profile
router.post(
  '/create-profile',
  asyncHandler(async (req, res) => {
    const { name, headOfFamily, members = [] } = req.body || {};
    if (!members.length) {
      const err = new Error('At least one family member is required');
      err.statusCode = 400;
      throw err;
    }

    const profile = {
      id: `fam-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name || 'My Household',
      headOfFamily: headOfFamily || members[0]?.name || 'N/A',
      members: members.map((m, i) => ({
        memberId: m.memberId || `m-${i + 1}`,
        name: m.name,
        age: m.age,
        gender: m.gender,
        relation: m.relation,
        occupation: m.occupation,
        studentStatus: m.studentStatus,
        income: m.income,
        farmerStatus: m.farmerStatus,
        disabilityStatus: m.disabilityStatus,
        state: m.state,
        district: m.district,
      })),
      createdAt: new Date().toISOString(),
    };

    familyProfiles.push(profile);
    res.status(201).json({
      success: true,
      message: 'Household profile created.',
      data: profile,
    });
  })
);

// POST /api/family/analyze
// Analyze all members and find relevant schemes for each.
router.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const profile = body.profile; // accept inline profile, or
    const profileId = body.profileId;
    let target = profile;
    if (!target && profileId) {
      target = familyProfiles.find((p) => p.id === profileId);
    }
    if (!target) {
      const err = new Error('Provide a profile object or a valid profileId');
      err.statusCode = 400;
      throw err;
    }

    const allSchemes = loadSchemes();
    const memberResults = target.members.map((member) => {
      const memberProfile = memberToProfile(member);
      const matches = allSchemes
        .map((scheme) => ({ scheme, ...calculateMatch(scheme, memberProfile) }))
        .filter((m) => m.matchPercentage >= 50)
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 3)
        .map((m) => ({
          id: m.scheme.id,
          name: m.scheme.name,
          category: m.scheme.category,
          matchPercentage: m.matchPercentage,
          benefits: m.scheme.benefits,
        }));

      return {
        memberId: member.memberId,
        name: member.name,
        relation: member.relation,
        recommendedSchemes: matches,
      };
    });

    // Household-wide summary.
    const allRecommended = new Set();
    memberResults.forEach((m) =>
      m.recommendedSchemes.forEach((s) => allRecommended.add(s.id))
    );
    const householdSchemes = allSchemes
      .filter((s) => allRecommended.has(s.id))
      .map((s) => ({ id: s.id, name: s.name, category: s.category }));

    res.json({
      success: true,
      membersAnalyzed: memberResults.length,
      perMember: memberResults,
      householdRecommendations: householdSchemes,
    });
  })
);

// GET /api/family/profiles
router.get(
  '/profiles',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      count: familyProfiles.length,
      data: familyProfiles,
    });
  })
);

export default router;
