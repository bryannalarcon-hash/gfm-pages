'use client';
// Overlay state provider. architecture.md §4.1.
// Owns overlayOn + active persona (mirrored to localStorage), exposes useOverlay()/usePersona().
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PersonaSlug, PersonaFixture } from '@/lib/personas/types';
import { getPersonaFixture, isDemoMode } from '@/lib/personas/loader';
import {
  readOverlayOn,
  writeOverlayOn,
  readOverlayPersona,
  writeOverlayPersona,
} from '@/lib/overlay/storage';

export interface OverlayState {
  overlayOn: boolean;
  persona: PersonaSlug; // mirrors localStorage.overlayPersona
  demoMode: boolean; // NEXT_PUBLIC_DEMO_MODE === 'true'
  setOverlayOn: (on: boolean) => void;
  setPersona: (slug: PersonaSlug) => void; // soft re-render, no full reload
}

const OverlayContext = createContext<OverlayState | null>(null);

export function OverlayProvider(props: { children: React.ReactNode }): JSX.Element {
  const demoMode = isDemoMode();
  // SSR-stable defaults (overlay off, anonymous); hydrate from storage after mount so
  // structure is identical server/client and the L3.5 slots don't flash.
  const [overlayOn, setOverlayOnState] = useState(false);
  const [persona, setPersonaState] = useState<PersonaSlug>('anonymous');

  useEffect(() => {
    if (!demoMode) return;
    setOverlayOnState(readOverlayOn());
    setPersonaState(readOverlayPersona());
    // Cross-tab / cross-surface sync (dashboard persona filter ↔ overlay menu).
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'overlayOn') setOverlayOnState(readOverlayOn());
      if (e.key === 'overlayPersona') setPersonaState(readOverlayPersona());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [demoMode]);

  const setOverlayOn = useCallback(
    (on: boolean) => {
      if (!demoMode) return;
      writeOverlayOn(on);
      setOverlayOnState(on);
    },
    [demoMode],
  );

  const setPersona = useCallback(
    (slug: PersonaSlug) => {
      if (!demoMode) return;
      writeOverlayPersona(slug);
      setPersonaState(slug);
    },
    [demoMode],
  );

  const value = useMemo<OverlayState>(
    () => ({ overlayOn, persona, demoMode, setOverlayOn, setPersona }),
    [overlayOn, persona, demoMode, setOverlayOn, setPersona],
  );

  return <OverlayContext.Provider value={value}>{props.children}</OverlayContext.Provider>;
}

export function useOverlay(): OverlayState {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error('useOverlay must be used within <OverlayProvider>');
  }
  return ctx;
}

// Personalization slots read "current user" through this. In demo mode it returns the current
// persona fixture; in prod a thin adapter maps the real user record into the same shape.
export function usePersona(): PersonaFixture {
  const { persona } = useOverlay();
  return getPersonaFixture(persona);
}
