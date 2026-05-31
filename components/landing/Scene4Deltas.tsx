/**
 * Scene 4 — The Redesign Deltas (33 total)
 * Metric tree mini + three-page summary cards + five star bets.
 *
 * CONSTRAINT: zero internal index IDs (no D# / C# / P# / S# in rendered text).
 * Every delta is named by its feature name only.
 */

import React from 'react';

// ── Fundraiser deltas (12) ─────────────────────────────────────────────────
const FUNDRAISER_DELTAS = [
  { name: 'Single-screen donation form', metric: 'Donate Completed', tier: 1 },
  { name: 'Goal-gradient intensification (final 15–20%)', metric: 'Donate Intent', tier: 1 },
  { name: 'Post-donate as a first-class screen', metric: 'Post Donate actions', tier: 1 },
  { name: 'Per-channel share at emotional / milestone beats', metric: 'Share Clicked', tier: 2 },
  { name: 'Follow first-class on fundraiser page', metric: 'Follow Clicked', tier: 2 },
  { name: 'Donation-list momentum prompt', metric: 'Donor-list → Donate', tier: 1 },
  { name: 'Performance baseline — Core Web Vitals', metric: 'LCP / INP / CLS', tier: 0 },
  { name: 'Returning-visitor recognition banner', metric: 'Story Scrolled (returners)', tier: 2 },
  { name: 'AI-generated per-channel share copy', metric: 'Share Clicked → K-factor', tier: 2 },
  { name: 'Smart donation amount presets', metric: 'Donate Completed + avg gift', tier: 1 },
  { name: 'Inline recurring nudge on donate form', metric: 'Recurring Donate Completed', tier: 1 },
  { name: 'LLM-generated update summaries for returning visitors', metric: 'Banner CTR → Story Scrolled', tier: 2 },
];

// ── Community deltas (7) ───────────────────────────────────────────────────
const COMMUNITY_DELTAS = [
  { name: 'Follow CTA — first-class with value prop and milestone gamification', metric: 'Community Followed', tier: 2 },
  { name: 'Activity feed — "Since your last visit" divider + reactions prominence', metric: 'Activity Feed Engaged', tier: 2 },
  { name: 'PYMK module in activity feed with inline Follow prompt', metric: 'PYMK Follow Clicked', tier: 2 },
  { name: 'Leaderboard momentum prompt', metric: 'Leaderboard Fundraiser Clicked', tier: 1 },
  { name: 'Fundraiser filters activated + "From causes you follow" section', metric: 'Fundraiser Card Clicked', tier: 1 },
  { name: 'AI-generated per-channel share copy at community level', metric: 'Community Share Clicked', tier: 2 },
  { name: 'Performance baseline — community page Core Web Vitals', metric: 'LCP / INP / CLS', tier: 0 },
];

// ── Profile deltas (9) ────────────────────────────────────────────────────
const PROFILE_DELTAS = [
  { name: 'Follow button + value-prop microcopy (first-class)', metric: 'Follow Clicked', tier: 2 },
  { name: '"What you missed" activity feed for followers — and weekly digest', metric: 'Digest Email Click-Through', tier: 2 },
  { name: 'Cause pills in hero + complete-profile nudge', metric: 'Follow Clicked (viewer side)', tier: 1 },
  { name: 'PYMK panel — ranked by social graph proximity', metric: 'PYMK Follow Clicked', tier: 2 },
  { name: 'Fundraiser carousel — raised/goal state enrichment', metric: 'Fundraiser Card Clicked', tier: 1 },
  { name: 'Repeat-organizer identity badge', metric: 'Donate Completed (from profile traffic)', tier: 2 },
  { name: 'Performance baseline — profile page Core Web Vitals', metric: 'LCP / INP / CLS', tier: 0 },
  { name: 'Profile share — per-channel with AI copy', metric: 'Profile Share Clicked', tier: 2 },
  { name: 'Recurring-donation surfacing for repeat donors', metric: 'Recurring Donate Completed', tier: 1 },
];

// ── Suns / Contribution Board deltas (5) ─────────────────────────────────
const SUNS_DELTAS = [
  { name: 'Contribution board — marks, collective scene, action ladder', metric: 'Mark Created', tier: 2 },
  { name: 'Mark color unlocked by sharing', metric: 'Mark Customized', tier: 2 },
  { name: 'Mark size from donation + sharer inheritance', metric: 'Mark Grew', tier: 1 },
  { name: 'Board placement across Fundraiser, Community, and Profile', metric: 'Section Viewed', tier: 2 },
  { name: 'Identity-level single-touch referral attribution via boards', metric: 'Mark Shared → attributed Donate', tier: 2 },
];

