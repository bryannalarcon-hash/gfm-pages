'use client';
/**
 * StickyCompactHeader — compact profile header that slides in after scrolling past the hero.
 *
 * Matches mock: <div class="chead" id="chead">
 *   .chead__inner: avatar--sm + name + Follow btn (primary) + Share btn (secondary)
 *
 * Shows when scrollY > 320. Hidden by default (transform: translateY(-120%)).
 * Add class 'show' to reveal (transform: translateY(0)).
 *
 * The Follow button in this bar uses the same isFollowing state as the hero.
 * Owner view: no Follow CTA.
 */

import React, { useEffect, useRef } from 'react';
import { capture } from '@/lib/analytics/capture';
import { useOverlay } from '@/lib/overlay/context';

export interface StickyCompactHeaderProps {
  displayName: string;
  isFollowing: boolean;
  isOwnerView: boolean;
  onFollowToggle: () => void;
  onShare: () => void;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '').toUpperCase();
}

export function StickyCompactHeader({
  displayName,
  isFollowing,
  isOwnerView,
  onFollowToggle,
  onShare,
}: StickyCompactHeaderProps) {
  const cheadRef = useRef<HTMLDivElement>(null);
  // CB-49: drop below the overlay scrim (z-index 900) while overlay is on so it gets dimmed.
  // Must NOT highlight (CB-35) — just be dimmed.
  const { overlayOn } = useOverlay();

  useEffect(() => {
    const el = cheadRef.current;
    if (!el) return;

    function handleScroll() {
      if (!el) return;
      if (window.scrollY > 320) {
        el.classList.add('show');
      } else {
        el.classList.remove('show');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const firstName = displayName.split(' ')[0];
  const initials = initialsFor(displayName);

  return (
    <div
      className="chead"
      id="chead"
      ref={cheadRef}
      style={overlayOn ? { zIndex: 899 } : undefined}
    >
      <div className="hrt-container xl chead__inner">
        <span className="avatar avatar--sm" aria-hidden="true">
          {initials}
        </span>
        <span className="chead__name">{displayName}</span>

        {!isOwnerView && (
          <>
            {!isFollowing ? (
              <button
                type="button"
                className="btn btn--primary btn--sm js-follow"
                data-variant="primary"
                onClick={() => {
                  capture('Follow Clicked', { follow_context: 'sticky_header' });
                  onFollowToggle();
                }}
              >
                Follow {firstName}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--following btn--sm js-follow"
                onClick={() => {
                  capture('Follow Clicked', { follow_context: 'sticky_header' });
                  onFollowToggle();
                }}
              >
                Following
              </button>
            )}
          </>
        )}

        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={onShare}
          aria-label="Share profile"
        >
          Share
        </button>
      </div>
    </div>
  );
}
