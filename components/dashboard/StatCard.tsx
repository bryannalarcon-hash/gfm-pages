'use client';
// W4 — Stat Card
// Three big-number cards: NSM, Donate Conversion, Repeat Visits (D7).
// Shows value + week-over-week delta arrow. Click scrolls to tied widget.

import type { StatCardProps } from './types';

export function StatCard({ label, value, wowDeltaPct, anchor, onClick }: StatCardProps) {
  // Blank/placeholder state: no injected delta when the demo data toggle is OFF.
  const hasDelta = wowDeltaPct !== null;
  const isPositive = hasDelta && wowDeltaPct >= 0;
  const arrowChar = isPositive ? '↑' : '↓';
  const deltaColor = isPositive ? '#4a9d44' : '#e03131';
  const deltaAbs = hasDelta ? Math.abs(wowDeltaPct).toFixed(1) : '';

  const ariaLabel = hasDelta
    ? `${label}: ${value}, ${isPositive ? 'up' : 'down'} ${deltaAbs}% week over week. Click to jump to details.`
    : `${label}: no data. Click to jump to details.`;

  return (
    <div
      id={anchor}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => onClick?.(anchor)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(anchor); }}
      style={{
        background: '#fff',
        border: '1px solid var(--hrt-color-border-neutral-extra-subtle, #e8e8e8)',
        borderRadius: 12,
        padding: '20px 24px',
        cursor: 'pointer',
        flex: '1 1 200px',
        minWidth: 0,
        transition: 'box-shadow 0.15s',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px #ffd863';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#6f6f6f',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: '#232323',
          lineHeight: 1.1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      {hasDelta ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 600,
            color: deltaColor,
            background: isPositive ? '#f0faf0' : '#fff5f5',
            borderRadius: 20,
            padding: '2px 10px',
          }}
        >
          <span aria-hidden="true">{arrowChar}</span>
          <span>{deltaAbs}% wow</span>
        </div>
      ) : (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#9e9e9e',
            background: '#f5f5f5',
            borderRadius: 20,
            padding: '2px 10px',
          }}
        >
          No data
        </div>
      )}
    </div>
  );
}
