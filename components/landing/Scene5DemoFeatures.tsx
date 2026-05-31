/**
 * Scene 5 — The Demo Features
 * Metric overlay + persona switcher + before/after toggle explanation.
 * Server component.
 */

import React from 'react';

/**
 * CB-28: Per-page overlay highlight region counts, reconciled against the
 * actual instrumented regions in each page's component tree.
 *
 * Counting method: all <Instrumented> wrappings + direct [data-overlay-tier]
 * elements that render in overlay mode for a non-owner visitor with fixture data.
 * Excludes bars/navs (CB-35). Includes PostDonate screen (demo-navigable).
 *
 * CB-68: these are the ACTUAL highlight boxes rendered in overlay mode for a default
 * anonymous visitor (measured live after the display:contents rect fix). The prior
 * 22/12/11 assumed every Instrumented region highlighted — but display:contents wrappers
 * had no box and were skipped; and the 5 PostDonate regions are hidden until after a
 * donation, so they're not in the default count. Numbers now equal what a viewer counts.
 */
export const OVERLAY_REGION_COUNTS: Record<'fundraiser' | 'community' | 'profile', number> = {
  fundraiser: 19,
  community: 14,
  profile: 12,
};

const PERSONAS = [
  {
    label: 'Anonymous',
    initial: '?',
    bg: '#f5f5f5',
    color: '#6f6f6f',
    border: '1px solid #b7b7b6',
  },
  {
    label: 'Close friend',
    initial: 'F',
    bg: '#ffd863',
    color: '#68570d',
    border: 'none',
  },
  {
    label: 'Extrovert',
    initial: 'E',
    bg: '#ccf88e',
    color: '#274a34',
    border: 'none',
  },
  {
    label: 'Shared by',
    initial: 'S',
    bg: '#f5f5f5',
    color: '#6f6f6f',
    border: '1px solid #4a9d44',
  },
  {
    label: 'Lapsed',
    initial: 'L',
    bg: '#e9fcce',
    color: '#274a34',
    border: 'none',
  },
  {
    label: 'Organizer',
    initial: 'O',
    bg: '#232323',
    color: '#fff',
    border: 'none',
  },
];

