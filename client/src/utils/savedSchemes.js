const KEY = 'janvaani_saved_schemes';

export function getSavedSchemeIds() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function isSchemeSaved(id) {
  return getSavedSchemeIds().includes(String(id));
}

export function toggleSavedScheme(id) {
  const key = String(id);
  const current = getSavedSchemeIds();
  const next = current.includes(key) ? current.filter((x) => x !== key) : [key, ...current];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('janvaani-saved-changed'));
  return next.includes(key);
}
