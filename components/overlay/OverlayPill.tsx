'use client';
// Floating persona + overlay-toggle pill (demo-only).
// design-overlay.md — "The pill" + "The menu" sections.
// Contract consumed: useOverlay() from '@/lib/overlay/context'
// Fixtures: PERSONA_ORDER, PERSONA_LABELS, PERSONAS from '@/fixtures/personas'
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useOverlay } from '@/lib/overlay/context';
import { PERSONA_ORDER, PERSONA_LABELS, PERSONAS } from '@/fixtures/personas';
import type { PersonaSlug } from '@/lib/personas/types';

// Generic person SVG glyph for anonymous (initial === '').
function PersonGlyph(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z" />
    </svg>
  );
}

interface AvatarProps {
  slug: PersonaSlug;
  size?: number;
}

function Avatar({ slug, size = 32 }: AvatarProps): JSX.Element {
  const fixture = PERSONAS[slug];
  // CB-59: named personas carry pfpUrl + trophy; anonymous/guest stay generic.
  const { bg, fg, initial, pfpUrl, trophy } = fixture.avatar as typeof fixture.avatar & {
    pfpUrl?: string;
    trophy?: boolean;
  };
  // shared_by_extro has a border but no bd field in fixture; check against mock
  const hasBorder = slug === 'shared_by_extro';
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }} aria-hidden="true">
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--hrt-size-radius-full)',
          background: bg,
          color: fg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.625rem',
          fontWeight: 'var(--hrt-font-weight-bold)' as string,
          border: hasBorder ? '1px solid #4a9d44' : undefined,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {pfpUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pfpUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : initial === '' ? (
          <PersonGlyph />
        ) : (
          initial
        )}
      </span>
      {trophy && (
        <span
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            fontSize: Math.max(9, Math.round(size * 0.42)),
            lineHeight: 1,
          }}
        >
          🏆
        </span>
      )}
    </span>
  );
}

// Switch visual (aria state is on the parent menuitemcheckbox row).
interface SwitchProps {
  checked: boolean;
}

function Switch({ checked }: SwitchProps): JSX.Element {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 40,
        height: 24,
        borderRadius: 'var(--hrt-size-radius-full)',
        background: checked
          ? 'var(--hrt-color-surface-brand)'
          : 'var(--hrt-color-border-neutral)',
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
        transition: 'background var(--hrt-time-transition-fast)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 20,
          height: 20,
          borderRadius: 'var(--hrt-size-radius-full)',
          background: '#fff',
          transform: checked ? 'translateX(16px)' : 'translateX(0)',
          transition: 'transform var(--hrt-time-transition-fast)',
        }}
      />
    </span>
  );
}

