// The mark + board model — Suns contribution board S1–S5. architecture.md §4.8,
// feature-contribution-board.md. No dollar figures are ever rendered; size is recognition.
import type { ShareChannel } from '@/lib/types';

export type SunAction = 'follow' | 'share' | 'give';

export type SunGradient =
  | 'grey' // follow-only (uncoloured presence)
  | 'gold'
  | 'teal'
  | 'violet'
  | 'brand'; // curated key-gradients (S1/S4) — NO free hex picker

export interface SunMark {
  id: string;
  ownerToken: string; // pseudonymous; real name only with consent (S4)
  displayName: string | null; // non-null ONLY if the owner opted in
  actions: SunAction[]; // which of follow/share/give earned it
  gradient: SunGradient; // share unlocks colour; follow-only = 'grey'
  sizeScore: number; // derived sublinear(ownUsd + inheritedUsd) + floor; recomputed on refund
  isOwn?: boolean; // viewer's own sun → ringed "Your sun" (S4)
  isSharer?: boolean; // arrived via this sun's share link → "X shared this" (S3)
}

// SSR'd so placement causes ZERO CLS (no scrollHeight probe). density + sizeContrast are
// design CONSTANTS; fundedPct is the campaign's REAL progress and scales size/crowding,
// NEVER emptiness — the gutter is always full (cold-start safe).
export interface BoardSeed {
  marks: SunMark[];
  fundedPct: number; // 0..1 — real raised/goal
  density: number; // const 0.74
  sizeContrast: number; // const 1
}

export interface PlacedSun {
  mark: SunMark;
  x: number;
  y: number;
  r: number;
}

// Curated key-gradient stop sets (tokens only — gfm-design-system.md). NO free hex wheel.
export const SUN_GRADIENTS: Record<SunGradient, { from: string; to: string }> = {
  grey: { from: '#d8d8d8', to: '#b7b7b6' },
  gold: { from: '#ffd863', to: '#68570d' },
  teal: { from: '#a7e3e3', to: '#1c456b' },
  violet: { from: '#eccff6', to: '#642878' },
  brand: { from: '#acf86c', to: '#4a9d44' },
};

export const BOARD_DENSITY = 0.74;
export const BOARD_SIZE_CONTRAST = 1;

// CB-12: Community gutters use a lighter density than the fundraiser to match
// mocks/community-v4.2.html — less overlap/clutter while remaining never-empty.
// Range 0.3–0.74; the engine always fills the full gutter regardless of density value.
// 0.38 produces a ~2× increase in row gaps vs the fundraiser default (0.74), matching
// the mock's airy look at 1440px viewport.
export const COMMUNITY_DENSITY = 0.38;

// component prop contracts (components/marks/*)
export interface SunsLayerProps {
  seed: BoardSeed;
  reducedMotion: boolean;
  /**
   * True total supporters on this board (the unbounded COUNT of sun_mark rows),
   * used ONLY for the "N supporters have left their mark" legend text. `seed.marks`
   * is bounded (getBoardSeed LIMIT) for SSR payload, so its length is NOT the true
   * count — fall back to it only when this is omitted (cold-start / profile).
   */
  supporterCount?: number;
  /**
   * CB-93: optional CONTROLLED funded% override (0–1). When provided, the demo funding
   * control drives this (lifted to a parent) instead of SunsLayer's internal state, so the
   * parent (e.g. FundraiserPage) can sync the on-page progress bar with the suns. `null`
   * means "no override → use seed.fundedPct". Omit entirely on pages with no shared bar
   * (community/profile) → SunsLayer falls back to its own local state.
   */
  fundedPctOverride?: number | null;
  onFundedPctChange?: (pct: number) => void;
}

export interface SunCreateModalProps {
  unlockedBy: SunAction[]; // [] → button DISABLED (greyed-until-unlocked guardrail)
  onCommit: (g: SunGradient, consentName: boolean) => void;
}

export interface GrewRibbonProps {
  reach: number; // S5 "your share reached N" — NO donor id, NO dollar
}

export interface MintShareInput {
  entityType: 'fundraiser' | 'community' | 'profile';
  entityId: string;
  sharerToken: string;
  channel: ShareChannel;
}
