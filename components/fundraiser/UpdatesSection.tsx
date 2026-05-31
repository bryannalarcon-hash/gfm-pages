'use client';
/**
 * UpdatesSection — D4 (per-update share row) + D13 (update bodies shown, summary feeds D8 banner).
 * Renders all campaign updates with expandable bodies and per-channel share rows.
 *
 * CB-53: Share buttons are clickable and open a platform-personalized message from the
 *        (persona × channel) matrix. Fires canonical 'Share Clicked' with share_channel.
 * CB-54: Share buttons render real platform SVG icons from components/shared/icons.tsx —
 *        not the old name+color placeholder boxes.
 * CB-50: No raw "copy_link" slug in rendered text; label is "Copy link".
 */

import React, { useState, useCallback } from 'react';
import { Avatar } from '@/components/shared/Avatar';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import { mintShareId, buildAttributedShareUrl } from '@/lib/marks/attribution';
import { getPersonaByName } from '@/lib/personas/loader';
import type { UpdateRow } from '@/lib/db/queries';
import type { ShareChannel } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';
import {
  IconFacebook,
  IconX,
  IconWhatsapp,
  IconMessenger,
  IconSms,
  IconEmail,
  IconLink,
} from '@/components/shared/icons';

export interface UpdatesSectionProps {
  fundraiserId: string;
  updates: UpdateRow[];
  copyByChannel: Partial<Record<ShareChannel, string>>;
}

const D4_UPDATE_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Share Clicked',
  'data-overlay-delta': 'D4',
  'data-overlay-metric': 'share-rate',
  'data-overlay-why': 'Per-channel share anchored under updates captures post-reading emotion',
  'data-overlay-dashboard': 'share-trends',
};

// CB-75: cap to 5 visible channels so the row truncates cleanly (no half-cut button on mobile).
// facebook, whatsapp, x, email, copy_link covers the highest-traffic channels.
const SHARE_CHANNELS: ShareChannel[] = ['facebook', 'whatsapp', 'x', 'email', 'copy_link'];

// CB-54: use real platform icons; CB-50: label is "Copy link" (natural), never "copy_link"
const CHANNEL_META: Record<
  ShareChannel,
  { label: string; color: string; Icon: React.ComponentType<{ size?: number | string }> }
