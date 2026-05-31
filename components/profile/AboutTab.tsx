/**
 * AboutTab — the About tab content.
 *
 * Matches mock structure:
 *   h3.section-h "Bio" + p bio text
 *   h3.section-h "Joined GoFundMe" + p.muted year
 *
 * P3: cause pills intentionally NOT rendered here — relocated to hero per P3.
 */

import React from 'react';
import type { ProfileRow } from '@/lib/db/queries';

export interface AboutTabProps {
  profile: ProfileRow;
  isOwnerView: boolean;
}

export function AboutTab({ profile, isOwnerView }: AboutTabProps) {
  return (
    <section aria-label="About" data-section-name="About Tab">
      {/* Bio */}
      <h3 className="section-h" style={{ marginBottom: 'var(--hrt-size-spacing-1)' }}>
        Bio
      </h3>
      {profile.bio ? (
        <p style={{ margin: 0 }}>{profile.bio}</p>
      ) : isOwnerView ? (
        <p className="muted" style={{ margin: 0 }}>
          No bio yet.{' '}
          <a
            href={`/u/${profile.handle}/edit#bio`}
            style={{ color: 'var(--hrt-color-text-brand)', fontWeight: 'var(--hrt-font-weight-bold)' }}
          >
            Add a bio
          </a>
        </p>
      ) : (
        <p className="muted" style={{ margin: 0 }}>No bio shared yet.</p>
      )}

      {/* Joined GoFundMe */}
      {typeof profile.joined_year === 'number' && (
        <>
          <h3
            className="section-h"
            style={{
              margin: 'var(--hrt-size-spacing-3) 0 var(--hrt-size-spacing-1)',
            }}
          >
            Joined GoFundMe
          </h3>
          <p className="muted" style={{ margin: 0, fontSize: 'var(--hrt-size-font-body-sm)' }}>
            {profile.joined_year}
          </p>
        </>
      )}

      {/* Cause pills intentionally NOT here — relocated to hero per P3. Do not duplicate. */}
    </section>
  );
}
