/**
 * CB-52 + CB-60 — Share-rate slot personalizes per persona; Priya's D8 banner uses
 * real funded % and encouraging copy.
 *
 * CB-52: The share_rate slot must render different content for a sharer persona
 *   (extrovert) vs a sharee persona (shared_by_extro). Structure never changes;
 *   headline/framing adapts. slot is always in DOM (L3.5 never-unmount).
 *
 * CB-60: The returning_lapsed (Priya) banner:
 *   - Shows the ACTUAL funded % passed through page.pageState.raisedPct
 *   - Does NOT contain "haven't been here"
 *   - Is ENCOURAGING
 *   - Other personas' banners are unchanged/collapsed
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { resolveSlot, type SlotContext } from '@/lib/personalization/slots';
import { PERSONAS } from '@/fixtures/personas';
import { SEED_IDS } from '@/db/seed-ids';
import type { PersonaSlug } from '@/lib/personas/types';
import type { PageContext } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

import { ReturningBanner } from '@/components/slots/ReturningBanner';
import { ShareRateSlot } from '@/components/slots/ShareRateSlot';
import { OverlayProvider } from '@/lib/overlay/context';

// ── Seed constants ──────────────────────────────────────────────────────────
const WILDFIRE = SEED_IDS.fundraisers['realtime-alerts-for-wildfire-safety-r5jkk'];

// ── Shared overlay stub ─────────────────────────────────────────────────────
const OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Share Clicked',
  'data-overlay-delta': 'D9',
  'data-overlay-metric': 'share-rate',
  'data-overlay-why': 'test',
  'data-overlay-dashboard': 'share-trends',
};

// ── Context factories ───────────────────────────────────────────────────────

function fundraiserPage(overrides: Partial<PageContext> = {}): PageContext {
  return {
    page: 'fundraiser',
    fundraiserId: WILDFIRE,
    referrerSource: 'direct',
    pageState: { raisedPct: 78, momentum: 'high' },
    ...overrides,
  };
}

function ctx(
  slug: PersonaSlug,
  page: PageContext = fundraiserPage(),
  candidates: SlotContext['candidates'] = {},
): SlotContext {
  return { user: PERSONAS[slug], page, isOwnerView: false, candidates };
}

// ══════════════════════════════════════════════════════════════════════════════
// CB-52 — share_rate slot: sharer vs sharee personalization
// ══════════════════════════════════════════════════════════════════════════════

describe('CB-52 share_rate slot — personalizes on sharer vs sharee persona swap', () => {
  describe('resolveSlot layer — content differs per persona role', () => {
    it('extrovert (sharer persona) → mode is "sharer"', () => {
      const result = resolveSlot('share_rate', ctx('extrovert'));
      expect(result.content.mode).toBe('sharer');
    });

    it('shared_by_extro (sharee persona with utm.share_user) → mode is "sharee"', () => {
      const result = resolveSlot('share_rate', ctx('shared_by_extro'));
      expect(result.content.mode).toBe('sharee');
    });

    it('anonymous (no share context) → mode is "default"', () => {
      const result = resolveSlot('share_rate', ctx('anonymous'));
      expect(result.content.mode).toBe('default');
    });

    it('close_friend (not a sharer or sharee) → mode is "default"', () => {
      const result = resolveSlot('share_rate', ctx('close_friend'));
      expect(result.content.mode).toBe('default');
    });

    it('returning_lapsed → mode is "default"', () => {
      const result = resolveSlot('share_rate', ctx('returning_lapsed'));
      expect(result.content.mode).toBe('default');
    });

    it('profile_owner → mode is "default"', () => {
      const result = resolveSlot('share_rate', ctx('profile_owner'));
      expect(result.content.mode).toBe('default');
    });

    // Core CB-52 regression: sharer ≠ sharee
    it('extrovert (sharer) ≠ shared_by_extro (sharee) — modes must differ', () => {
      const sharerMode = resolveSlot('share_rate', ctx('extrovert')).content.mode;
      const shareeMode = resolveSlot('share_rate', ctx('shared_by_extro')).content.mode;
      expect(sharerMode).not.toBe(shareeMode);
    });

    // sharee carries the referrer name (utm.share_user)
    it('shared_by_extro → sharee result carries referrer attribution', () => {
      const result = resolveSlot('share_rate', ctx('shared_by_extro'));
      expect(result.content.mode).toBe('sharee');
      expect(result.content.referrerName).toBeTruthy();
    });
  });

  describe('render layer — ShareRateSlot component', () => {
    it('slot always rendered in DOM for sharer mode', () => {
      const { container } = render(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'sharer', referrerName: undefined } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(container.querySelector('[data-slot="share_rate"]')).not.toBeNull();
    });

    it('slot always rendered in DOM for sharee mode', () => {
      const { container } = render(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'sharee', referrerName: 'Mike T.' } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(container.querySelector('[data-slot="share_rate"]')).not.toBeNull();
    });

    it('slot always rendered in DOM for default mode', () => {
      const { container } = render(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'default', referrerName: undefined } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(container.querySelector('[data-slot="share_rate"]')).not.toBeNull();
    });

    it('sharer mode shows sharer-framed headline (different from default)', () => {
      const { container: sharerContainer } = render(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'sharer', referrerName: undefined } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      const sharerText = sharerContainer.querySelector('[data-slot="share_rate"]')?.textContent ?? '';

      const { container: defaultContainer } = render(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'default', referrerName: undefined } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      const defaultText = defaultContainer.querySelector('[data-slot="share_rate"]')?.textContent ?? '';

      expect(sharerText).not.toBe(defaultText);
    });

    it('sharee mode with referrer name shows referrer attribution text', () => {
      const { container } = render(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'sharee', referrerName: 'Mike T.' } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(container.textContent).toContain('Mike T.');
    });

    it('switching from default to sharer — slot stays in DOM (never-unmount)', () => {
      const { container, rerender } = render(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'default', referrerName: undefined } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(container.querySelector('[data-slot="share_rate"]')).not.toBeNull();

      rerender(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'sharer', referrerName: undefined } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      // Slot must remain in DOM — never unmount
      expect(container.querySelector('[data-slot="share_rate"]')).not.toBeNull();
    });

    it('switching from sharer to sharee — slot stays in DOM, content changes', () => {
      const { container, rerender } = render(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'sharer', referrerName: undefined } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(container.querySelector('[data-slot="share_rate"]')).not.toBeNull();

      rerender(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'sharee', referrerName: 'Mike T.' } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(container.querySelector('[data-slot="share_rate"]')).not.toBeNull();
      expect(container.textContent).toContain('Mike T.');
    });

    // Guardrail: no internal mode slug in rendered viewer-facing text
    it('mode enum values ("sharer", "sharee", "default") do not appear in rendered text', () => {
      render(
        <OverlayProvider>
          <ShareRateSlot
            data={{ name: 'share_rate', content: { mode: 'sharer', referrerName: undefined } }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(screen.queryByText('sharer')).toBeNull();
      expect(screen.queryByText('sharee')).toBeNull();
      expect(screen.queryByText('default')).toBeNull();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CB-60 — returning_lapsed (Priya) D8 banner: real funded %, encouraging copy
// ══════════════════════════════════════════════════════════════════════════════

describe('CB-60 returning_lapsed D8 banner — real funded %, encouraging copy', () => {
  describe('resolveSlot layer', () => {
    it('returning_lapsed with raisedPct=78 → summaryLine contains "78%"', () => {
      const result = resolveSlot('returning_banner', ctx('returning_lapsed', fundraiserPage({ pageState: { raisedPct: 78 } })));
      expect(result.content).not.toBeNull();
      expect(result.content!.summaryLine).toContain('78%');
    });

    it('returning_lapsed with raisedPct=62 → summaryLine contains "62%" (single-sourced, not hardcoded)', () => {
      const result = resolveSlot('returning_banner', ctx('returning_lapsed', fundraiserPage({ pageState: { raisedPct: 62 } })));
      expect(result.content).not.toBeNull();
      expect(result.content!.summaryLine).toContain('62%');
    });

    it('returning_lapsed with raisedPct as a 0–1 ratio (0.78 = the real app value) → "78%" not "1%" (CB-60 live bug)', () => {
      const result = resolveSlot('returning_banner', ctx('returning_lapsed', fundraiserPage({ pageState: { raisedPct: 0.78 } })));
      expect(result.content!.summaryLine).toContain('78%');
      expect(result.content!.summaryLine).not.toContain('1%');
    });

    it('returning_lapsed with raisedPct=91 → summaryLine contains "91%"', () => {
      const result = resolveSlot('returning_banner', ctx('returning_lapsed', fundraiserPage({ pageState: { raisedPct: 91 } })));
      expect(result.content).not.toBeNull();
      expect(result.content!.summaryLine).toContain('91%');
    });

    it('returning_lapsed banner does NOT contain "haven\'t been here"', () => {
      const result = resolveSlot('returning_banner', ctx('returning_lapsed', fundraiserPage({ pageState: { raisedPct: 78 } })));
      expect(result.content).not.toBeNull();
      expect(result.content!.summaryLine).not.toContain("haven't been here");
    });

    it('returning_lapsed banner is encouraging — contains positive framing', () => {
      const result = resolveSlot('returning_banner', ctx('returning_lapsed', fundraiserPage({ pageState: { raisedPct: 78 } })));
      expect(result.content).not.toBeNull();
      const summary = result.content!.summaryLine.toLowerCase();
      // Must contain some form of encouragement
      const isEncouraging =
        summary.includes('support') ||
        summary.includes('push') ||
        summary.includes('further') ||
        summary.includes('help') ||
        summary.includes('way there') ||
        summary.includes('progress');
      expect(isEncouraging).toBe(true);
    });

    it('returning_lapsed firstName is still "Priya" (persona-specific, unchanged)', () => {
      const result = resolveSlot('returning_banner', ctx('returning_lapsed', fundraiserPage({ pageState: { raisedPct: 78 } })));
      expect(result.content!.firstName).toBe('Priya');
    });

    // Other personas must be unaffected
    it('anonymous → still null (unchanged by CB-60)', () => {
      expect(resolveSlot('returning_banner', ctx('anonymous')).content).toBeNull();
    });

    it('extrovert → still null (unchanged by CB-60)', () => {
      expect(resolveSlot('returning_banner', ctx('extrovert')).content).toBeNull();
    });

    it('shared_by_extro → still null (unchanged by CB-60)', () => {
      expect(resolveSlot('returning_banner', ctx('shared_by_extro')).content).toBeNull();
    });

    it('close_friend with latestUpdateSummary → still uses update-based copy (unchanged by CB-60)', () => {
      const result = resolveSlot('returning_banner', ctx('close_friend', fundraiserPage(), {
        latestUpdateSummary: 'Alert system live in 3 counties',
        organizerName: 'Sarah J.',
      }));
      expect(result.content).not.toBeNull();
      expect(result.content!.summaryLine).toContain('Alert system live');
      // close_friend should NOT get lapsed copy
      expect(result.content!.summaryLine).not.toContain("haven't been here");
    });
  });

  describe('render layer — ReturningBanner with encouraging copy', () => {
    it('Priya banner renders with the actual funded % in the DOM', () => {
      render(
        <OverlayProvider>
          <ReturningBanner
            data={{
              name: 'returning_banner',
              content: {
                firstName: 'Priya',
                summaryLine: 'This fundraiser is now 78% of the way there. Your support could push it further.',
                href: '#updates',
              },
            }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(screen.getByText(/Welcome back, Priya/)).toBeDefined();
      expect(screen.getByText(/78%/)).toBeDefined();
    });

    it('Priya banner renders with 62% when that is the raisedPct value (single-sourced)', () => {
      render(
        <OverlayProvider>
          <ReturningBanner
            data={{
              name: 'returning_banner',
              content: {
                firstName: 'Priya',
                summaryLine: 'This fundraiser is now 62% of the way there. Your support could push it further.',
                href: '#updates',
              },
            }}
            overlay={OVERLAY}
          />
        </OverlayProvider>
      );
      expect(screen.getByText(/62%/)).toBeDefined();
    });

    it('null content banner still collapses to zero-height (other personas unchanged)', () => {
      const { container } = render(
        <OverlayProvider>
          <ReturningBanner data={{ name: 'returning_banner', content: null }} overlay={OVERLAY} />
        </OverlayProvider>
      );
      const slot = container.querySelector('[data-slot="returning_banner"]');
      expect(slot).not.toBeNull();
      // Zero-height collapse
      const style = (slot as HTMLElement | null)?.getAttribute('style') ?? '';
      expect(style).toContain('height: 0');
    });
  });
});
