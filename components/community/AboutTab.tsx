// AboutTab — KEEP-AS-IS region per assignment brief.
// Matches mocks/community-v4.2.html about tab section exactly:
//   h2.section-h + p + h3 (guidelines) + p.muted + h3 (organized by) + link

import React from 'react';
import type { CommunityRow } from '@/components/community/types';

interface AboutTabProps {
  community: CommunityRow;
  hidden?: boolean;
}

export function AboutTab({ community, hidden }: AboutTabProps) {
  // Initials for organizer avatar
  const avi = community.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'WD';

  return (
    <section className="tabpanel" id="tab-about" role="tabpanel" data-screen-label="About tab" hidden={hidden || undefined}>
      <h2 className="section-h" style={{ marginBottom: 'var(--hrt-size-spacing-2)' }}>
        About {community.name}
      </h2>
      <p style={{ margin: 0 }}>
        {community.description ??
          `${community.name} is a community dedicated to keeping people safe. A network of volunteers track and share real-time information so people can make informed decisions.`}
      </p>

      <h3 className="section-h" style={{ margin: 'var(--hrt-size-spacing-3) 0 var(--hrt-size-spacing-1)' }}>
        Community guidelines
      </h3>
      <p className="muted" style={{ margin: 0, fontSize: 'var(--hrt-size-font-body-sm)' }}>
        Be kind, stay on-topic, and never share information that could compromise an active response.
        Posts are moderated by community organizers.
      </p>

      <h3 className="section-h" style={{ margin: 'var(--hrt-size-spacing-3) 0 var(--hrt-size-spacing-1)' }}>
        Organized by
      </h3>
      <a
        href="#"
        className="row gap-2"
        style={{ color: 'var(--hrt-color-text-brand)', fontWeight: 'var(--hrt-font-weight-bold)' as 'bold' }}
        aria-label={`${community.name} organizer profile`}
      >
        <span className="avatar avatar--sm">{avi}</span>
        {' '}{community.name} Team
      </a>
    </section>
  );
}
