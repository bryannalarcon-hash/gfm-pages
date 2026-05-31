'use client';

/**
 * ShareSheet — per-channel share studio.
 *
 * Two rendering modes controlled by the `context` prop:
 *   - Default ("fundraiser" page, community, profile): mobile horizontal scroll-snap
 *     carousel (86% card width, peek of next); desktop 2–3 column grid.
 *   - Compact ("post_donate"): a single-row chip strip matching the mock's pd__sect
 *     share row — icon chip + label, no copy-preview card, no multi-row grid.
 *     Keeps all 7 channels in one row via horizontal scroll on any viewport.
 *
 * Props come pre-loaded with AI copy from server (no DB reads here).
 * btn--lime bug resolved: the on-strong CTA (#ccf88e on green chip) is only
 * rendered when the chip itself provides a dark/colored surface — never a
 * free-floating green button on white.
 *
 * Channel-brand chip colors are a documented exception to the token rule.
 */

import React, { useCallback } from 'react';
import type { ShareChannel } from '@/lib/types';
import { mintShareId, buildAttributedShareUrl } from '@/lib/marks/attribution';
import {
  IconFacebook,
  IconX,
  IconWhatsapp,
  IconMessenger,
  IconSms,
  IconEmail,
  IconLink,
  IconCheck,
} from './icons';

export interface ShareSheetProps {
  entityType: 'fundraiser' | 'community' | 'profile';
  entityId: string;
  /** Pre-fetched copy per channel. Falls back to generic copy if missing. */
  copyByChannel: Partial<Record<ShareChannel, string>>;
  /**
   * Context driving the rendering mode.
   * "post_donate" → compact chip-row (matches mock pd__sect share row).
   * Any other value → full card grid / carousel layout.
   */
  context: string;
  onShare: (channel: ShareChannel, copy: string) => void;
}

// Channel-brand colors — documented exception to token rule (brand identity)
const CHANNEL_META: Record<
  ShareChannel,
  { label: string; chipBg: string; chipFg: string; Icon: React.ComponentType<{ size?: number | string; className?: string }> }
> = {
  facebook:     { label: 'Facebook',  chipBg: '#1877F2', chipFg: '#fff',     Icon: IconFacebook },
  x:            { label: 'X',         chipBg: '#000',    chipFg: '#fff',     Icon: IconX },
  whatsapp:     { label: 'WhatsApp',  chipBg: '#25D366', chipFg: '#fff',     Icon: IconWhatsapp },
  messenger:    { label: 'Messenger', chipBg: '#0084FF', chipFg: '#fff',     Icon: IconMessenger },
  sms:          { label: 'SMS',       chipBg: '#34C759', chipFg: '#fff',     Icon: IconSms },
  email:        { label: 'Email',     chipBg: '#6f6f6f', chipFg: '#fff',     Icon: IconEmail },
  copy_link:    { label: 'Copy link', chipBg: 'var(--hrt-color-surface-neutral-medium)', chipFg: 'var(--hrt-color-text-default)', Icon: IconLink },
  native_share: { label: 'Share',     chipBg: 'var(--hrt-color-surface-neutral-medium)', chipFg: 'var(--hrt-color-text-default)', Icon: IconLink },
  embed:        { label: 'Embed',     chipBg: 'var(--hrt-color-surface-neutral-medium)', chipFg: 'var(--hrt-color-text-default)', Icon: IconLink },
};

const VISIBLE_CHANNELS: ShareChannel[] = ['facebook', 'x', 'whatsapp', 'messenger', 'sms', 'email', 'copy_link'];

const GENERIC_COPY: Record<ShareChannel, string> = {
  facebook:     'Help us reach our goal — share this fundraiser on Facebook.',
  x:            'Help this fundraiser reach its goal. Every share counts.',
  whatsapp:     'Hi! I thought you might want to support this fundraiser.',
  messenger:    'Hey, check out this fundraiser — would mean a lot if you shared it.',
  sms:          'Hi! Please share this fundraiser — every share helps.',
  email:        'I wanted to share this fundraiser with you.',
  copy_link:    'Copy the link to share this fundraiser anywhere.',
  native_share: 'Share this fundraiser.',
  embed:        'Embed this fundraiser on your site.',
};