export function Scene5DemoFeatures() {
  return (
    <section
      id="scene-5"
      aria-label="Scene 5: Demo Features"
      style={{
        minHeight: '100dvh',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '6rem 1.5rem',
        scrollSnapAlign: 'start',
      }}
    >
      <div style={{ maxWidth: '800px', width: '100%' }}>
        {/* Eyebrow */}
        <p
          style={{
            fontSize: '0.75rem',
            color: '#4a9d44',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: '0 0 1rem',
          }}
        >
          Demo Features
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: 'var(--hrt-font-family)',
            fontSize: 'var(--hrt-size-font-display-sm)',
            fontWeight: 700,
            color: '#232323',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: '0 0 2rem',
          }}
        >
          Two features that make this a teaching artifact.
        </h2>

        {/* Feature cards row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Feature card 1 — Metric Overlay */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #efefef',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0px 2px 6px #0000001a',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <span
              style={{
                fontSize: 'var(--hrt-size-font-display-md)',
                fontWeight: 700,
                color: '#ccf88e',
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              1
            </span>

            <div>
              <h3
                style={{
                  fontFamily: 'var(--hrt-font-family)',
                  fontSize: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)',
                  fontWeight: 700,
                  color: '#232323',
                  margin: '0 0 0.75rem',
                  lineHeight: 1.2,
                }}
              >
                The Metric Overlay
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6f6f6f', lineHeight: 1.6, margin: '0 0 1rem' }}>
                An instrumentation layer makes every UI element annotatable. Toggle the pill —
                each instrumented surface reveals its event, metric, and the research that backs the choice.
              </p>

              {/* Per-page overlay region counts — CB-28 reconciled against actual data-overlay-* regions */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.75rem',
                }}
                aria-label="Overlay regions per page"
              >
                {[
                  { page: 'Fundraiser', count: OVERLAY_REGION_COUNTS.fundraiser },
                  { page: 'Community', count: OVERLAY_REGION_COUNTS.community },
                  { page: 'Profile', count: OVERLAY_REGION_COUNTS.profile },
                ].map(({ page, count }) => (
                  <span
                    key={page}
                    style={{
                      background: '#f5f5f5',
                      border: '1px solid #efefef',
                      borderRadius: '624.9375rem',
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      color: '#232323',
                      fontFamily: 'var(--hrt-font-family)',
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <strong style={{ fontWeight: 700 }}>{count}</strong>
                    {' '}regions · {page}
                  </span>
                ))}
              </div>
            </div>

            {/* Overlay example snippet */}
            <div
              style={{
                background: '#f5f5f5',
                borderRadius: '1rem',
                padding: '1rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--hrt-font-family-mono)',
                color: '#6f6f6f',
                lineHeight: 1.6,
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#232323',
                    color: '#fff',
                    borderRadius: '624.9375rem',
                    padding: '4px 14px',
                    fontFamily: 'var(--hrt-font-family)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                  }}
                >
                  Donate $50
                </span>
                <span style={{ margin: '0 0.375rem', outline: '2px solid #ffd863', borderRadius: '4px' }} />
              </div>
              <div>
                <strong style={{ color: '#232323' }}>Event:</strong> Donate Completed
              </div>
              <div>
                <strong style={{ color: '#232323' }}>Tier:</strong> Core Conversion
              </div>
              <div>
                <strong style={{ color: '#232323' }}>Why:</strong> fewer fields → +39% completion
              </div>
            </div>

            {/* Tier swatches */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.75rem',
                color: '#6f6f6f',
                alignItems: 'center',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ffd863',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                Core conversion
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#4a9d44',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                Loop / retain
              </span>
            </div>
          </div>

          {/* Feature card A2 — Persona Switcher */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #efefef',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0px 2px 6px #0000001a',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <span
              style={{
                fontSize: 'var(--hrt-size-font-display-md)',
                fontWeight: 700,
                color: '#ccf88e',
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              2
            </span>

            <div>
              <h3
                style={{
                  fontFamily: 'var(--hrt-font-family)',
                  fontSize: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)',
                  fontWeight: 700,
                  color: '#232323',
                  margin: '0 0 0.75rem',
                  lineHeight: 1.2,
                }}
              >
                The Persona Switcher
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6f6f6f', lineHeight: 1.6, margin: '0 0 1rem' }}>
                The overlay pill expands into a menu with 6 personas. Switching the active persona
                re-renders every personalization slot — welcome banner, smart presets, "what you
                missed" feed, people you may know panel, recurring nudge — without changing layout.
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6f6f6f', lineHeight: 1.6, margin: 0 }}>
                Same page. Same overlay annotations. Completely different content.
              </p>
            </div>

            {/* Persona avatar row */}
            <div
              aria-label="Available personas"
              style={{
                display: 'flex',
                gap: '0.75rem',
                overflowX: 'auto',
                paddingBottom: '0.25rem',
                scrollSnapType: 'x mandatory',
              }}
            >
              {PERSONAS.map((p) => (
                <div
                  key={p.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                  }}
                >
                  <span
                    aria-label={p.label}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: p.bg,
                      color: p.color,
                      border: p.border,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}
                  >
                    {p.initial}
                  </span>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      color: '#6f6f6f',
                      textAlign: 'center',
                      maxWidth: '44px',
                      lineHeight: 1.2,
                    }}
                  >
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature card B — Before/After toggle */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #efefef',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0px 2px 6px #0000001a',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--hrt-font-family)',
              fontSize: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)',
              fontWeight: 700,
              color: '#232323',
              margin: '0 0 0.75rem',
              lineHeight: 1.2,
            }}
          >
            Before / After Toggle
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6f6f6f', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
            A toggle on each page switches in-place between the current GFM layout and our redesign.
            The difference is visible without navigating away.
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6f6f6f', lineHeight: 1.6, margin: 0 }}>
            Sub-toggle on Fundraiser: &ldquo;Show personalized share copy&rdquo; — switches between generic
            and AI-generated text so the per-channel copy improvement is immediately visible.
          </p>
        </div>
      </div>
    </section>
  );
}
