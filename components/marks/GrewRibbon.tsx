'use client';

/**
 * GrewRibbon — "your share reached N" congratulations ribbon (feature S5).
 *
 * Guardrails (feature-contribution-board.md §3):
 *  - Shows reach count ONLY — NO donor identity, NO dollar figures.
 *  - Drops/animates on share.
 *  - Suppressed under reducedMotion (no drop animation — shows inline if at all).
 *  - Suppressed on memorial category via restrained prop.
 *  - The ribbon has a config to turn it on/off (show prop).
 */

import { useEffect, useRef, useState } from 'react';
import type { GrewRibbonProps } from '@/lib/marks/types';

// Ribbon animation CSS injected once
const RIBBON_ANIM_CSS = `
@keyframes ribbonDrop {
  from { transform: translateX(-50%) translateY(-130%); }
  to   { transform: translateX(-50%) translateY(0); }
}
@keyframes ribbonLift {
  from { transform: translateX(-50%) translateY(0); }
  to   { transform: translateX(-50%) translateY(-130%); }
}
`;

let ribbonAnimInjected = false;
function ensureRibbonAnim(): void {
  if (ribbonAnimInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.dataset['ribbonAnim'] = '1';
  el.textContent = RIBBON_ANIM_CSS;
  document.head.appendChild(el);
  ribbonAnimInjected = true;
}

interface GrewRibbonInternalProps extends GrewRibbonProps {
  /** Whether the ribbon is currently visible */
  show?: boolean;
  /** Suppress animations and display under reducedMotion */
  reducedMotion?: boolean;
  /**
   * Suppress the ribbon entirely for emotionally fragile contexts (e.g. memorial category).
   * Tone by cause category: freedom/skin scales inversely with emotional fragility (§3).
   */
  restrained?: boolean;
}

export function GrewRibbon({
  reach,
  show = false,
  reducedMotion = false,
  restrained = false,
}: GrewRibbonInternalProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inject animation CSS
  if (typeof window !== 'undefined') {
    ensureRibbonAnim();
  }

  useEffect(() => {
    if (restrained) return; // Suppressed for memorial/medical category

    if (show && !visible) {
      setExiting(false);
      setVisible(true);
      // Auto-dismiss after 3.2 seconds
      hideTimer.current = setTimeout(() => {
        setExiting(true);
        setTimeout(() => setVisible(false), 450);
      }, 3200);
    } else if (!show && visible) {
      setExiting(true);
      setTimeout(() => setVisible(false), 450);
    }

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [show, restrained]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nothing to render if suppressed or hidden
  if (restrained || !visible) return null;

  // Under reducedMotion: no drop/lift animation, just show/hide without motion
  const animStyle: React.CSSProperties = reducedMotion
    ? {
        transform: 'translateX(-50%) translateY(0)',
      }
    : exiting
    ? {
        animation: 'ribbonLift 0.45s var(--hrt-ease-default, cubic-bezier(0.3,0.01,0,1)) forwards',
      }
    : {
        animation:
          'ribbonDrop 0.45s var(--hrt-ease-default, cubic-bezier(0.3,0.01,0,1)) both',
      };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        zIndex: 1200,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--hrt-size-spacing-1)',
        background: 'var(--hrt-color-surface-brand-strong)',
        color: '#fff',
        fontSize: 'var(--hrt-size-font-body-sm)',
        fontWeight: 700,
        fontFamily: 'var(--hrt-font-family)',
        padding: 'var(--hrt-size-spacing-1) var(--hrt-size-spacing-3)',
        borderRadius: '0 0 var(--hrt-size-radius-lg) var(--hrt-size-radius-lg)',
        boxShadow: 'var(--hrt-shadow-medium)',
        maxWidth: 'calc(100vw - var(--hrt-size-spacing-4))',
        ...animStyle,
      }}
    >
      {/* No emoji in main message per spec — clean text */}
      Your share reached{' '}
      <span
        style={{
          color: '#acf86c', // brand lime accent — same as sun-ribbon__em in marks.css
        }}
      >
        {reach} {reach === 1 ? 'person' : 'people'}
      </span>
      {/* NO donor identity, NO dollar figures — only reach count (§3 privacy) */}
    </div>
  );
}