// ─── Compact chip (post_donate context) ────────────────────────────────────

interface CompactChipProps {
  channel: ShareChannel;
  copy: string;
  entityType: 'fundraiser' | 'community' | 'profile';
  entityId: string;
  onShare: (channel: ShareChannel, copy: string) => void;
}

function CompactChip({ channel, copy, entityType, entityId, onShare }: CompactChipProps) {
  const meta = CHANNEL_META[channel];
  const isCopyLink = channel === 'copy_link';
  const [copied, setCopied] = React.useState(false);

  const handleClick = useCallback(() => {
    if (isCopyLink) {
      const shareId = mintShareId({ entityType, entityId, sharerToken: 'viewer', channel });
      const basePath = `/${entityType === 'fundraiser' ? 'f' : entityType === 'community' ? 'communities' : 'profiles'}/${entityId}`;
      const url = buildAttributedShareUrl({ basePath, shareId, channel });
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2000);
      onShare(channel, url);
      return () => clearTimeout(timer);
    }
    onShare(channel, copy);
  }, [channel, copy, entityType, entityId, isCopyLink, onShare]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? 'Copied!' : meta.label}
      aria-live={isCopyLink ? 'polite' : undefined}
      title={meta.label}
      className="flex flex-col items-center gap-1 flex-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hrt-color-border-brand)]"
    >
      <span
        className="rounded-full inline-flex items-center justify-center transition-transform active:scale-95"
        style={{ backgroundColor: meta.chipBg, color: meta.chipFg, width: 40, height: 40 }}
      >
        {copied ? <IconCheck size={18} /> : <meta.Icon size={18} />}
      </span>
      <span className="text-[0.625rem] leading-none text-[var(--hrt-color-text-supporting)] whitespace-nowrap">
        {copied ? 'Copied!' : meta.label}
      </span>
    </button>
  );
}

// ─── Full channel card (default context) ───────────────────────────────────

interface ChannelCardProps {
  channel: ShareChannel;
  copy: string;
  entityType: 'fundraiser' | 'community' | 'profile';
  entityId: string;
  onShare: (channel: ShareChannel, copy: string) => void;
}

