// server/data/documents.js
// Mock document database for JanVaani AI document analysis demos.

// Known document types and the fields they typically contain.
export const documentTypes = {
  aadhaar: {
    label: 'Aadhaar Card',
    fields: ['name', 'aadhaarNumber', 'dateOfBirth', 'gender', 'address'],
    description: 'Unique 12-digit identity number issued by UIDAI.',
    howToGet: 'Apply at uidai.gov.in or enrol at the nearest Aadhaar Seva Kendra (CSC).',
  },
  pan: {
    label: 'PAN Card',
    fields: ['name', 'panNumber', 'dateOfBirth'],
    description: 'Permanent Account Number for tax identification.',
    howToGet: 'Apply online at incometaxindiaefiling.gov.in or via a PAN center.',
  },
  'income-certificate': {
    label: 'Income Certificate',
    fields: ['name', 'annualIncome', 'issuedBy', 'validUntil'],
    description: 'Government-issued proof of annual family income.',
    howToGet: 'Apply at the local Tehsil / SDM office or state e-district portal.',
  },
  'student-id': {
    label: 'Student ID Card',
    fields: ['name', 'institution', 'course', 'rollNumber'],
    description: 'Identity card issued by an educational institution.',
    howToGet: 'Issued by your school/college administration office.',
  },
  'bank-passbook': {
    label: 'Bank Passbook',
    fields: ['name', 'accountNumber', 'ifsc', 'branch'],
    description: 'Proof of bank account for Direct Benefit Transfer.',
    howToGet: 'Open an account at any bank branch or via Jan Dhan Yojana.',
  },
  'ration-card': {
    label: 'Ration Card',
    fields: ['headOfFamily', 'members', 'category'],
    description: 'Proof of Below Poverty Line / household entitlement.',
    howToGet: 'Apply at the local Food & Civil Supplies office.',
  },
  'land-proof': {
    label: 'Land Record / Khata',
    fields: ['ownerName', 'surveyNumber', 'area', 'district'],
    description: 'Proof of land ownership for farmer schemes.',
    howToGet: 'Obtain from the local Revenue / Patwari office or state land records portal.',
  },
  'age-proof': {
    label: 'Age Proof (Birth Certificate)',
    fields: ['name', 'dateOfBirth', 'placeOfBirth'],
    description: 'Proof of age for pension and other schemes.',
    howToGet: 'Apply at the municipal / Panchayat birth registration office.',
  },
  'birth-certificate': {
    label: 'Birth Certificate',
    fields: ['name', 'dateOfBirth', 'parentName'],
    description: 'Proof of birth for child-related schemes.',
    howToGet: 'Apply at the municipal / Panchayat birth registration office.',
  },
  'project-report': {
    label: 'Project Report',
    fields: ['applicantName', 'businessType', 'investment'],
    description: 'Business plan document for self-employment schemes.',
    howToGet: 'Prepare with help from DIC / KVIC or a consultant.',
  },
  'incorporation-cert': {
    label: 'Incorporation Certificate',
    fields: ['companyName', 'cin', 'dateOfIncorporation'],
    description: 'Proof of registered company for Startup India.',
    howToGet: 'Register on MCA portal (ministry of corporate affairs).',
  },
  'business-plan': {
    label: 'Business Plan',
    fields: ['founderName', 'sector', 'fundingAsk'],
    description: 'Narrative plan for startup funding.',
    howToGet: 'Prepare internally or with an incubator.',
  },
  'maternal-card': {
    label: 'Maternal Health Card',
    fields: ['name', 'lmpDate', 'anmolNumber'],
    description: 'Antenatal care record for maternity schemes.',
    howToGet: 'Register at the nearest Anganwadi / PHC.',
  },
  'sowing-certificate': {
    label: 'Sowing Certificate',
    fields: ['farmerName', 'crop', 'area', 'season'],
    description: 'Proof of sowing for crop insurance.',
    howToGet: 'Obtain from Patwari / agriculture officer after sowing.',
  },
};

// Sample uploaded documents (simulating a user who has uploaded some docs).
export const sampleUploadedDocuments = [
  {
    id: 'doc-1',
    type: 'aadhaar',
    fileName: 'aadhaar_scan.jpg',
    extractedFields: {
      name: 'सुनीता देवी',
      aadhaarNumber: 'XXXX XXXX 1234',
      dateOfBirth: '1990-05-12',
      gender: 'female',
      address: 'Village Bhagwanpur, Patna, Bihar',
    },
    uploadedAt: '2026-01-15T10:30:00Z',
  },
  {
    id: 'doc-2',
    type: 'bank-passbook',
    fileName: 'passbook.pdf',
    extractedFields: {
      name: 'Suneeta Devi',
      accountNumber: 'XXXXXXXX7890',
      ifsc: 'SBIN0001234',
      branch: 'Patna Main',
    },
    uploadedAt: '2026-01-15T10:32:00Z',
  },
  {
    id: 'doc-3',
    type: 'land-proof',
    fileName: 'khata.png',
    extractedFields: {
      ownerName: 'Suneeta Devi',
      surveyNumber: 'SN-456',
      area: '2.5 acre',
      district: 'Patna',
    },
    uploadedAt: '2026-01-15T10:35:00Z',
  },
];

// Map a scheme's required documents to labels and metadata for convenience.
export function getDocumentRequirements(requiredDocKeys = []) {
  return requiredDocKeys.map((key) => ({
    key,
    ...(documentTypes[key] || { label: key, description: '', howToGet: '', fields: [] }),
  }));
}

export default {
  documentTypes,
  sampleUploadedDocuments,
  getDocumentRequirements,
};
