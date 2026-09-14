export const DOC_STORAGE_KEY = 'janvaani_have_docs';

// ── Per-scheme storage ────────────────────────────────────────────────────────
// Each scheme gets its own localStorage key so docs never bleed across schemes.

function schemeKey(schemeId) {
  return `janvaani_docs_${schemeId}`;
}

export function getHaveDocIdsForScheme(schemeId) {
  if (!schemeId) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(schemeKey(schemeId)) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function setHaveDocIdsForScheme(schemeId, ids) {
  if (!schemeId) return;
  localStorage.setItem(schemeKey(schemeId), JSON.stringify([...new Set(ids)]));
}

export function toggleHaveDocForScheme(schemeId, id) {
  const have = getHaveDocIdsForScheme(schemeId);
  const next = have.includes(id) ? have.filter((x) => x !== id) : [...have, id];
  setHaveDocIdsForScheme(schemeId, next);
  return next;
}

// ── Clear all document data ───────────────────────────────────────────────────
// Removes every janvaani_docs_* and janvaani_verify_* key from localStorage.
// Called when profile name changes (saved verifications are no longer valid).

export function clearAllDocData() {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('janvaani_docs_') || key.startsWith('janvaani_verify_'))) {
      toRemove.push(key);
    }
  }
  toRemove.forEach(k => localStorage.removeItem(k));
  // Also clear legacy global key
  localStorage.removeItem(DOC_STORAGE_KEY);
}
export function getHaveDocIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(DOC_STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function setHaveDocIds(ids) {
  localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}

export function toggleHaveDoc(id) {
  const have = getHaveDocIds();
  const next = have.includes(id) ? have.filter((x) => x !== id) : [...have, id];
  setHaveDocIds(next);
  return next;
}

// ── Alias map for fuzzy doc matching ─────────────────────────────────────────
export const DOC_ALIASES = {
  aadhaar: ['aadhaar', 'aadhar', 'uid', 'आधार'],
  pan: ['pan'],
  'income-cert': ['income certificate', 'income'],
  domicile: ['domicile', 'nativity', 'residence', 'delhi address proof', 'karnataka address proof', 'west bengal address proof'],
  'bank-account': ['bank passbook', 'bank account', 'bank', 'passbook'],
  'college-id': ['college id', 'student id', 'bonafide'],
  marksheet: ['marksheet', 'education certificate'],
  'ration-card': ['ration card', 'ration', 'jan aadhaar'],
  'land-docs': ['land records', 'land documents', 'land', 'property proof'],
  'birth-cert': ['birth certificate', 'birth'],
  'caste-cert': ['caste certificate', 'caste'],
  'disability-cert': ['disability certificate', 'disability'],
  'mcp-card': ['mcp card', 'mcp'],
  'farmer-id': ['farmer id', 'kisan card', 'farmer'],
  'electricity-bill': ['electricity bill', 'bijli'],
  'vendor-cert': ['vendor certificate', 'vendor'],
  'shg-membership': ['shg membership', 'shg'],
  'mobile-number': ['mobile number', 'mobile'],
  'company-reg': ['company registration'],
  'pitch-deck': ['pitch deck'],
  'business-plan': ['business plan'],
  'sowing-cert': ['sowing certificate'],
  'passport-photo': ['passport photo'],
};

export function matchRequiredToCatalog(requiredLabel, catalog) {
  const r = String(requiredLabel || '').toLowerCase().replace(/[\s_-]+/g, '');
  return catalog.find((doc) => {
    const aliases = DOC_ALIASES[doc.id] || [];
    const parts = [doc.id, doc.name, doc.nameHi, ...aliases].filter(Boolean);
    return parts.some((p) => {
      const n = String(p).toLowerCase().replace(/[\s_-]+/g, '');
      return r.includes(n) || n.includes(r);
    });
  });
}

export function docsForScheme(scheme, catalog) {
  const labels = scheme?.requiredDocuments || [];
  const seen = new Set();
  const rows = [];
  labels.forEach((label) => {
    const hit = matchRequiredToCatalog(label, catalog);
    if (hit && !seen.has(hit.id)) {
      seen.add(hit.id);
      rows.push({ ...hit, requiredLabel: label });
    } else if (!hit) {
      const id = `other-${label.toLowerCase().replace(/\s+/g, '-')}`;
      if (!seen.has(id)) {
        seen.add(id);
        rows.push({
          id,
          name: label,
          nameHi: label,
          requiredLabel: label,
          unofficial: true,
        });
      }
    }
  });
  return rows;
}
