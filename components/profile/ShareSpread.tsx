'use client';
/**
 * ShareSpread — P8 profile share studio (the ".spread" section).
 *
 * Placed below suns + fundraisers per mock section order.
 * Shows 2 channel cards (WhatsApp friend tone, Email personal note) using
 * pre-fetched AI copy. Primary CTA on each card uses btn--primary (#232323 on white).
 *
 * NO green CTA on white.
 */

import React, { useCallback } from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import { usePersona } from '@/lib/overlay/context';
import { capture } from '@/lib/analytics/capture';
import type { ShareChannel } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';
import { PROFILE_SHARE_COPY } from '@/fixtures/shareCopyProfileCommunity';

export interface ShareSpreadProps {
  profileDisplayName: string;
  profileHandle: string;
  copyByChannel: Partial<Record<ShareChannel, string>>;
  overlay: OverlayAttrs;
}

const GENERIC_WHATSAPP = (name: string) =>
  `You should follow ${name} on GoFundMe — they've organized fundraisers for people who need it. Good people. 👇`;
const GENERIC_EMAIL = (name: string) =>
  `I wanted to introduce you to ${name} — they've been quietly organizing fundraisers for causes I think you'd care about. Here's their profile…`;

// Owner-tone copy — first-person voice for when the profile owner views their own profile.
// Static strings only (no real-time LLM on the request path).
const OWNER_WHATSAPP =
  "I've been organizing fundraisers for causes close to me — would mean a lot if you followed along and shared. 🙏";
const OWNER_EMAIL =
  "I wanted to share my GoFundMe profile with you — it's where I keep all the causes I'm organizing for. Would love your support…";

export function ShareSpread({ profileDisplayName, profileHandle, copyByChannel, overlay }: ShareSpreadProps) {
  const user = usePersona();
  const isOwner = user.isProfileOwner && profileHandle === 'janahan';
  const firstName = profileDisplayName.split(' ')[0];

  const personaCopy = PROFILE_SHARE_COPY[user.slug];
  const GENERIC_WA = GENERIC_WHATSAPP(profileDisplayName);
  const GENERIC_EM = GENERIC_EMAIL(profileDisplayName);

  const waText = isOwner
    ? OWNER_WHATSAPP
    : (personaCopy?.['whatsapp'] ?? copyByChannel['whatsapp'] ?? GENERIC_WA);
  const emailText = isOwner
    ? OWNER_EMAIL
    : (personaCopy?.['email'] ?? copyByChannel['email'] ?? GENERIC_EM);

  const handleShare = useCallback((channel: ShareChannel) => {
    capture('Share Clicked', { share_channel: channel, share_context: 'studio' });
  }, []);

  return (
    <Instrumented attrs={overlay} regionLabel="profile-share-studio-p8">
      <section
        className="spread"
        data-screen-label="Intro studio"
      >
        <div className="spread__eyebrow">A warm intro goes far</div>
        <h2 className="spread__head">Introduce {firstName}</h2>
        <p className="spread__sub">
          Send a ready-made intro to someone who&rsquo;d care about these causes.
        </p>

        <div className="studio">
          {/* WhatsApp card */}
          <div className="scard">
            <div className="scard__head">
              <span className="chip" style={{ background: '#e7fce3', color: '#1f8a4c' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </span>
              WhatsApp <span className="scard__tone">&middot; friend tone</span>
            </div>
            <div className="bubble bubble--wa">{waText}</div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              data-variant="primary"
              onClick={() => handleShare('whatsapp')}
            >
              Send on WhatsApp
            </button>
          </div>

          {/* Email card */}
          <div className="scard">
            <div className="scard__head">
              <span className="chip" style={{ background: '#f0f0f0', color: '#6f6f6f' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </span>
              Email <span className="scard__tone">&middot; personal note</span>
            </div>
            <div className="bubble">{emailText}</div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              data-variant="primary"
              onClick={() => handleShare('email')}
            >
              Compose email
            </button>
          </div>
        </div>
      </section>
    </Instrumented>
  );
}
