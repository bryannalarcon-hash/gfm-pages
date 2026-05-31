// The two demo localStorage keys (single owner). architecture.md §4.1, design-overlay.md.
import type { PersonaSlug } from '@/lib/personas/types';

export const OVERLAY_ON_KEY = 'overlayOn'; // boolean
export const OVERLAY_PERSONA_KEY = 'overlayPersona'; // PersonaSlug

const DEFAULT_PERSONA: PersonaSlug = 'anonymous';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function readOverlayOn(): boolean {
  if (!hasStorage()) return false;
  return window.localStorage.getItem(OVERLAY_ON_KEY) === 'true';
}

export function writeOverlayOn(on: boolean): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(OVERLAY_ON_KEY, on ? 'true' : 'false');
}

export function readOverlayPersona(): PersonaSlug {
  if (!hasStorage()) return DEFAULT_PERSONA;
  const raw = window.localStorage.getItem(OVERLAY_PERSONA_KEY);
  return (raw as PersonaSlug) || DEFAULT_PERSONA;
}

export function writeOverlayPersona(slug: PersonaSlug): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(OVERLAY_PERSONA_KEY, slug);
}
