/**
 * SunLogo — the single GoFundMe brand mark: the rising-sun primitive (the GFM Sun),
 * masked via lib/marks/logoMask. This REPLACES the old cropped-heart logo everywhere a
 * brand lockup renders (UnifiedNav, Footer, and the orphaned GlobalNav/DeckNav) so there
 * is exactly one brand mark across the app (CB-55).
 *
 * Carries data-sun-logo so surfaces/tests can assert the sun (not a heart) is present.
 * No green CTA on white: the mark itself carries the green/gold sunrise accent.
 */
import React from 'react';
import { logoMaskStyle } from '@/lib/marks/logoMask';

interface SunLogoProps {
  /** Square edge of the masked sun in px. */
  size?: number;
  /** Optional CSS gradient for the sun fill (defaults to the sunrise gold→green). */
  background?: string;
}

export function SunLogo({
  size = 22,
  background = 'linear-gradient(160deg, #ffd863 0%, #4a9d44 95%)',
}: SunLogoProps) {
  return (
    <span
      data-sun-logo=""
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'inline-block',
        background,
        ...logoMaskStyle,
      }}
    />
  );
}
