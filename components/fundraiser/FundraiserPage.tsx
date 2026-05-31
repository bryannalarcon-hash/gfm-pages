'use client';
/**
 * FundraiserPage — client composition root.
 *
 * Orchestrates: GlobalNav, SunsLayer (S2), returning banner (D8/D13 slot),
 * donatebar, compact v4-hero, share studio (.spread/.studio inline, NOT modal),
 * ripple, secondary actions (.v4-second), top sharers (.sharerboard),
 * marks-intro, story, DonorFeed (D6), UpdatesSection (D4/D13),
 * sticky DonationCard rail (D1/D10/D12), mobile sticky bar (D1),
 * PostDonate screen (D3).
 *
 * Layout: .maincol (left) + .rail (right sidebar) inside .hrt-container.v4-wrap
 * using the mock's exact CSS classes (v4.css, shared.css, marks.css).
 *
 * D12 P9 coupling: referrerSource === 'profile_recurring_nudge' → openInMonthly=true.
 * Resolved SSR in app/f/[slug]/page.tsx → passed in `page.referrerSource`, no flash.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import './fundraiser-layout.css';
import { usePersona } from '@/lib/overlay/context';
import { SHARE_COPY_MATRIX } from '@/fixtures/shareCopyMatrix';
import { RIPPLE_STATS } from '@/fixtures/rippleStats';
import { PersonalizedSlot } from '@/components/slots/PersonalizedSlot';
import { DonationCard } from './DonationCard';
import { DonorFeed } from './DonorFeed';
import { PostDonate } from './PostDonate';
import { UpdatesSection } from './UpdatesSection';
import { SunsLayer } from '@/components/marks/SunsLayer';
import { SunsLegend } from '@/components/marks/SunsLegend';
import { SunCreateButton } from '@/components/marks/SunCreateButton';
import { SunCreateModal } from '@/components/marks/SunCreateModal';
import { personaHasParticipated } from '@/lib/personalization/participation';
import { Footer } from '@/components/shared/Footer';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import { mintShareId } from '@/lib/marks/attribution';
import type { PageContext, ShareChannel } from '@/lib/types';
import type { SlotCandidates } from '@/lib/personalization/slots';
import type { FundraiserRow, UpdateRow, DonationRow } from '@/lib/db/queries';
import type { BoardSeed, SunMark, SunAction, SunGradient } from '@/lib/marks/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

export interface FundraiserPageProps {
  fundraiser: FundraiserRow;
  updates: UpdateRow[];
  donations: DonationRow[];
  boardSeed: BoardSeed;
  copyByChannel: Partial<Record<ShareChannel, string>>;
  page: PageContext;
  candidates: SlotCandidates;
  supporterCount: number;
  /**
   * CB-04: seed-derived reach count for the current viewer's sharer token.
   * Equals the number of donations attributed to their shares on this fundraiser.
   * Passed through to PostDonate → GrewRibbon so the ribbon shows the real value, not a hardcoded figure.
   */
  sharerReach: number;
}

// ---- Overlay attrs ----
const BANNER_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Section Viewed',
  'data-overlay-delta': 'D8',
  'data-overlay-metric': 'repeat-visit-rate',
  'data-overlay-why': 'Returning-visitor recognition with LLM update summary drives re-engagement',
  'data-overlay-dashboard': 'repeat-visits',
};

const D1_STICKY_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Donate Intent',
  'data-overlay-delta': 'D1',
  'data-overlay-metric': 'checkout-completion-rate',
  'data-overlay-why': 'Persistent mobile donate bar ensures zero friction access to the form',
  'data-overlay-dashboard': 'donate-funnel',
};

const D1_STORY_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Donate Intent',
  'data-overlay-delta': 'D1',
  'data-overlay-metric': 'checkout-completion-rate',
  'data-overlay-why': 'Inline story Donate captures intent at the narrative peak',
  'data-overlay-dashboard': 'donate-funnel',
};

const SHARE_STUDIO_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Share Clicked',
  'data-overlay-delta': 'D9',
  'data-overlay-metric': 'share-rate',
  'data-overlay-why': 'Per-channel AI-copy studio is the primary action on this share-first page. GFM data: each share ~$50. Berger & Milkman 2012.',
  'data-overlay-dashboard': 'share-trends',
};