export function OverlayPill(): JSX.Element | null {
  const { demoMode, overlayOn, persona, setOverlayOn, setPersona } = useOverlay();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const pillRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Track first activation for pulse animation.
  const [pulsing, setPulsing] = useState(false);
  const prevOverlayOn = useRef(overlayOn);

  // Trigger one-shot pulse on first activation.
  useEffect(() => {
    if (overlayOn && !prevOverlayOn.current) {
      setPulsing(true);
    }
    prevOverlayOn.current = overlayOn;
  }, [overlayOn]);

  // Reset pulsing after animation completes.
  useEffect(() => {
    if (!pulsing) return;
    const t = setTimeout(() => setPulsing(false), 600);
    return () => clearTimeout(t);
  }, [pulsing]);

  // Close menu on click outside.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !pillRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [menuOpen]);

  // Escape closes menu and returns focus to pill.
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        pillRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // Arrow-key traversal inside menu.
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"],[role="menuitemradio"]') ?? [],
      );
      const focused = document.activeElement as HTMLElement;
      const idx = items.indexOf(focused);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      }
    },
    [],
  );

  if (!demoMode) return null;

  // CB-18: suppress pill on /dashboard — the internal analytics surface should not show
  // demo affordances. State is preserved in context so returning to a product page
  // restores the prior overlay setting without any explicit write.
  if (pathname?.startsWith('/dashboard')) return null;

  const label = PERSONA_LABELS[persona];
  const pillLabel = overlayOn
    ? `${label.name} · overlay on · ▾`
    : `${label.name} · ▾`;

  // Pill base style (inline because it includes CSS vars and conditional values).
  const pillStyle: React.CSSProperties = {
    position: 'fixed',
    right: 'max(var(--hrt-size-spacing-2), env(safe-area-inset-right))',
    bottom: 'max(var(--hrt-size-spacing-2), env(safe-area-inset-bottom))',
    zIndex: 1000,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--hrt-size-spacing-1)',
    minHeight: 'var(--hrt-size-spacing-5)',
    padding: 'var(--hrt-size-spacing-1) var(--hrt-size-spacing-2)',
    borderRadius: 'var(--hrt-size-radius-full)',
    fontSize: 'var(--hrt-size-font-body-xs)',
    fontWeight: 'var(--hrt-font-weight-bold)',
    background: overlayOn ? '#232323' : 'var(--hrt-color-surface-neutral-subtle)',
    color: overlayOn ? '#fff' : 'var(--hrt-color-text-supporting)',
    border: overlayOn ? 'none' : '1px solid var(--hrt-color-border-neutral)',
    boxShadow: 'var(--hrt-shadow-medium)',
    cursor: 'pointer',
    // Pulse animation via CSS custom property
    animation: pulsing ? 'pillpulse 0.5s var(--hrt-ease-default) 1' : 'none',
  };

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    right: 'max(var(--hrt-size-spacing-2), env(safe-area-inset-right))',
    // Position above pill: pill minHeight(40px) + spacing-2(16px) + safe-area
    bottom: 'calc(var(--hrt-size-spacing-5) + var(--hrt-size-spacing-2) + env(safe-area-inset-bottom))',
    zIndex: 1001,
    width: 280,
    maxWidth: 'calc(100vw - var(--hrt-size-spacing-4))',
    maxHeight: 'calc(100vh - var(--hrt-size-spacing-10))',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: 'var(--hrt-size-radius-xl)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    padding: 'var(--hrt-size-spacing-2)',
  };

  const rowBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--hrt-size-spacing-2)',
    width: '100%',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    padding: 'var(--hrt-size-spacing-1)',
    borderRadius: 'var(--hrt-size-radius-md)',
    color: 'var(--hrt-color-text-default)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <>
      {/* Keyframe is injected once globally via a <style> tag */}
      <style>{`
        @keyframes pillpulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        @media (prefers-reduced-motion: reduce) { .ov-pill-animated { animation: none !important; } }
      `}</style>

      <button
        ref={pillRef}
        className="ov-pill-animated"
        data-overlay-pill=""
        style={pillStyle}
        aria-pressed={overlayOn}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Persona menu — ${pillLabel}`}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <Avatar slug={persona} size={18} />
        <span>{pillLabel}</span>
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          data-overlay-pill=""
          aria-label="Overlay and persona settings"
          style={menuStyle}
          onKeyDown={handleMenuKeyDown}
        >
          {/* Toggle row */}
          <button
            role="menuitemcheckbox"
            aria-checked={overlayOn}
            style={{ ...rowBase, justifyContent: 'space-between', fontSize: 'var(--hrt-size-font-body-md)', fontWeight: 'var(--hrt-font-weight-bold)' }}
            onClick={() => setOverlayOn(!overlayOn)}
          >
            <span>Show metric overlay</span>
            <Switch checked={overlayOn} />
          </button>

          {/* Divider */}
          <hr style={{ height: 1, background: 'var(--hrt-color-border-neutral-extra-subtle)', border: 0, margin: 'var(--hrt-size-spacing-1) 0' }} />

          {/* View as… header */}
          <div
            style={{
              fontSize: 'var(--hrt-size-font-body-xs)',
              fontWeight: 'var(--hrt-font-weight-bold)',
              textTransform: 'uppercase',
              color: 'var(--hrt-color-text-supporting)',
              padding: 'var(--hrt-size-spacing-1)',
            }}
          >
            View as…
          </div>

          {/* Persona rows */}
          {PERSONA_ORDER.map((slug) => {
            const { name, description } = PERSONA_LABELS[slug];
            const isActive = slug === persona;
            return (
              <button
                key={slug}
                role="menuitemradio"
                aria-checked={isActive}
                style={rowBase}
                onClick={() => {
                  setPersona(slug as PersonaSlug);
                  // Menu stays open after persona change (per spec).
                }}
              >
                <Avatar slug={slug} size={32} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--hrt-size-font-body-md)',
                      fontWeight: 'var(--hrt-font-weight-bold)',
                      color: 'var(--hrt-color-text-default)',
                      lineHeight: 1.2,
                    }}
                  >
                    {name}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--hrt-size-font-body-xs)',
                      color: 'var(--hrt-color-text-supporting)',
                      lineHeight: 1.2,
                    }}
                  >
                    {description}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    marginLeft: 'auto',
                    color: 'var(--hrt-color-text-brand)',
                    fontWeight: 'var(--hrt-font-weight-bold)',
                    opacity: isActive ? 1 : 0,
                  }}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
