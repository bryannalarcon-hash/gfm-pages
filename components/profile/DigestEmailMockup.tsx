'use client';
/**
 * DigestEmailMockup — P2 weekly digest email visual mockup (profile-wireframe §7).
 *
 * Matches mock's modal body structure (email__body section):
 *   - Subject line + preview
 *   - Activity rows using .arow classes (same as activity feed)
 *   - Footer with unsubscribe links + address
 *
 * This is the BODY content rendered inside the email modal (.email).
 * The modal chrome (.email__bar with close button) is owned by ProfilePage.
 */

import React from 'react';

interface DigestRow {
  initial: string;
  verb: 'Updated' | 'Published' | 'Donated';
  title: string;
  meta: string;
  href: string;
}

// Static fixture rows matching wireframe §7
const SAMPLE_ROWS: DigestRow[] = [
  {
    initial: 'R',
    verb: 'Updated',
    title: 'Real-Time Alerts for Wildfire Safety',
    meta: 'posted an update · 4 days ago',
    href: '/f/realtime-alerts-for-wildfire-safety-r5jkk',
  },
  {
    initial: 'J',
    verb: 'Published',
    title: 'Janahan started "Save the Park at Ossabaw Island"',
    meta: '6 days ago',
    href: '/f/save-the-park-ossabaw',
  },
  {
    initial: 'S',
    verb: 'Donated',
    title: 'Sarah M. donated to "Keep Sandy on Ossabaw"',
    meta: '7 days ago',
    href: '/f/keep-sandy-on-ossabaw',
  },
];

export function DigestEmailMockup() {
  return (
    <>
      <div className="muted" style={{ fontSize: 'var(--hrt-size-font-body-xs)' }}>
        Subject
      </div>
      <div style={{ fontWeight: 'var(--hrt-font-weight-bold)', marginBottom: 'var(--hrt-size-spacing-2)' }}>
        4 updates from people you follow on GoFundMe
      </div>
      <p style={{ margin: '0 0 var(--hrt-size-spacing-2)' }}>
        Here&rsquo;s what happened since your last visit.
      </p>

      {/* Activity rows using shared .arow CSS */}
      {SAMPLE_ROWS.map((row) => (
        <div className="arow" key={row.title}>
          <span className="avatar avatar--sm" aria-hidden="true">{row.initial}</span>
          <div className="arow__body">
            <div className="verb">{row.verb}</div>
            <div className="arow__title">{row.title}</div>
            <div className="arow__meta">{row.meta}</div>
          </div>
          <a className="arow__cta" href={row.href}>
            {row.verb === 'Updated' ? 'Read' : 'View'} →
          </a>
        </div>
      ))}

      {/* Email footer */}
      <div className="email__foot">
        Braze · Sunday 9 AM local (adjustable: weekly / monthly / off) · referrer_source = profile_digest_email
        <br />
        <a href="#" style={{ color: 'var(--hrt-color-text-brand)' }}>Manage email preferences</a>
        {' · '}
        <a href="#" style={{ color: 'var(--hrt-color-text-brand)' }}>Unsubscribe</a>
        <br />
        GoFundMe · 855 Jefferson Ave, Redwood City, CA 94063
      </div>
    </>
  );
}