const D5_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Follow Clicked',
  'data-overlay-delta': 'D5',
  'data-overlay-metric': 'follow-rate',
  'data-overlay-why': 'Labeled Follow with value prop drives repeat visits',
  'data-overlay-dashboard': 'retention',
};

const SHARERBOARD_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Section Viewed',
  'data-overlay-delta': 'D4',
  'data-overlay-metric': 'share-rate',
  'data-overlay-why': 'Top-sharers leaderboard gamifies sharing; GFM data: 6+ shares = 3× raised. K-factor recognition.',
  'data-overlay-dashboard': 'share-trends',
};

const MARKS_INTRO_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Mark Created',
  'data-overlay-delta': 'D5',
  'data-overlay-metric': 'mark-rate',
  'data-overlay-why': 'Ambient gutter suns make the crowd of supporters felt; follow lights yours, sharing colours it, giving grows it.',
  'data-overlay-dashboard': 'retention',
};

const D2_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Donate Intent',
  'data-overlay-delta': 'D2',
  'data-overlay-metric': 'donate-intent-rate',
  'data-overlay-why': 'Near-goal urgency callout accelerates giving in the final stretch',
  'data-overlay-dashboard': 'donate-funnel',
};

// ---- Helpers ----
function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// Generic copy fallbacks per channel
const GENERIC_COPY: Record<string, string> = {
  whatsapp: 'Hey! I just backed this campaign — they\'re changing lives and need your help.',
  x: 'I just backed this important cause — please share and chip in if you can.',
  instagram: 'A ready-made story card to share the campaign with your followers.',
  email: 'I wanted to share something I just supported — here\'s the link…',
  facebook: 'Help this fundraiser reach its goal — share it on Facebook.',
  copy_link: 'Copy the link to share this fundraiser anywhere.',
};

// Channel label/tone pairs matching the mock
const STUDIO_CHANNELS: Array<{
  channel: ShareChannel;
  label: string;
  tone: string;
  chipStyle: React.CSSProperties;
  bubbleClass: string;
  ctaLabel: string;
}> = [
  {
    channel: 'whatsapp',
    label: 'WhatsApp',
    tone: 'friend tone',
    chipStyle: { background: '#e7fce3', color: '#1f8a4c' },
    bubbleClass: 'bubble bubble--wa',
    ctaLabel: 'Send on WhatsApp',
  },
  {
    channel: 'x',
    label: 'X',
    tone: 'punchy & public',
    chipStyle: { background: '#eef3f6' },
    bubbleClass: 'bubble bubble--x',
    ctaLabel: 'Post to X',
  },
  {
    channel: 'email',
    label: 'Email',
    tone: 'personal note',
    chipStyle: {},
    bubbleClass: 'bubble',
    ctaLabel: 'Compose email',
  },
  {
    channel: 'facebook',
    label: 'Facebook',
    tone: 'social share',
    chipStyle: { background: '#1877F2', color: '#fff' },
    bubbleClass: 'bubble',
    ctaLabel: 'Share on Facebook',
  },
];

/** Derive top 3 sharers from board seed marks (those with 'share' action, sorted by sizeScore desc).
 * Returns at most 3 entries. Each entry has: initials, name, shareCount, supportersBrought.
 *
 * NOTE: per-sharer dollar figures are NOT rendered here.
 * The mock shows "$620 inspired" — we deliberately replace that with "brought N supporters"
 * derived from attribution/seed data (sizeScore proxies cumulative impact). This is a
 * deliberate deviation from the mock to comply with the no-dollar-on-board guardrail.
 */
function deriveTopSharers(marks: SunMark[]): Array<{
  initials: string;
  name: string;
  shareCount: number;
  supportersBrought: number;
}> {
  const sharers = marks
    .filter((m) => m.actions.includes('share') && m.displayName)
    .sort((a, b) => b.sizeScore - a.sizeScore)
    .slice(0, 3);

  if (sharers.length === 0) {
    // Fallback seed data when no sharers in board
    return [
      { initials: 'MT', name: 'Mike T.', shareCount: 14, supportersBrought: 8 },
      { initials: 'SK', name: 'Sarah K.', shareCount: 9, supportersBrought: 5 },
      { initials: 'AC', name: 'Ana C.', shareCount: 6, supportersBrought: 3 },
    ];
  }

  return sharers.map((m, i) => {
    const name = m.displayName!;
    const parts = name.trim().split(' ');
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
    // Derive share count and supporters from sizeScore (no real share-count column available)
    // sizeScore is cumulative impact; divide by 10 for an approx share count
    const shareCount = Math.max(1, Math.round(m.sizeScore / 10) + (3 - i) * 2);
    // supporters brought: derived as ~60% of shareCount (attribution approximation from seed)
    const supportersBrought = Math.max(1, Math.round(shareCount * 0.6));
    return { initials, name, shareCount, supportersBrought };
  });
}

