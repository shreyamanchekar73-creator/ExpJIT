import { emptyDraft, emptyOffice } from './defaults.js';

export const DRAFT_KEY = 'shriram-digital-forms-draft-v1';
export const OFFICE_KEY = 'shriram-digital-forms-office-v1';

export function loadOffice() {
  try {
    const raw = localStorage.getItem(OFFICE_KEY);
    return raw ? { ...emptyOffice, ...JSON.parse(raw) } : { ...emptyOffice };
  } catch {
    return { ...emptyOffice };
  }
}

export function saveOffice(office) {
  localStorage.setItem(OFFICE_KEY, JSON.stringify(office));
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDraft(draft) {
  const payload = { ...draft, savedAt: new Date().toISOString() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  saveOffice(payload.office || emptyOffice);
  return payload;
}

export function clearCustomerDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function newCustomerDraft(office) {
  const next = structuredClone(emptyDraft);
  next.office = { ...emptyOffice, ...(office || loadOffice()) };
  return saveDraft(next);
}
