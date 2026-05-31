'use client';
// MetricBlob — floating popover / bottom-sheet showing instrumentation detail.
// design-overlay.md — "The metric blob (popover)" section.
//
// Prev/next stepping across highlights is driven by OverlayLayer.
// MetricBlob itself dispatches a CustomEvent 'overlay-step' with detail { direction: 'prev'|'next' }
// which OverlayLayer listens for (see OverlayLayer.tsx). This keeps MetricBlobProps frozen while
// still giving the blob-internal ◂ ▸ controls meaningful wiring.
//
// The raw delta id (data-overlay-delta) is NEVER rendered as visible text.
// Ticker path renders TickerEvent fields; overlay path renders attrs.
import { useEffect, useRef } from 'react';
import type { MetricBlobProps } from '@/lib/overlay/types';
import { PERSONA_LABELS, PERSONAS } from '@/fixtures/personas';
import type { PersonaSlug } from '@/lib/personas/types';

// Tier badge — warm for tier 1, green for tier 2.
function TierBadge({ tier }: { tier: string }): JSX.Element {
  const isTier1 = tier === '1';
  return (
    <span
      style={{
        fontSize: 'var(--hrt-size-font-body-xs)',
        fontWeight: 'var(--hrt-font-weight-bold)',
        padding: '2px var(--hrt-size-spacing-1)',
        borderRadius: 'var(--hrt-size-radius-full)',
        background: isTier1
          ? 'var(--hrt-color-surface-tip-medium)'
          : 'var(--hrt-color-surface-brand-medium)',
        color: isTier1
          ? 'var(--hrt-color-text-tip)'
          : 'var(--hrt-color-text-brand-strong)',
        flexShrink: 0,
      }}
    >
      {isTier1 ? 'Tier 1 · Core conversion' : 'Tier 2 · Loop / retention'}
    </span>
  );
}

// EventName chip.
function EventChip({ name }: { name: string }): JSX.Element {
  return (
    <span
      style={{
        fontFamily: 'var(--hrt-font-family-mono)',
        fontSize: 'var(--hrt-size-font-body-xs)',
        background: 'var(--hrt-color-surface-neutral-subtle)',
        color: 'var(--hrt-color-text-default)',
        padding: '2px 6px',
        borderRadius: 'var(--hrt-size-radius-sm)',
      }}
    >
      {name}
    </span>
  );
}

// Dispatch step direction to OverlayLayer.
function dispatchStep(direction: 'prev' | 'next'): void {
  window.dispatchEvent(new CustomEvent('overlay-step', { detail: { direction } }));
}

