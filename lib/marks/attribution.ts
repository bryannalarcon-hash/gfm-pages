// S3 single-touch share→sun attribution. architecture.md §4.8.
// Mints a pseudonymous share_id that rides the share link; a later Donate Completed records
// the attributed share/sharer, and 50% of that donation rolls up into the sharer's sun size.
// No multi-hop / viral-tree credit. Settled-only (a refund shrinks it via recompute).
import type { MintShareInput } from '@/lib/marks/types';
import type { ShareChannel } from '@/lib/types';

// recomputeSunSize lives in the engine (shared with packing); re-exported here so the
// attribution seam exposes it per the §4.8 contract.
export { recomputeSunSize } from '@/lib/marks/engine';

const SHARE_ID_PREFIX = 'shr_';

/** Mint a unique, pseudonymous share id. Carries no PII — only a sharer_token. */
export function mintShareId(_input: MintShareInput): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.abs(hashStr(JSON.stringify(_input) + String(performance.now?.() ?? ''))).toString(36);
  return SHARE_ID_PREFIX + uuid.replace(/-/g, '');
}

export interface BuildShareUrlInput {
  /** Relative path of the shareable page, e.g. "/communities/watch-duty" */
  basePath: string;
  /** Freshly-minted share id from mintShareId */
  shareId: string;
  /** Share channel — written as utm_share_source for analytics attribution */
  channel: ShareChannel;
}

/**
 * Build an attributed share URL carrying the share_id + utm_share_* params.
 * Shape mirrors the wildfire fundraiser pattern:
 *   <basePath>?utm_share_source=<channel>&utm_share_user=<shareId>&share_id=<shareId>
 *
 * The URL is relative (no origin) so it works on any host without SSR access to
 * window.location. Callers may prepend window.location.origin if an absolute URL is needed.
 */
export function buildAttributedShareUrl({ basePath, shareId, channel }: BuildShareUrlInput): string {
  const params = new URLSearchParams({
    utm_share_source: channel,
    utm_share_user: shareId,
    share_id: shareId,
  });
  return `${basePath}?${params.toString()}`;
}

/** Single-touch rollup: a sharer inherits exactly 50% of donations attributed to their share. */
export const INHERIT_RATE = 0.5;

export function inheritedFromAttributions(attributedAmounts: number[]): number {
  const total = attributedAmounts.reduce((s, a) => s + Math.max(0, a), 0);
  return Math.round(total * INHERIT_RATE);
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
