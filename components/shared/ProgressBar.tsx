/**
 * ProgressBar — fundraiser goal bar.
 * Server component: numbers are locale-formatted at render time (no CLS).
 * At >=80% progress a subtle near-goal emphasis is applied.
 */

import React from 'react';

export interface ProgressBarProps {
  raisedUsd: number;
  goalUsd: number;
  showLabels?: boolean;
  className?: string;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPct(pct: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(pct);
}

export function ProgressBar({ raisedUsd, goalUsd, showLabels = true, className }: ProgressBarProps) {
  const rawPct = goalUsd > 0 ? raisedUsd / goalUsd : 0;
  const pct = Math.min(1, Math.max(0, rawPct));
  const pctDisplay = Math.round(pct * 100);
  const nearGoal = pct >= 0.8;

  return (
    <div className={className}>
      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={pctDisplay}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${formatPct(pct)} of goal raised`}
        className="h-[var(--hrt-size-spacing-1)] rounded-full bg-[var(--hrt-color-surface-unfilled-subtle)] overflow-hidden"
      >
        {/* Fill */}
        <div
          className="h-full rounded-full transition-[width] duration-[var(--hrt-time-transition)] ease-[var(--hrt-ease-default)]"
          style={{
            width: `${pctDisplay}%`,
            background: 'var(--hrt-gradient-progress-linear)',
          }}
        />
      </div>

      {showLabels && (
        <div
          className={[
            'mt-[0.375rem] flex items-baseline gap-[var(--hrt-size-spacing-1)] flex-wrap',
            'text-body-sm font-bold text-[var(--hrt-color-text-default)]',
          ].join(' ')}
        >
          <span>
            {formatUsd(raisedUsd)}{' '}
            <span className="font-regular text-[var(--hrt-color-text-supporting)]">raised</span>
          </span>
          <span className="text-[var(--hrt-color-text-supporting)] font-regular">of {formatUsd(goalUsd)}</span>
          {nearGoal && (
            <span
              className="text-[var(--hrt-color-text-positive)] font-bold"
              aria-label="nearly funded"
            >
              {formatPct(pct)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
