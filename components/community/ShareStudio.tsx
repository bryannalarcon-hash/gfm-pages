'use client';
// ShareStudio — v4 Share Engine section ("Bigger together" / "Invite people to X").
// Matches mocks/community-v4.2.html sections:
//   .spread (Share Studio with per-channel cards)
//   .v4-block > .celebrate (shareable milestone card)
//   .sharerboard .v4-block (top inviters leaderboard)
//
// All three are rendered together as the share-first engine block.
// Uses real share copy from shareCopy prop (C6) + real raised/fundraiser/follower stats.
// Guardrail: NO dollar figures on suns board; green CTA only on green surface.

import React from 'react';
import type { ShareChannel, PageContext } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import { mintShareId, buildAttributedShareUrl } from '@/lib/marks/attribution';
import { Avatar } from '@/components/shared/Avatar';
import { getPersonaByName } from '@/lib/personas/loader';
import { usePersona } from '@/lib/overlay/context';
import { COMMUNITY_SHARE_COPY } from '@/fixtures/shareCopyProfileCommunity';
import {
  IconFacebook,
  IconX,
  IconWhatsapp,
  IconMessenger,
  IconSms,
  IconEmail,
  IconLink,
} from '@/components/shared/icons';

const SHARE_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Share Clicked',
  'data-overlay-delta': 'C6',
  'data-overlay-metric': 'AI per-channel community share copy',
  'data-overlay-why':
    'LLM copy per (community, channel), regenerated every 30d. Community sharing has wider top-of-funnel reach than single-fundraiser sharing.',
  'data-overlay-dashboard': 'share-trends',
};

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

type IconComponent = React.ComponentType<{ size?: number | string; className?: string }>;

/** Map share channel to its SVG icon component (matches mocks/icons.js glyphs). */
function channelIcon(channel: ShareChannel): IconComponent {
  switch (channel) {
    case 'facebook':  return IconFacebook;
    case 'x':         return IconX;
    case 'whatsapp':  return IconWhatsapp;
    case 'messenger': return IconMessenger;
    case 'sms':       return IconSms;
    case 'email':     return IconEmail;
    case 'copy_link': return IconLink;
    default:          return IconLink;
  }
}

/** Map share channel to display name and background color */
function channelMeta(channel: ShareChannel): { label: string; bg: string; bubbleCls: string } {
  switch (channel) {
    case 'whatsapp': return { label: 'WhatsApp', bg: '#e7fce3;color:#1f8a4c', bubbleCls: 'bubble bubble--wa' };
    case 'x': return { label: 'X', bg: '#eef3f6', bubbleCls: 'bubble bubble--x' };
    case 'facebook': return { label: 'Facebook', bg: '#e7eef7', bubbleCls: 'bubble' };
    case 'email': return { label: 'Email', bg: '#f0f4f9', bubbleCls: 'bubble' };
    case 'copy_link': return { label: 'Copy link', bg: '#f5f5f5', bubbleCls: 'bubble' };
    case 'sms': return { label: 'SMS', bg: '#f0f4f9', bubbleCls: 'bubble' };
    case 'messenger': return { label: 'Messenger', bg: '#e7eef7', bubbleCls: 'bubble' };
    // Humanize any other channel so a raw slug (e.g. native_share) never renders (CB-50).
    default: return {
      label: channel.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      bg: '#f5f5f5',
      bubbleCls: 'bubble',
    };
  }
}

interface ShareStudioProps {
  communityName: string;
  raisedUsd: number;
  fundraiserCount: number;
  followerCount: number;
  shareCopy: Partial<Record<ShareChannel, string>>;
  communityId: string;
  pageCtx: PageContext;
}

// Top inviters — placeholder data (real data would come from a DB query)
const TOP_INVITERS = [
  { initials: 'MT', name: 'Mike T.', invites: 21, joined: 8 },
  { initials: 'AC', name: 'Ana C.', invites: 13, joined: 5 },
  { initials: 'SK', name: 'Sarah K.', invites: 9, joined: 4 },
];