export function FundraiserPage({
  fundraiser, updates, donations, boardSeed, copyByChannel, page, candidates, supporterCount, sharerReach,
}: FundraiserPageProps) {
  const user = usePersona();
  const [donateOpen, setDonateOpen] = useState(false);
  // D5 Follow state: derived from the active persona's follow list so a persona switch
  // immediately reflects the correct state (close_friend/returning_lapsed already follow).
  const [following, setFollowing] = useState(() => user.follows.fundraiserIds.includes(fundraiser.id));
  const [postDonate, setPostDonate] = useState<{ amountUsd: number; frequency: 'one_time' | 'monthly' } | null>(null);

  // Sync follow state when persona changes (L3.5 — no page reload on persona switch).
  useEffect(() => {
    setFollowing(user.follows.fundraiserIds.includes(fundraiser.id));
  }, [user, fundraiser.id]);

  // CB-34: the marks-intro sun button is create OR edit depending on the viewer's
  // relationship to THIS board. A participant — follows/donated/shared to this
  // fundraiser (or follows its organizer), OR just clicked Follow this session —
  // already has a sun, so the button becomes "Edit my sun". Reacts LIVE to BOTH the
  // runtime `following` flag (a Follow click) AND persona switches.
  const personaParticipated = personaHasParticipated(user, {
    fundraiserId: fundraiser.id,
    organizerProfileIds: fundraiser.organizer_id ? [fundraiser.organizer_id] : undefined,
  });
  const isParticipant = following || personaParticipated;

  // Edit/create modal — controlled-open from the SunCreateButton. The participant has
  // (at minimum) followed; if they've also donated, colour+size avenues are unlocked too.
  const [sunModalOpen, setSunModalOpen] = useState(false);
  // CB-77: derive the sun's unlocked actions from the persona's ACTUAL roles on THIS fundraiser
  // — follow / share / give independently — so a sharer (Mike T.) gets sharer controls (flat
  // colours, CB-51), a donor (Sarah K.) gets contributor controls (gradients), and someone who
  // does both gets both. Empty → the create button stays greyed-until-unlocked.
  const sunUnlocked = useMemo<SunAction[]>(() => {
    const actions: SunAction[] = [];
    if (following || user.follows.fundraiserIds.includes(fundraiser.id)) actions.push('follow');
    if ((user.shares ?? []).includes(fundraiser.id)) actions.push('share');
    if (user.donations.some((d) => d.fundraiserId === fundraiser.id)) actions.push('give');
    return actions;
  }, [following, user, fundraiser.id]);
  // CB-80 (REPEAT root-cause): the viewer's OWN sun never got a ring/label because this
  // handler discarded the committed sun — nothing with isOwn:true was ever added to the
  // board. Prior fixes only ever touched the seeded URL-sharer path (which already worked).
  // Now committing creates a runtime own-sun and injects it into the board so SunsLayer
  // rings it + labels it "Your Sun".
  const [ownSun, setOwnSun] = useState<SunMark | null>(null);
  // CB-80: a STABLE random placement fraction (0–1) so the own-sun lands at a random index in
  // the UPPER portion of the board (top half of the page) and reads as "one of the crowd", not
  // pinned to the very top. Set once when the own-sun is created (client-only → no SSR drift).
  const [ownPlaceFrac, setOwnPlaceFrac] = useState(0.5);
  // CB-80 (gap fix): a persona who has ALREADY participated (e.g. Sarah K. — follows + donated
  // to this fundraiser) must see her ringed "Your Sun" on PAGE LOAD — it must NOT require her to
  // re-create it. We derive the own-sun from participation, re-running on persona switch and when
  // an anon viewer follows in-session (anon → participant). A manual `handleSunCommit` overrides
  // the gradient/consent afterwards (its deps don't change here, so it isn't clobbered).
  useEffect(() => {
    if (!isParticipant) { setOwnSun(null); return; }
    const gradient: SunGradient = sunUnlocked.includes('give')
      ? 'gold'
      : sunUnlocked.includes('share')
        ? 'brand'
        : 'grey';
    setOwnPlaceFrac(Math.random());
    setOwnSun({
      id: '__own_viewer',
      ownerToken: 'viewer',
      displayName: null, // own-sun label is "Your Sun"; a consented name is set only on explicit commit
      actions: sunUnlocked.length ? sunUnlocked : ['follow'],
      gradient,
      sizeScore: 140,
      isOwn: true,
      isSharer: false,
    });
  }, [user.slug, isParticipant, sunUnlocked]);
  const handleSunCommit = useCallback((g: SunGradient, consent: boolean) => {
    setOwnSun({
      id: '__own_viewer',
      ownerToken: 'viewer',
      displayName: consent && user.name ? user.name : null,
      actions: sunUnlocked.length ? sunUnlocked : ['follow'],
      gradient: g,
      sizeScore: 140, // dignified, clearly visible above the floor
      isOwn: true,
      isSharer: false,
    });
    setSunModalOpen(false);
  }, [user.name, sunUnlocked]);

  // CB-80: board seed with the viewer's own sun inserted at a RANDOM index in the upper portion
  // of the marks. Real marks are placed (top→bottom) before the decorative pads SunsLayer
  // appends, so the upper ~third of the real-marks array maps to the top half of the page — the
  // own-sun thus sits randomly AMONG the other suns up top, not pinned to the very top corner.
  const seedWithOwn = useMemo<BoardSeed>(() => {
    if (!ownSun) return boardSeed;
    const len = boardSeed.marks.length;
    // The board is bottom-heavy (CB-90), so only the first ~15% of the marks sequence lands in
    // the TOP HALF of the page. Keep the own-sun's random index inside that window (but past the
    // very first marks so it's mixed in, not pinned to the corner).
    const lo = Math.floor(len * 0.03);
    const hi = Math.max(lo + 1, Math.floor(len * 0.15));
    const idx = Math.min(hi, lo + Math.floor(ownPlaceFrac * (hi - lo)));
    return { ...boardSeed, marks: [...boardSeed.marks.slice(0, idx), ownSun, ...boardSeed.marks.slice(idx)] };
  }, [ownSun, ownPlaceFrac, boardSeed]);

  // D12 P9 coupling: resolved SSR, no flash
  const openInMonthly = page.referrerSource === 'profile_recurring_nudge';
  const momentum = page.pageState.momentum ?? 'high';

  // Apply v4-page body class for CSS targeting (for v4.css selectors like .v4-page .rail)
  // Also apply on body directly to ensure v4.css rules apply (with SSR-safe approach)
  // Note: body class is added via useEffect (client-side); the fundraiser-root class is always present
  useEffect(() => {
    document.body.classList.add('v4-page');
    return () => { document.body.classList.remove('v4-page'); };
  }, []);

  // Story Scrolled fires once when >50% of the story scrolls into view.
  const storyRef = useRef<HTMLElement | null>(null);
  const mountedAtRef = useRef<number>(typeof performance !== 'undefined' ? performance.now() : 0);
  const storyFiredRef = useRef(false);
  useEffect(() => {
    const el = storyRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !storyFiredRef.current) {
            storyFiredRef.current = true;
            const elapsed = Math.round(((typeof performance !== 'undefined' ? performance.now() : 0) - mountedAtRef.current) / 1000);
            capture('Story Scrolled', { scroll_depth_pct: 50, time_on_page_sec: elapsed });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleDonate = useCallback(() => {
    setDonateOpen(true);
    // Add sheet-open class for mobile bottom-sheet animation (v4.css)
    document.body.classList.add('sheet-open');
  }, []);

  const handleCloseSheet = useCallback(() => {
    setDonateOpen(false);
    document.body.classList.remove('sheet-open');
  }, []);
  const handleFollow = useCallback(() => {
    setFollowing((prev) => !prev);
    capture('Follow Clicked', { follow_context: 'page' });
  }, []);

  const handleShareChannel = useCallback((channel: ShareChannel) => {
    const shareId = mintShareId({ entityType: 'fundraiser', entityId: fundraiser.id, sharerToken: 'viewer', channel });
    capture('Share Clicked', { share_channel: channel, share_context: 'studio', share_id: shareId });
  }, [fundraiser.id]);

  const handleDonateCompleted = useCallback((amountUsd: number, frequency: 'one_time' | 'monthly') => {
    setDonateOpen(false);
    document.body.classList.remove('sheet-open');
    setPostDonate({ amountUsd, frequency });
  }, []);

  const pct = fundraiser.goal_usd > 0 ? fundraiser.raised_usd / fundraiser.goal_usd : 0;
  const nearGoal = pct >= 0.8;
  const toGoUsd = Math.max(0, fundraiser.goal_usd - fundraiser.raised_usd);
  const topSharers = deriveTopSharers(boardSeed.marks);
  const displaySupporterCount = supporterCount || boardSeed.marks.length || 847;

  // CB-93: the suns demo funding control (lifted out of SunsLayer) drives BOTH the gutter suns
  // AND the on-page progress bar/labels from one source. null → SSR uses the real seed pct (no
  // hydration mismatch); after the user drags, the bar fill + "$ raised / % of goal" track it.
  const [demoFundedPct, setDemoFundedPct] = useState<number | null>(null);
  const displayPct = demoFundedPct ?? pct;
  const displayRaised = demoFundedPct != null ? Math.round(demoFundedPct * fundraiser.goal_usd) : fundraiser.raised_usd;

  return (
    <div className="relative min-h-screen">
      {/* S2 ambient suns — SSR'd seed, zero CLS. Root div is transparent. */}
      <SunsLayer seed={seedWithOwn} reducedMotion={false} supporterCount={supporterCount}
        fundedPctOverride={demoFundedPct} onFundedPctChange={setDemoFundedPct} />
      {/* Cross-surface top bar (UnifiedNav) is mounted once in app/layout.tsx. */}

      {/* D8/D13 returning banner slot (L3.5 — never unmounts) */}
      <Instrumented attrs={BANNER_OVERLAY} regionLabel="returning-banner">
        <PersonalizedSlot name="returning_banner" page={page} candidates={candidates}
          overlay={BANNER_OVERLAY} sectionName="returning_banner" />
      </Instrumented>

      {/* v4.2 persistent donate bar (always visible below nav) */}
      <div className="donatebar">
        <div className="hrt-container v4-wrap donatebar__in">
          <div className="donatebar__meta">
            <strong>{formatUsd(displayRaised)}</strong> raised ·{' '}
            <span className="muted">{formatPct(displayPct)} of {formatUsd(fundraiser.goal_usd)}</span>
          </div>
          <button
            className="btn btn--primary btn--sm"
            data-variant="primary"
            onClick={() => { capture('Donate Intent', { cta_location: 'dock' }); handleDonate(); }}
            aria-label="Donate now"
          >
            Donate now
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="hrt-container v4-wrap fundraiser-layout">
        <div className="maincol">

          {/* ===== COMPACT HERO ===== */}
          <section className="v4-hero" data-screen-label="Hero">
            {/* Hero image — .v4-hero__img sets aspect-ratio: 4/3 */}
            {fundraiser.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fundraiser.hero_image_url}
                alt={fundraiser.title}
                className="v4-hero__img"
                style={{ width: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div className="ph v4-hero__img">
                <span className="ph__label">campaign cover</span>
              </div>
            )}
            <div>
              <h1 className="v4-hero__title">{fundraiser.title}</h1>
              <div className="v4-hero__meta">
                <span className="avatar avatar--sm">{fundraiser.organizer_name.slice(0, 2).toUpperCase()}</span>
                Organized by <strong>{fundraiser.organizer_name}</strong>
                {fundraiser.community_name && fundraiser.community_slug && (
                  <>
                    {' · '}
                    <a className="pill pill--brand" href={`/communities/${fundraiser.community_slug}`}>
                      Part of {fundraiser.community_name}
                    </a>
                  </>
                )}
              </div>
              <Instrumented attrs={D2_OVERLAY} regionLabel="goal-progress">
                <div className="v4-hero__bar">
                  <div className="goalbar">
                    <div className="goalbar__fill" style={{ width: `${Math.min(100, Math.round(displayPct * 100))}%` }} />
                  </div>
                  <div className="muted" style={{ marginTop: 'var(--hrt-size-spacing-1)' }}>
                    <strong style={{ color: 'var(--hrt-color-text-default)' }}>{formatUsd(displayRaised)}</strong>{' '}
                    raised of {formatUsd(fundraiser.goal_usd)} · {fundraiser.donation_count.toLocaleString()} gifts
                  </div>
                  {nearGoal && (
                    <div className="togo">{formatUsd(toGoUsd)} to go</div>
                  )}
                </div>
              </Instrumented>
            </div>
          </section>

          {/* ===== SHARE ENGINE — page primary surface (D9 · share-first) ===== */}
          <Instrumented attrs={SHARE_STUDIO_OVERLAY} regionLabel="share-studio">
            <section
              className="spread"
              data-screen-label="Share studio"
            >
              {/* D9 share-rate slot: framing adapts per persona (sharer/sharee/default).
                  Structure fixed; only headline copy changes. L3.5 never-unmount. */}
              <PersonalizedSlot name="share_rate" page={page} candidates={candidates}
                overlay={SHARE_STUDIO_OVERLAY} sectionName="share_rate" />
              <div className="studio">
                {STUDIO_CHANNELS.map(({ channel, label, tone, chipStyle, bubbleClass, ctaLabel }) => {
                  // CB-69: persona-tailored copy first (history×platform matrix, CB-47), live on
                  // persona swap via usePersona(); falls back to the pre-fetched/generic copy.
                  const copy = SHARE_COPY_MATRIX[user.slug]?.[channel] ?? copyByChannel[channel] ?? GENERIC_COPY[label.toLowerCase()] ?? `Share this fundraiser on ${label}.`;
                  return (
                    <div key={channel} className="scard">
                      <div className="scard__head">
                        <span className="chip" style={chipStyle} aria-hidden="true">
                          <span style={{ fontSize: 10, fontWeight: 700 }}>{label[0]}</span>
                        </span>
                        {label}
                        <span className="scard__tone">· {tone}</span>
                      </div>
                      <div className={bubbleClass}>{copy}</div>
                      <button
                        className="btn btn--primary btn--sm"
                        data-variant="primary"
                        type="button"
                        onClick={() => handleShareChannel(channel)}
                        aria-label={`Share on ${label}`}
                      >
                        {ctaLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </Instrumented>

          {/* ===== RIPPLE — downstream share reward (L3.5 persona-aware) ===== */}
          {/* CB-88: sharer personas (Sarah/Mike/Janahan) see a GREEN, personalized "your ripple
              is growing" state with real counts; non-sharers (anon/lapsed/guest) see the neutral
              first-share prompt. Per-persona stats from the RIPPLE_STATS demo matrix. */}
          {(() => {
            const ripple = RIPPLE_STATS[user.slug] ?? null;
            const rippleStroke = ripple ? 'var(--hrt-color-border-brand)' : '#b7b7b6';
            const rippleFill = ripple ? 'var(--hrt-color-surface-brand)' : '#b7b7b6';
            return (
              <div
                className={`ripple${ripple ? ' ripple--active' : ''}`}
                data-overlay-tier="2"
                data-overlay-delta="D4"
                data-overlay-events="Share Clicked"
                data-overlay-metric="share-rate"
                data-overlay-why="First-share ripple prompt: show the reward waiting to be earned (social currency, Berger & Milkman 2012)."
                data-overlay-dashboard="share-trends"
              >
                <svg className="ripple__viz" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="30" fill="none" stroke={rippleStroke} strokeWidth="2" opacity="0.4" />
                  <circle cx="32" cy="32" r="20" fill="none" stroke={rippleStroke} strokeWidth="2" opacity="0.6" />
                  <circle cx="32" cy="32" r="10" fill={rippleFill} />
                </svg>
                <div>
                  {ripple ? (
                    <>
                      <div className="ripple__big">Your ripple is growing</div>
                      <div className="ripple__sub">
                        Your shares brought <strong>{ripple.people} people</strong> in — they&rsquo;ve
                        since raised <strong>{formatUsd(ripple.raisedUsd)}</strong>.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="ripple__big">Share once and watch your ripple grow</div>
                      <div className="ripple__sub">We&rsquo;ll show you how many people your share brought — and how much they raised.</div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ===== SECONDARY ACTIONS: Donate + Follow (below Share) ===== */}
          <div className="v4-second">
            <Instrumented
              attrs={{ 'data-overlay-tier': '1', 'data-overlay-events': 'Donate Intent', 'data-overlay-delta': 'D1', 'data-overlay-metric': 'checkout-completion-rate', 'data-overlay-why': 'Donate stays reachable but secondary; share is headline action on this page.', 'data-overlay-dashboard': 'donate-funnel' }}
              regionLabel="donate-secondary-cta"
            >
              <button
                className="btn btn--primary"
                data-variant="primary"
                type="button"
                onClick={() => { capture('Donate Intent', { cta_location: 'secondary' }); handleDonate(); }}
              >
                Donate
              </button>
            </Instrumented>
            <Instrumented attrs={D5_OVERLAY} regionLabel="follow-cta">
              <button
                className={following ? 'btn btn--following' : 'btn btn--secondary'}
                type="button"
                aria-pressed={following}
                aria-label={following ? 'Unfollow this fundraiser' : 'Follow this fundraiser'}
                onClick={handleFollow}
              >
                {following ? '✓ Following' : 'Follow'}
              </button>
            </Instrumented>
          </div>

          {/* ===== TOP SHARERS BOARD (gamifies sharing) ===== */}
          <Instrumented attrs={SHARERBOARD_OVERLAY} regionLabel="sharer-board">
            <section className="sharerboard v4-block" data-screen-label="Top sharers">
              <h2 className="v4-h">Top sharers this week</h2>
              <p className="muted" style={{ fontSize: 'var(--hrt-size-font-body-sm)', margin: '0 0 var(--hrt-size-spacing-2)' }}>
                The people spreading the word the furthest.
              </p>
              {topSharers.map((sharer, i) => (
                <div key={i} className="sharerrow">
                  <span className="sharerrow__rank">{i + 1}</span>
                  <span className="avatar avatar--sm">{sharer.initials}</span>
                  <span className="sharerrow__nm">{sharer.name}</span>
                  {/*
                    DELIBERATE DEVIATION FROM MOCK:
                    The mock shows "$620 inspired" per sharer. We intentionally replace the
                    per-sharer dollar figure with "brought N supporters" — derived from the
                    attribution/seed sizeScore. This complies with the no-dollar-on-board
                    guardrail (marks board must never render dollar figures).
                  */}
                  <span className="sharerrow__stat">
                    <strong>{sharer.shareCount} shares</strong>
                    <div>brought {sharer.supportersBrought} supporters</div>
                  </span>
                </div>
              ))}
            </section>
          </Instrumented>

          {/* ===== MARKS INTRO (ambient suns explanation) ===== */}
          <Instrumented attrs={MARKS_INTRO_OVERLAY} regionLabel="marks-intro">
            <section className="block" data-screen-label="Marks intro">
              <div className="marks-intro">
                <div className="marks-intro__txt">
                  <div className="marks-intro__h">{displaySupporterCount.toLocaleString()} supporters surround this page</div>
                  <p className="marks-intro__p">
                    Every sun in the margins showed up for this campaign.{' '}
                    <b>Follow</b> lights yours · <b>sharing</b> colours it · <b>giving</b> grows it — it'll be here when you come back.
                  </p>
                  {/* board__legend — rendered via SunsLegend (CB-01 fix).
                      SunsLegend uses inline mask-image styles (the GFM rising-sun
                      logo primitive) so the mask is always applied regardless of CSS
                      cascade specificity. Handles reducedMotion and matches the mock's
                      animated demo-sun behavior (colour-shift + wobble). */}
                  <SunsLegend layout="row" />
                </div>
                {/* CB-34: create→edit. Participants (follow/donate/share to this board,
                    or a Follow click this session) get an enabled "Edit my sun"; everyone
                    else keeps the greyed-until-unlocked create state. */}
                <SunCreateButton
                  isParticipant={isParticipant}
                  onEdit={() => setSunModalOpen(true)}
                />
              </div>
            </section>
          </Instrumented>

          {/* CB-34: edit/create modal — controlled-open from the marks-intro button.
              Trigger hidden (the SunCreateButton above is the affordance). */}
          <SunCreateModal
            unlockedBy={sunUnlocked}
            onCommit={handleSunCommit}
            open={sunModalOpen}
            onOpenChange={setSunModalOpen}
            hideTrigger
          />

          {/* ===== STORY (R4) ===== */}
          <section ref={storyRef} className="block" data-screen-label="Story" aria-label="Campaign story">
            <div className="hero__org" style={{ marginBottom: 'var(--hrt-size-spacing-2)' }}>
              <span className="avatar avatar--sm">{fundraiser.organizer_name.slice(0, 2).toUpperCase()}</span>
              <span>{fundraiser.organizer_name}</span>
            </div>
            <p style={{ margin: 0 }}>{fundraiser.story ?? 'No story provided.'}</p>
            <a href="#" className="muted" style={{ color: 'var(--hrt-color-text-brand)', fontWeight: 'var(--hrt-font-weight-bold)' as React.CSSProperties['fontWeight'] }}>Read more ▾</a>
            <div style={{ marginTop: 'var(--hrt-size-spacing-3)' }}>
              <Instrumented attrs={D1_STORY_OVERLAY} regionLabel="donate-story-cta">
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => { capture('Donate Intent', { cta_location: 'story' }); handleDonate(); }}
                >
                  Donate
                </button>
              </Instrumented>
            </div>
          </section>

          {/* ===== DONOR ACTIVITY (D6) ===== */}
          <div className="block">
            <DonorFeed donations={donations} donationCount={fundraiser.donation_count}
              momentum={momentum} raisedUsd={fundraiser.raised_usd} goalUsd={fundraiser.goal_usd}
              organizerName={fundraiser.organizer_name} onDonate={handleDonate} />
          </div>

          {/* ===== UPDATES (D4/D13) ===== */}
          <UpdatesSection fundraiserId={fundraiser.id} updates={updates} copyByChannel={copyByChannel} />

        </div>{/* /maincol */}

        {/* ===== RAIL — sticky DonationCard ===== */}
        <aside className="rail" aria-label="Donation">
          <div
            className="donatecard"
            data-overlay-tier="1"
            data-overlay-delta="D1"
            data-overlay-events="Amount Selected,Donate Started,Donate Completed"
            data-overlay-metric="checkout-completion-rate"
            data-overlay-why="D1 single-screen form + D10 smart presets + D12 recurring nudge. Tier-1 core conversion."
            data-overlay-dashboard="donate-funnel"
          >
            {/* Sheet handle (mobile) */}
            <div className="sheet-handle" aria-hidden="true" />
            <DonationCard
              page={page} candidates={candidates} fundraiserId={fundraiser.id}
              organizerName={fundraiser.organizer_name} goalUsd={fundraiser.goal_usd}
              openInMonthly={openInMonthly} onCompleted={handleDonateCompleted}
            />
          </div>
        </aside>

      </main>{/* /hrt-container v4-wrap fundraiser-layout — 2-col grid at 1024px+ */}

      <Footer />

      {/* Mobile sticky CTA (D1) — v4-page CSS hides .stickycta via .v4-page .stickycta { display:none } */}
      <div className="stickycta" data-screen-label="Sticky CTA">
        <Instrumented attrs={D1_STICKY_OVERLAY} regionLabel="sticky-donate-cta">
          <button
            className="btn btn--primary btn--block"
            data-variant="primary"
            type="button"
            onClick={() => {
              capture('Donate Intent', { cta_location: 'sticky' });
              handleDonate();
            }}
            aria-label="Donate"
          >
            Donate
          </button>
        </Instrumented>
      </div>

      {/* Sheet backdrop (mobile) — shown when sheet-open via CSS */}
      <div className="sheet-backdrop" onClick={handleCloseSheet} aria-hidden="true" />

      {/* Post-donate screen — D3 */}
      {postDonate && (
        <PostDonate amountUsd={postDonate.amountUsd} frequency={postDonate.frequency}
          firstTimeDonor={donations.length === 0}
          fundraiserTitle={fundraiser.title} fundraiserId={fundraiser.id}
          organizerName={fundraiser.organizer_name}
          communityName={fundraiser.community_name} communityId={fundraiser.community_id}
          heroImageUrl={fundraiser.hero_image_url}
          raisedUsd={fundraiser.raised_usd} goalUsd={fundraiser.goal_usd}
          copyByChannel={copyByChannel} page={page} candidates={candidates}
          sharerReach={sharerReach}
          onSunCommit={handleSunCommit}
          onClose={() => setPostDonate(null)} />
      )}
    </div>
  );
}