> = {
  facebook:     { label: 'Facebook',  color: '#1877F2', Icon: IconFacebook },
  x:            { label: 'X',         color: '#000',    Icon: IconX },
  whatsapp:     { label: 'WhatsApp',  color: '#25D366', Icon: IconWhatsapp },
  messenger:    { label: 'Messenger', color: '#0084FF', Icon: IconMessenger },
  sms:          { label: 'SMS',       color: '#34C759', Icon: IconSms },
  email:        { label: 'Email',     color: '#6f6f6f', Icon: IconEmail },
  copy_link:    { label: 'Copy link', color: '#b7b7b6', Icon: IconLink },
  native_share: { label: 'Share',     color: '#b7b7b6', Icon: IconLink },
  embed:        { label: 'Embed',     color: '#b7b7b6', Icon: IconLink },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function UpdatesSection({ fundraiserId, updates, copyByChannel }: UpdatesSectionProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copiedUpdateId, setCopiedUpdateId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  // CB-53: clicking a share button opens the platform-personalized message for that channel,
  // writes/shares as appropriate, and fires canonical 'Share Clicked' with share_channel.
  const handleShare = useCallback((channel: ShareChannel, updateId: string) => {
    const shareId = mintShareId({ entityType: 'fundraiser', entityId: fundraiserId, sharerToken: 'viewer', channel });

    if (channel === 'copy_link') {
      // For copy_link: build attributed URL (reuses buildAttributedShareUrl, per CB-32 pattern).
      const url = buildAttributedShareUrl({
        basePath: `/f/${fundraiserId}`,
        shareId,
        channel,
      });
      // Guard: navigator.clipboard may be absent in non-secure contexts or older browsers.
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {
          // Silently ignore clipboard errors.
        });
      }
      setCopiedUpdateId(updateId);
      setTimeout(() => setCopiedUpdateId((prev) => (prev === updateId ? null : prev)), 2000);
      capture('Share Clicked', { share_channel: channel, share_context: 'update', share_id: shareId });
      return;
    }

    // For other channels: use platform-personalized copy from copyByChannel (CB-47 matrix).
    const copy = copyByChannel[channel] ?? '';
    capture('Share Clicked', { share_channel: channel, share_context: 'update', share_id: shareId, copy });
  }, [fundraiserId, copyByChannel]);

  if (updates.length === 0) return null;

  return (
    <section id="updates" aria-label="Updates" className="mt-[var(--hrt-size-spacing-3)]">
      <h2 className="m-0 mb-[var(--hrt-size-spacing-2)] font-bold text-[var(--hrt-color-text-headings)]"
        style={{ fontSize: 'var(--hrt-size-font-heading-sm)' }}>
        Updates
      </h2>
      <div className="flex flex-col gap-[var(--hrt-size-spacing-2)]">
        {updates.map((upd) => {
          const isExp = expanded.has(upd.id);
          const isCopied = copiedUpdateId === upd.id;
          return (
            <article key={upd.id}
              className="rounded-xxxl border border-[var(--hrt-color-border-neutral-extra-subtle)] bg-[var(--hrt-color-surface-raised)] p-[var(--hrt-size-spacing-3)]"
              style={{ boxShadow: '0px 2px 6px #0000001a' }}>
              <div className="flex items-center gap-[var(--hrt-size-spacing-1)] mb-[var(--hrt-size-spacing-1)]">
                {/* CB-76: resolve PFP for named personas (e.g. organizer Sarah J.) */}
                {(() => {
                  const authorPersona = getPersonaByName(upd.author_name);
                  return (
                    <Avatar
                      initial={upd.author_name.charAt(0).toUpperCase()}
                      bg={authorPersona?.avatar.bg}
                      fg={authorPersona?.avatar.fg}
                      pfpUrl={authorPersona?.avatar.pfpUrl}
                      size="sm"
                      label={upd.author_name}
                    />
                  );
                })()}
                <span className="text-body-sm font-bold text-[var(--hrt-color-text-default)]">{upd.author_name}</span>
                <span className="text-body-sm text-[var(--hrt-color-text-supporting)]">· {formatDate(upd.created_at)}</span>
              </div>

              <p className={['text-body-md text-[var(--hrt-color-text-default)] leading-relaxed m-0', isExp ? '' : 'line-clamp-3'].join(' ')}>
                {upd.body}
              </p>

              <button type="button" onClick={() => toggle(upd.id)}
                className="mt-1 text-body-sm font-bold text-[var(--hrt-color-text-brand-strong)] bg-transparent border-0 cursor-pointer hover:underline">
                {isExp ? 'Show less ▴' : 'Read full update ▾'}
              </button>

              {/* D4 per-update share row — CB-53 clickable, CB-54 real icons */}
              <Instrumented attrs={D4_UPDATE_OVERLAY} regionLabel={`update-share-${upd.id}`}>
                <div className="flex gap-[var(--hrt-size-spacing-1)] overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] mt-[var(--hrt-size-spacing-1)]"
                  role="list" aria-label="Share this update">
                  {SHARE_CHANNELS.map((ch) => {
                    const meta = CHANNEL_META[ch];
                    const isLink = ch === 'copy_link';
                    return (
                      <div key={ch} role="listitem">
                        <button
                          type="button"
                          onClick={() => handleShare(ch, upd.id)}
                          aria-label={isLink && isCopied ? 'Copied!' : meta.label}
                          aria-live={isLink ? 'polite' : undefined}
                          // CB-75: w-9/h-9 maps to spacing-9 = 4.5rem = 72px in this token set.
                          // Use explicit px sizing to get ~36px circular buttons on mobile.
                          className="flex-none inline-flex items-center justify-center rounded-full text-white transition-opacity hover:opacity-80"
                          style={{ backgroundColor: meta.color, width: 36, height: 36 }}
                        >
                          {/* CB-54: render the real platform SVG icon — no bare text label */}
                          <meta.Icon size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Instrumented>
            </article>
          );
        })}
      </div>
    </section>
  );
}