function ChannelCard({ channel, copy, entityType, entityId, onShare }: ChannelCardProps) {
  const meta = CHANNEL_META[channel];
  const isCopyLink = channel === 'copy_link';
  const [copied, setCopied] = React.useState(false);

  const handleClick = useCallback(() => {
    if (isCopyLink) {
      // Build an attributed share URL carrying a freshly-minted share_id + utm_share_* params.
      const shareId = mintShareId({ entityType, entityId, sharerToken: 'viewer', channel });
      const basePath = `/${entityType === 'fundraiser' ? 'f' : entityType === 'community' ? 'communities' : 'profiles'}/${entityId}`;
      const url = buildAttributedShareUrl({ basePath, shareId, channel });

      // Guard: navigator.clipboard may be absent in non-secure contexts or older browsers.
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {
          // Silently ignore clipboard errors — the Copied! UI still shows as a best-effort affordance.
        });
      }

      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2000);
      // Fire onShare with the constructed URL so callers can log / capture the attributed share.
      onShare(channel, url);
      return () => clearTimeout(timer);
    }
    onShare(channel, copy);
  }, [channel, copy, entityType, entityId, isCopyLink, onShare]);

  return (
    <div
      className={[
        // Carousel: snap + fixed width; grid: natural sizing
        'scroll-snap-align-center sm:scroll-snap-align-none',
        'flex-none w-[86%] sm:w-auto',
        'bg-[var(--hrt-color-surface-raised)]',
        'border border-[var(--hrt-color-border-neutral-extra-subtle)]',
        'rounded-lg p-[0.75rem]',
        'flex flex-col gap-1',
      ].join(' ')}
      style={{ scrollSnapAlign: 'center' }}
    >
      {/* Channel header */}
      <div className="flex items-center gap-[var(--hrt-size-spacing-1)]">
        <span
          className="w-6 h-6 rounded-full inline-flex items-center justify-center flex-none"
          style={{ backgroundColor: meta.chipBg, color: meta.chipFg }}
          aria-hidden="true"
        >
          <meta.Icon size={14} />
        </span>
        <span className="text-body-sm font-bold text-[var(--hrt-color-text-default)]">
          {meta.label}
        </span>
      </div>

      {/* Copy preview bubble — no flex-1: shrinks to content (line-clamp-3 caps it) */}
      <div
        className="bg-[var(--hrt-color-surface-neutral-subtle)] rounded-md p-[var(--hrt-size-spacing-1)] text-body-sm leading-snug text-[var(--hrt-color-text-default)] line-clamp-3"
        aria-label={`Preview copy for ${meta.label}`}
      >
        {copy}
      </div>

      {/* CTA — primary (#232323 on white, NOT green on white) */}
      <button
        type="button"
        onClick={handleClick}
        className={[
          'w-full rounded-full font-bold text-body-sm',
          'min-h-[var(--hrt-size-spacing-4)] px-[var(--hrt-size-spacing-2)]',
          'border border-transparent',
          'transition-[background] duration-[var(--hrt-time-transition-fast)] ease-[var(--hrt-ease-default)]',
          copied
            ? 'bg-[var(--hrt-color-surface-brand-subtle)] text-[var(--hrt-color-text-brand-strong)]'
            : 'bg-[var(--hrt-color-button-primary-surface)] text-[var(--hrt-color-button-primary-text)] hover:bg-[var(--hrt-color-button-primary-surface-hover)]',
          'flex items-center justify-center gap-1',
        ].join(' ')}
        aria-live={isCopyLink ? 'polite' : undefined}
      >
        {copied ? (
          <>
            <IconCheck size={16} />
            Copied!
          </>
        ) : (
          `Share on ${meta.label}`
        )}
      </button>
    </div>
  );
}

// ─── ShareSheet root ────────────────────────────────────────────────────────

export function ShareSheet({ entityType, entityId, copyByChannel, context, onShare }: ShareSheetProps) {
  const isCompact = context === 'post_donate';

  if (isCompact) {
    // Compact chip-row layout matching mock pd__sect share row.
    // All 7 channels in a single horizontal row; scrolls on narrow viewports.
    return (
      <div
        className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        role="list"
        aria-label="Share channels"
      >
        {VISIBLE_CHANNELS.map((channel) => {
          const copy = copyByChannel[channel] ?? GENERIC_COPY[channel];
          return (
            <div key={channel} role="listitem">
              <CompactChip
                channel={channel}
                copy={copy}
                entityType={entityType}
                entityId={entityId}
                onShare={onShare}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: horizontal scroll-snap carousel; Desktop: grid */}
      <div
        className={[
          // Carousel behavior on mobile
          'flex gap-1',
          'overflow-x-auto',
          'pb-[var(--hrt-size-spacing-1)]',
          // Hide scrollbar
          '[&::-webkit-scrollbar]:hidden [scrollbar-width:none]',
          // Desktop: grid — gap-1 = spacing-1 = 8px
          'sm:grid sm:grid-cols-2 sm:gap-1 sm:overflow-visible lg:grid-cols-3',
        ].join(' ')}
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        role="list"
        aria-label="Share channels"
      >
        {VISIBLE_CHANNELS.map((channel) => {
          const copy = copyByChannel[channel] ?? GENERIC_COPY[channel];
          return (
            <div key={channel} role="listitem">
              <ChannelCard
                channel={channel}
                copy={copy}
                entityType={entityType}
                entityId={entityId}
                onShare={onShare}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
