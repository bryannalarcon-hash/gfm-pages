'use client';

/**
 * SunsLegend — animated legend explaining the three action tiers.
 *
 * Guardrails (feature-contribution-board.md §3):
 *  - Color is never the SOLE carrier of meaning — each entry pairs a visual with a text label.
 *  - Static under reducedMotion.
 *  - Tokens only (no hard-coded hex not in the token set).
 *  - No dollar figures.
 *
 * Three entries:
 *  follow → grey sun (static)
 *  share  → colored sun with color-shift + wobble
 *  give   → larger colored sun with bigger wobble
 */

import { logoMaskStyle } from '@/lib/marks/logoMask';

// Animation CSS for legend demos — ported from marks.css
const LEGEND_ANIM_CSS = `
@keyframes legendSunColor {
  0%   { background: linear-gradient(135deg, #acf86c, #4a9d44); }
  33%  { background: linear-gradient(135deg, #a7e3e3, #185b93); }
  66%  { background: linear-gradient(135deg, #ffd863, #f6a93b); }
}
@keyframes legendSunWobble {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.22); }
}
@keyframes legendSunGrad {
  0%   { background: linear-gradient(135deg, #b6ff5c, #0b5d2e); }
  20%  { background: linear-gradient(135deg, #ffd000, #b01509); }
  40%  { background: linear-gradient(135deg, #00e0d0, #0b2c93); }
  60%  { background: linear-gradient(135deg, #ff8be8, #642878); }
  80%  { background: linear-gradient(135deg, #ff7a18, #0b291a); }
}
@keyframes legendSunWobbleBig {
  0%, 100% { transform: scale(1.05); }
  50%       { transform: scale(1.5); }
}
`;

let legendAnimInjected = false;
function ensureLegendAnim(): void {
  if (legendAnimInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.dataset['legendAnim'] = '1';
  el.textContent = LEGEND_ANIM_CSS;
  document.head.appendChild(el);
  legendAnimInjected = true;
}

interface SunsLegendProps {
  reducedMotion?: boolean;
  /** Whether to render inline (flex row) or stacked */
  layout?: 'row' | 'stack';
}

// Sun demo span — a 28px sun with specified animation style
function DemoSun({
  bg,
  animationStyle,
  size = 28,
}: {
  bg: string;
  animationStyle?: React.CSSProperties;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        background: bg,
        ...logoMaskStyle,
        ...animationStyle,
      }}
    />
  );
}

export function SunsLegend({ reducedMotion = false, layout = 'row' }: SunsLegendProps) {
  // Inject animation CSS on first client render
  if (typeof window !== 'undefined') {
    ensureLegendAnim();
  }

  const shareAnim: React.CSSProperties = reducedMotion
    ? {}
    : {
        animation:
          'legendSunColor 6s steps(1,end) infinite, legendSunWobble 2.2s ease-in-out infinite',
      };

  const giveAnim: React.CSSProperties = reducedMotion
    ? {}
    : {
        animation:
          'legendSunGrad 5s steps(1,end) infinite, legendSunWobbleBig 2.6s ease-in-out infinite',
      };

  const entries = [
    {
      key: 'follow',
      sun: (
        <DemoSun
          bg="var(--hrt-color-border-neutral)"
          size={22}
        />
      ),
      label: 'Follow',
      description: 'Places your sun · uncoloured',
    },
    {
      key: 'share',
      sun: (
        <DemoSun
          bg="linear-gradient(135deg, #acf86c, #4a9d44)"
          size={28}
          animationStyle={shareAnim}
        />
      ),
      label: 'Share',
      description: 'Unlocks colour · sun shifts with your reach',
    },
    {
      key: 'give',
      sun: (
        <DemoSun
          bg="linear-gradient(135deg, #b6ff5c, #0b5d2e)"
          size={36}
          animationStyle={giveAnim}
        />
      ),
      label: 'Give',
      description: 'Grows your sun · bolder the more you give',
    },
  ];

  // CB-33: legend is single-axis only — no flexWrap. The mock (mocks/community-v4.2.html
  // §board__legend) renders legend items as a horizontal <span> row with no wrap.
  // Both 'row' and 'stack' layouts must be single-axis: 'row' → horizontal, 'stack' → vertical.
  return (
    <div
      aria-label="How marks work: follow places a grey sun, sharing unlocks colour, giving grows it"
      style={{
        display: 'flex',
        flexDirection: layout === 'stack' ? 'column' : 'row',
        gap: 'var(--hrt-size-spacing-2)',
      }}
    >
      {entries.map(({ key, sun, label, description }) => (
        <span
          key={key}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 'var(--hrt-size-font-body-xs)',
            color: 'var(--hrt-color-text-supporting)',
          }}
        >
          {/* Visual: the animated demo sun — aria-hidden, the text label carries meaning */}
          {sun}
          {/* Text: label is always present, color is NOT the sole carrier */}
          <span>
            <strong
              style={{
                color: 'var(--hrt-color-text-default)',
                fontWeight: 700,
              }}
            >
              {label}
            </strong>{' '}
            — {description}
          </span>
        </span>
      ))}
    </div>
  );
}