export function ShareStudio({
  communityName,
  raisedUsd,
  fundraiserCount,
  followerCount,
  shareCopy,
  communityId,
  pageCtx,
}: ShareStudioProps) {
  const viewer = usePersona();
  const [linkCopied, setLinkCopied] = React.useState(false);
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const studioRef = React.useRef<HTMLDivElement>(null);

  const handleShare = React.useCallback(
    (channel: ShareChannel) => {
      capture('Share Clicked', {
        share_channel: channel,
        share_context: 'community',
        community_id: communityId,
        referrer_source: pageCtx.referrerSource,
      });
    },
    [communityId, pageCtx.referrerSource],
  );

  const handleMilestoneShare = React.useCallback(() => {
    capture('Share Clicked', {
      share_channel: 'native_share',
      share_context: 'community',
      community_id: communityId,
      referrer_source: pageCtx.referrerSource,
    });
  }, [communityId, pageCtx.referrerSource]);

  /**
   * Copy-link: mint a fresh share_id, build an attributed URL carrying utm_share_* params,
   * write it to clipboard, and fire 'Share Clicked'. Guards navigator.clipboard for
   * environments where it may be absent (non-secure context, server, older browsers).
   */
  const handleCopyLink = React.useCallback(() => {
    const shareId = mintShareId({
      entityType: 'community',
      entityId: communityId,
      sharerToken: 'viewer',
      channel: 'copy_link',
    });
    const url = buildAttributedShareUrl({
      basePath: `/communities/${communityId}`,
      shareId,
      channel: 'copy_link',
    });

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {
        // Silently ignore — the Copied! affordance still shows as best-effort.
      });
    }

    capture('Share Clicked', {
      share_channel: 'copy_link',
      share_context: 'community',
      community_id: communityId,
      share_id: shareId,
      referrer_source: pageCtx.referrerSource,
    });

    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [communityId, pageCtx.referrerSource]);

  // Resolve per-persona community copy per channel.
  // Channel list comes from shareCopy prop (preserves order); persona copy overrides text per channel.
  // When shareCopy prop is empty, fall back to the persona copy channels.
  const personaCommunityCopy = COMMUNITY_SHARE_COPY[viewer.slug] ?? {};
  const propChannels = Object.keys(shareCopy) as ShareChannel[];
  const resolvedCopy: Partial<Record<ShareChannel, string>> = {};
  if (propChannels.length > 0) {
    // Prop drives the channel list; persona overrides the text per channel.
    for (const ch of propChannels) {
      resolvedCopy[ch] = personaCommunityCopy[ch] ?? shareCopy[ch];
    }
  } else {
    // No prop channels; use persona copy directly.
    for (const [ch, copy] of Object.entries(personaCommunityCopy) as [ShareChannel, string][]) {
      resolvedCopy[ch] = copy;
    }
  }

  // Pick up to 2 channels with copy
  const channels = (Object.entries(resolvedCopy) as [ShareChannel, string][]).slice(0, 2);

  // Carousel helpers — wrapping prev/next, also scrolls the underlying container.
  const goTo = React.useCallback(
    (index: number) => {
      const items = studioRef.current?.querySelectorAll<HTMLElement>('.scard');
      if (!items || items.length === 0) return;
      const clamped = ((index % items.length) + items.length) % items.length;
      setCarouselIndex(clamped);
      // Programmatic scroll — align the target card into view (jsdom may not implement scrollIntoView).
      const target = items[clamped];
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    },
    [],
  );
  // If no copy resolved, use fallback whatsapp/x
  const fallbackChannels: [ShareChannel, string][] = channels.length === 0
    ? [
        ['whatsapp', `There's a community keeping people safe — ${communityName}. ${followerCount.toLocaleString()} of us already follow it. Join? 👇`],
        ['x', `${formatUsd(raisedUsd)} raised, ${fundraiserCount} fundraisers, one mission. Follow ${communityName}'s community.`],
      ]
    : channels;

  const raisedStr = formatUsd(raisedUsd);
  const milestoneText = `${raisedStr} raised together`;
  const milestoneSub = `${followerCount.toLocaleString()} people · ${fundraiserCount} fundraisers · one cause`;

  return (
    <>
      {/* ===== SPREAD / SHARE STUDIO ===== */}
      <Instrumented attrs={SHARE_OVERLAY} regionLabel="share-studio">
        <section
          className="spread"
          data-screen-label="Invite studio"
          data-overlay-tier="2"
          data-overlay-delta="C6"
          data-overlay-events="Share Clicked"
          data-overlay-metric="Share — per-channel invite studio"
          data-overlay-why="Communities grow when members bring members. Per-channel invite copy (C6 AI) rendered as one-tap previews."
          data-overlay-dashboard="share-trends"
        >
          <div className="spread__eyebrow">Bigger together</div>
          <h2 className="spread__head">Invite people to {communityName}</h2>
          <p className="spread__sub">
            Every invite brings someone new to the cause. Pick a channel — we wrote the message.
          </p>
          {/* Carousel wrapper: prev arrow, scrollable cards, next arrow */}
          <div className="studio-carousel">
            {/* Prev arrow */}
            <button
              type="button"
              aria-label="Previous"
              className="studio-carousel__arrow studio-carousel__arrow--prev"
              onClick={() => goTo(carouselIndex - 1)}
            >
              ‹
            </button>

            {/* Scrollable card track */}
            <div className="studio" ref={studioRef}>
              {fallbackChannels.map(([channel, copy]) => {
                const { label, bg, bubbleCls } = channelMeta(channel);
                const ChannelIcon = channelIcon(channel);
                return (
                  <div className="scard" key={channel}>
                    <div className="scard__head">
                      <span
                        className="chip"
                        style={{ background: bg.split(';')[0], color: bg.includes('color:') ? bg.split('color:')[1] : undefined }}
                        aria-hidden="true"
                      >
                        <ChannelIcon size={16} />
                      </span>
                      {label}
                    </div>
                    <div className={bubbleCls}>{copy}</div>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => handleShare(channel)}
                    >
                      {channel === 'whatsapp'
                        ? 'Send on WhatsApp'
                        : channel === 'copy_link'
                        ? 'Copy link'
                        : channel === 'email'
                        ? 'Compose email'
                        : `Post to ${label}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Next arrow */}
            <button
              type="button"
              aria-label="Next"
              className="studio-carousel__arrow studio-carousel__arrow--next"
              onClick={() => goTo(carouselIndex + 1)}
            >
              ›
            </button>
          </div>

          {/* Dot indicators — one per card */}
          <div className="studio-carousel__dots" role="tablist" aria-label="Carousel position">
            {fallbackChannels.map(([channel], i) => (
              <button
                key={channel}
                type="button"
                role="tab"
                data-carousel-dot
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === carouselIndex ? 'true' : undefined}
                className={`studio-carousel__dot${i === carouselIndex ? ' studio-carousel__dot--active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          {/* Copy-link affordance: mints an attributed share URL and writes it to clipboard */}
          <div className="studio-carousel__copylink">
            <button
              type="button"
              className="studio-carousel__copylink-btn"
              onClick={handleCopyLink}
              aria-live="polite"
            >
              {linkCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </section>
      </Instrumented>

      {/* ===== SHAREABLE MILESTONE CARD ===== */}
      <div className="v4-block">
        <div
          className="celebrate"
          data-overlay-tier="2"
          data-overlay-delta="C6"
          data-overlay-events="Share Clicked"
          data-overlay-metric="Share — milestone celebration card"
          data-overlay-why="A screenshot-ready celebration card turns a community milestone into shareable social currency."
          data-overlay-dashboard="share-trends"
        >
          <div className="celebrate__big">{milestoneText}</div>
          <div className="celebrate__sub">{milestoneSub}</div>
          <button
            type="button"
            className="btn btn--lime btn--sm"
            style={{ marginTop: 'var(--hrt-size-spacing-2)' }}
            onClick={handleMilestoneShare}
          >
            Share this milestone
          </button>
        </div>
      </div>

      {/* ===== TOP INVITERS BOARD ===== */}
      <section
        className="sharerboard v4-block"
        data-screen-label="Top inviters"
        data-overlay-tier="2"
        data-overlay-delta="C6"
        data-overlay-events="Section Viewed"
        data-overlay-metric="Share — gamified inviting"
        data-overlay-why="A leaderboard of inviters makes growing the community a status game."
        data-overlay-dashboard="share-trends"
      >
        <h2 className="v4-h">Top inviters this week</h2>
        <p className="muted" style={{ fontSize: 'var(--hrt-size-font-body-sm)', margin: '0 0 var(--hrt-size-spacing-2)' }}>
          Members bringing the most people to the cause.
        </p>
        {TOP_INVITERS.map((inv, i) => {
          const persona = getPersonaByName(inv.name);
          return (
            <div className="sharerrow" key={inv.name}>
              <span className="sharerrow__rank">{i + 1}</span>
              <Avatar
                size="sm"
                initial={persona?.avatar.initial ?? inv.initials.charAt(0)}
                bg={persona?.avatar.bg}
                fg={persona?.avatar.fg}
                pfpUrl={persona?.avatar.pfpUrl}
                label={inv.name}
              />
              <span className="sharerrow__nm">{inv.name}</span>
              <span className="sharerrow__stat">
                <strong>{inv.invites} invites</strong>
                <div>{inv.joined} joined</div>
              </span>
            </div>
          );
        })}
      </section>
    </>
  );
}