const STAR_BETS = [
  { text: 'Follow first-class — 2× visit frequency', metric: 'Repeat Visits' },
  { text: 'Share at emotional/milestone beats, per-channel', metric: 'Share Rate' },
  { text: 'Post-donate as a second conversion surface', metric: 'Donate Completed' },
  { text: 'Sub-2.5s LCP non-negotiable (+8–21% conversion)', metric: 'LCP guardrail' },
  { text: 'Instrument rates, not pageviews', metric: 'Measurement discipline' },
];

function TierBadge({ tier }: { tier: number }) {
  if (tier === 0) return null;
  const style = tier === 1
    ? { background: '#ffd863', color: '#68570d' }
    : { background: '#ccf88e', color: '#274a34' };
  const label = tier === 1 ? 'Core conversion' : 'Loop / retention';
  return (
    <span
      style={{
        ...style,
        borderRadius: '624.9375rem',
        padding: '2px 8px',
        fontSize: '0.6875rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function DeltaGroup({
  title,
  count,
  deltas,
}: {
  title: string;
  count: number;
  deltas: { name: string; metric: string; tier: number }[];
}) {
  return (
    <details
      style={{
        background: '#fff',
        border: '1px solid #efefef',
        borderRadius: '1.25rem',
        padding: '1.25rem 1.5rem',
        boxShadow: '0px 1px 2px #0000001a',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          listStyle: 'none',
          userSelect: 'none',
        }}
      >
        <span style={{ fontWeight: 700, color: '#232323', fontSize: '1rem' }}>{title}</span>
        <span
          style={{
            fontSize: 'var(--hrt-size-font-display-sm)',
            fontWeight: 700,
            color: '#232323',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {count}
          <span
            style={{
              fontSize: '0.75rem',
              color: '#6f6f6f',
              fontWeight: 400,
              marginLeft: '0.25rem',
            }}
          >
            changes
          </span>
        </span>
      </summary>

      <ul
        style={{
          margin: '1rem 0 0',
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
        }}
      >
        {deltas.map((d) => (
          <li
            key={d.name}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '0.875rem',
              color: '#232323',
              lineHeight: 1.4,
            }}
          >
            <span
              style={{
                color: '#4a9d44',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '0.05em',
              }}
            >
              ·
            </span>
            <span style={{ flex: 1 }}>{d.name}</span>
            <TierBadge tier={d.tier} />
          </li>
        ))}
      </ul>
    </details>
  );
}

export function Scene4Deltas() {
  return (
    <section
      id="scene-4"
      aria-label="Scene 4: The 33 Redesign Deltas"
      style={{
        minHeight: '100dvh',
        background: '#fff',
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
          The Redesign
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
            margin: '0 0 1rem',
          }}
        >
          33 changes. One loop.
        </h2>

        {/* Metric tree mini */}
        <div
          aria-label="Metric tree"
          style={{
            background: '#f5f5f5',
            borderRadius: '1.25rem',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: '#6f6f6f', margin: '0 0 0.75rem', fontWeight: 700 }}>
            North Star
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span
              style={{
                background: '#ffd863',
                color: '#68570d',
                borderRadius: '624.9375rem',
                padding: '4px 16px',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              Meaningful sessions / user / week
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6f6f6f', margin: '0 0 0.5rem', fontWeight: 700 }}>
            Output metrics
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['Donate Conversion', 'Share Rate', 'Follow Rate', 'Repeat Visits'].map((m) => (
              <span
                key={m}
                style={{
                  background: '#ccf88e',
                  color: '#274a34',
                  borderRadius: '624.9375rem',
                  padding: '4px 16px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Three-page + Suns summary rows (expandable) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <DeltaGroup title="Fundraiser page" count={12} deltas={FUNDRAISER_DELTAS} />
          <DeltaGroup title="Community page" count={7} deltas={COMMUNITY_DELTAS} />
          <DeltaGroup title="Profile page" count={9} deltas={PROFILE_DELTAS} />
          <DeltaGroup title="Contribution Board — cross-page" count={5} deltas={SUNS_DELTAS} />
        </div>

        {/* Five star bets */}
        <div
          style={{
            background: '#f5f5f5',
            borderRadius: '1.5rem',
            padding: '1.5rem 1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <p
            style={{
              fontSize: '0.75rem',
              color: '#6f6f6f',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0 0 1rem',
            }}
          >
            Five highest-confidence bets
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {STAR_BETS.map((bet) => (
              <li
                key={bet.text}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  fontSize: '1rem',
                  color: '#232323',
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{ color: '#ffd863', fontSize: '1.125rem', flexShrink: 0, marginTop: '-0.05em' }}
                  aria-hidden="true"
                >
                  ★
                </span>
                <span>{bet.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Differentiator note */}
        <p
          style={{
            fontSize: '0.875rem',
            color: '#6f6f6f',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Visual identity: inherited from GFM. Differentiation: information architecture +
          instrumentation + personalization.
        </p>
      </div>
    </section>
  );
}
