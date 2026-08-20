// server/models/scheme.js
// Mongoose schema for government schemes.
// NOTE: The app currently runs on in-memory mock data (server/data/schemes.js),
// but this schema is provided so you can persist schemes to MongoDB later.
// To enable: connect mongoose (see comment in server.js) and use SchemeModel.find().

import mongoose from 'mongoose';

const eligibilityRuleSchema = new mongoose.Schema(
  {
    age: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 200 },
    },
    income: {
      max: { type: Number, default: Number.MAX_SAFE_INTEGER }, // annual income ceiling (INR)
    },
    gender: {
      type: String,
      enum: ['all', 'male', 'female'],
      default: 'all',
    },
    states: {
      type: [String], // ['all'] means pan-India; otherwise list of applicable states
      default: ['all'],
    },
    categories: {
      type: [String], // e.g. ['student', 'farmer', 'senior-citizen']
      default: ['any'],
    },
    occupation: {
      type: [String], // e.g. ['any', 'farmer', 'student', 'unemployed']
      default: ['any'],
    },
  },
  { _id: false }
);

const schemeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // stable slug id
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Education',
        'Housing',
        'Agriculture',
        'Healthcare',
        'Employment',
        'Maternity',
        'Skill Development',
        'Senior Citizens',
        'Girl Child',
        'Business',
        'Women Welfare',
      ],
      required: true,
    },
    description: { type: String, required: true },
    state: { type: String, default: 'All India' },
    eligibilityRules: { type: eligibilityRuleSchema, default: () => ({}) },
    requiredDocuments: { type: [String], default: [] },
    applicationSteps: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    officialSource: { type: String, required: true },
    keywords: { type: [String], default: [] },
    lastVerified: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const SchemeModel = mongoose.model('Scheme', schemeSchema);

export default SchemeModel;