export function MetricBlob({ source, onClose }: MetricBlobProps): JSX.Element {
  const trapRef = useRef<HTMLDivElement>(null);

  // Focus trap: keep focus inside the card.
  useEffect(() => {
    const el = trapRef.current;
    if (!el) return;
    // Focus the close button on mount.
    const firstFocusable = el.querySelector<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        el!.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((n) => !n.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Shared card style — fixed, positioned by OverlayLayer on desktop; CSS bottom-sheet on mobile.
  const cardStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1002,
    width: 360,
    maxWidth: 'calc(100vw - var(--hrt-size-spacing-4))',
    background: '#fff',
    borderRadius: 'var(--hrt-size-radius-xl)',
    boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
    padding: 'var(--hrt-size-spacing-3)',
    // Mobile bottom-sheet overrides via a global CSS class applied below;
    // we also set inline bottom here for mobile fallback.
  };

  const closeBtn: React.CSSProperties = {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: 'var(--hrt-color-text-supporting)',
    fontSize: 18,
    lineHeight: 1,
    padding: 4,
    cursor: 'pointer',
    flexShrink: 0,
  };

  const navBtn: React.CSSProperties = {
    background: 'var(--hrt-color-surface-neutral-subtle)',
    border: 'none',
    borderRadius: 'var(--hrt-size-radius-full)',
    width: 32,
    height: 32,
    color: 'var(--hrt-color-text-default)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .ov-blob-card {
            left: var(--hrt-size-spacing-2) !important;
            right: var(--hrt-size-spacing-2) !important;
            top: auto !important;
            bottom: calc(var(--hrt-size-spacing-10) + env(safe-area-inset-bottom)) !important;
            width: auto !important;
          }
        }
      `}</style>

      <div
        ref={trapRef}
        className="ov-blob-card"
        role="dialog"
        aria-modal="true"
        aria-label={
          source.kind === 'overlay'
            ? `Metric details for ${source.regionLabel}`
            : `Event: ${source.event.event}`
        }
        style={cardStyle}
      >
        {source.kind === 'overlay' && (() => {
          const { attrs, regionLabel } = source;
          const events = (attrs['data-overlay-events'] ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          const tier = attrs['data-overlay-tier'];
          const metric = attrs['data-overlay-metric'];
          const why = attrs['data-overlay-why'];
          const dashAnchor = attrs['data-overlay-dashboard'];

          return (
            <>
              {/* Top row: tier badge + close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--hrt-size-spacing-1)', marginBottom: 'var(--hrt-size-spacing-1)' }}>
                <TierBadge tier={tier} />
                <button
                  style={closeBtn}
                  onClick={onClose}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Event chips */}
              {events.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--hrt-size-spacing-half)', marginBottom: 'var(--hrt-size-spacing-2)' }}>
                  {events.map((ev) => (
                    <EventChip key={ev} name={ev} />
                  ))}
                </div>
              )}

              {/* Metric heading */}
              <h3
                style={{
                  fontSize: 'var(--hrt-size-font-body-md)',
                  fontWeight: 'var(--hrt-font-weight-bold)',
                  margin: `0 0 var(--hrt-size-spacing-1)`,
                  color: 'var(--hrt-color-text-default)',
                }}
              >
                {metric}
              </h3>

              {/* Why */}
              <p
                style={{
                  fontSize: 'var(--hrt-size-font-body-sm)',
                  color: 'var(--hrt-color-text-strong)',
                  margin: `0 0 var(--hrt-size-spacing-2)`,
                }}
              >
                {why}
              </p>

              {/* Dashboard link */}
              <a
                href={`/dashboard#${dashAnchor}`}
                style={{
                  fontSize: 'var(--hrt-size-font-body-sm)',
                  color: 'var(--hrt-color-text-brand)',
                  fontWeight: 'var(--hrt-font-weight-bold)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  textDecoration: 'none',
                }}
              >
                See this on the dashboard →
              </a>

              {/* Nav row: prev / next step dispatched via CustomEvent to OverlayLayer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--hrt-size-spacing-1)',
                  marginTop: 'var(--hrt-size-spacing-2)',
                  paddingTop: 'var(--hrt-size-spacing-2)',
                  borderTop: '1px solid var(--hrt-color-border-neutral-extra-subtle)',
                }}
              >
                <button
                  style={navBtn}
                  aria-label="Previous highlight"
                  onClick={() => dispatchStep('prev')}
                >
                  ◂
                </button>
                <button
                  style={navBtn}
                  aria-label="Next highlight"
                  onClick={() => dispatchStep('next')}
                >
                  ▸
                </button>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 'var(--hrt-size-font-body-xs)',
                    color: 'var(--hrt-color-text-supporting)',
                  }}
                >
                  {regionLabel}
                </span>
              </div>
            </>
          );
        })()}

        {source.kind === 'ticker' && (() => {
          const { event: ev } = source;
          const personaLabel = PERSONA_LABELS[ev.persona];
          const personaFixture = personaLabel
            ? personaLabel.name
            : ev.persona;

          // Persona dot color from PERSONAS fixture (imported via PERSONA_LABELS by slug).
          // We need bg for the dot; import PERSONAS for this.
          return (
            <>
              {/* Top row: event name + close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--hrt-size-spacing-1)', marginBottom: 'var(--hrt-size-spacing-1)' }}>
                <EventChip name={ev.event} />
                <button style={closeBtn} onClick={onClose} aria-label="Close">
                  ×
                </button>
              </div>

              {/* Persona row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--hrt-size-spacing-1)',
                  marginBottom: 'var(--hrt-size-spacing-2)',
                }}
              >
                <PersonaDot slug={ev.persona} />
                <span
                  style={{
                    fontSize: 'var(--hrt-size-font-body-sm)',
                    color: 'var(--hrt-color-text-supporting)',
                  }}
                >
                  {personaFixture}
                </span>
              </div>

              {/* Key property */}
              <div style={{ marginBottom: 'var(--hrt-size-spacing-2)' }}>
                <span
                  style={{
                    fontSize: 'var(--hrt-size-font-body-xs)',
                    color: 'var(--hrt-color-text-supporting)',
                    display: 'block',
                  }}
                >
                  {ev.keyProp.label}
                </span>
                <span
                  style={{
                    fontSize: 'var(--hrt-size-font-body-md)',
                    fontWeight: 'var(--hrt-font-weight-bold)',
                    color: 'var(--hrt-color-text-default)',
                  }}
                >
                  {ev.keyProp.value}
                </span>
              </div>

              {/* Timestamp */}
              <time
                dateTime={ev.timestamp}
                style={{
                  fontSize: 'var(--hrt-size-font-body-xs)',
                  color: 'var(--hrt-color-text-supporting)',
                }}
              >
                {new Date(ev.timestamp).toLocaleTimeString()}
              </time>
            </>
          );
        })()}
      </div>
    </>
  );
}

// Small colored persona dot for ticker path.
function PersonaDot({ slug }: { slug: PersonaSlug }): JSX.Element {
  const { bg } = PERSONAS[slug]?.avatar ?? { bg: '#b7b7b6' };
  return (
    <span
      aria-hidden="true"
      style={{
        width: 10,
        height: 10,
        borderRadius: 'var(--hrt-size-radius-full)',
        background: bg,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}
