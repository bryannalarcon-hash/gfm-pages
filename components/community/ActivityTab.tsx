'use client';
// ActivityTab — C2, C3.
// Matches mocks/community-v4.2.html activity tab section exactly:
//   .divider (C2 "Since your last visit")
//   .post cards (post__head, post__verb, post__title, post__body, post__img, post__link, post__react)
//   .strip PYMK after item 3 (C3) — .pymkcard with inline Follow
//   Load more button

import React, { useState, useCallback } from 'react';
import type { PageContext, PymkCard } from '@/lib/types';
import type { ActivityItem } from '@/components/community/types';
import type { OverlayAttrs } from '@/lib/overlay/types';
import { PersonalizedSlot } from '@/components/slots/PersonalizedSlot';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import { Avatar } from '@/components/shared/Avatar';
import { getPersonaByName } from '@/lib/personas/loader';

// ---- helpers ----

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/** Verb → human readable post type label (all-caps eyebrow style) */
function verbLabel(verb: string): string {
  switch (verb.toLowerCase()) {
    case 'donated': return 'Supporter post';
    case 'started': return 'New fundraiser';
    case 'milestone': return 'Milestone';
    case 'update': return 'Fundraiser update';
    default: return verb.charAt(0).toUpperCase() + verb.slice(1);
  }
}

/** Post title derived from activity body or verb */
function postTitle(item: ActivityItem): string {
  if (item.body && item.body.length > 0) {
    // Use first sentence of body as title (up to 80 chars)
    const sentence = item.body.split(/[.!?]/)[0].trim();
    return sentence.length > 0 ? sentence : item.actor_name;
  }
  switch (item.verb.toLowerCase()) {
    case 'donated': return `${item.actor_name} donated`;
    case 'started': return `${item.actor_name} started a new fundraiser`;
    case 'milestone': return 'Community milestone reached';
    default: return item.body ?? item.actor_name;
  }
}

/** Post body text (the paragraph after the title) */
function postBody(item: ActivityItem): string {
  if (!item.body) return '';
  const sentences = item.body.split(/(?<=[.!?])\s+/);
  // Return everything after the first sentence (or full body if one sentence)
  return sentences.length > 1 ? sentences.slice(1).join(' ') : item.body;
}

/** Avatar initials from actor name */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Role label for a post verb */
function roleLabel(verb: string): string {
  switch (verb.toLowerCase()) {
    case 'donated': return 'Supporter';
    case 'started': return 'Member';
    case 'milestone': return 'Community';
    case 'update': return 'Organizer';
    default: return 'Member';
  }
}

// ---- Post card component ----

interface PostCardProps {
  item: ActivityItem;
  isNew: boolean;
  pageCtx: PageContext;
}

function PostCard({ item, pageCtx }: PostCardProps) {
  const [reactionCount, setReactionCount] = useState(item.reaction_count);
  const [reacted, setReacted] = useState(false);

  const handleReact = useCallback(() => {
    setReacted((prev) => {
      const next = !prev;
      setReactionCount((c) => c + (next ? 1 : -1));
      return next;
    });
  }, []);

  const handleBodyClick = useCallback(() => {
    capture('Update Read', {
      community_id: pageCtx.communityId,
      activity_id: item.id,
      verb: item.verb,
    });
  }, [item.id, item.verb, pageCtx]);

  const handleFundraiserClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    capture('Fundraiser Clicked Through', {
      community_id: pageCtx.communityId,
      activity_id: item.id,
      section: 'activity_feed',
    });
  }, [item.id, pageCtx]);

  const isFundraiserVerb = ['started', 'update'].includes(item.verb.toLowerCase());
  const title = postTitle(item);
  const body = postBody(item);
  const ago = timeAgo(item.created_at);
  const role = roleLabel(item.verb);
  // CB-76: resolve PFP for named personas (actor_name matches persona display name).
  const actorPersona = getPersonaByName(item.actor_name);

  return (
    <article className="post" onClick={handleBodyClick}>
      {/* Post header */}
      <div className="post__head">
        <Avatar
          initial={initials(item.actor_name)}
          bg={actorPersona?.avatar.bg}
          fg={actorPersona?.avatar.fg}
          pfpUrl={actorPersona?.avatar.pfpUrl}
          size="sm"
          label={item.actor_name}
        />
        <div style={{ flex: 1 }}>
          <div className="nm">{item.actor_name}</div>
          <div className="tm">{role} · {ago}</div>
        </div>
      </div>

      {/* Verb eyebrow */}
      <div className="post__verb">{verbLabel(item.verb)}</div>

      {/* Title */}
      <h3 className="post__title">{title}</h3>

      {/* Body (if any) */}
      {body.length > 0 && (
        <p className="post__body">{body}</p>
      )}

      {/* Image placeholder */}
      <div className="ph post__img" aria-hidden="true">
        <span className="ph__label">post photo</span>
      </div>

      {/* Fundraiser link (for started/update verbs) */}
      {isFundraiserVerb && (
        <a
          className="post__link"
          href="#"
          onClick={handleFundraiserClick}
          data-dashboard-anchor="donate-funnel"
        >
          <span style={{ fontWeight: 'var(--hrt-font-weight-bold)' as 'bold', fontSize: 'var(--hrt-size-font-body-sm)' }}>
            {title}
          </span>
          <span className="muted" style={{ fontSize: 'var(--hrt-size-font-body-xs)' }}>
            View fundraiser →
          </span>
        </a>
      )}

      {/* Reactions row */}
      <div className="post__react">
        <button
          type="button"
          className={reacted ? 'react react--on js-react' : 'react js-react'}
          onClick={handleReact}
          aria-pressed={reacted}
          aria-label={reacted ? 'Unlike' : 'Like'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7.5-4.6-9.7-9.06C.86 8.7 2.3 5.5 5.3 5.06c1.9-.28 3.6.7 4.7 2.18C11.1 5.76 12.8 4.78 14.7 5.06c3 .44 4.44 3.64 3 6.88C19.5 16.4 12 21 12 21Z" />
          </svg>
          {reactionCount}
        </button>
        <button type="button" className="react" aria-label={`${item.comment_count} comments`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {item.comment_count > 0 ? item.comment_count : ''}
        </button>
        <button type="button" className="react" aria-label="Share">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    </article>
  );
}

// ---- PYMK strip component (C3) ----
// Renders the .strip with .pymkcard items — same structure as mock

interface PymkStripProps {
  pymkCards: PymkCard[];
  overlayC3: OverlayAttrs;
  pageCtx: PageContext;
}

function PymkStrip({ pymkCards, overlayC3, pageCtx }: PymkStripProps) {
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const handleFollow = useCallback((id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    capture('Section Viewed', { section: 'pymk', community_id: pageCtx.communityId });
  }, [pageCtx.communityId]);

  if (pymkCards.length === 0) return null;

  return (
    <Instrumented attrs={overlayC3} regionLabel="pymk-strip">
      <div style={{ paddingBlock: 'var(--hrt-size-spacing-2)' }}>
        <div
          className="strip js-pymk"
          data-after-only
          data-overlay-tier="2"
          data-overlay-delta="C3"
          data-overlay-events="Section Viewed, Follow Clicked"
          data-overlay-metric="PYMK strip with inline Follow"
          data-overlay-why="Donors with a mutual connection. Inline Follow closes the activation loop in-strip."
          data-overlay-dashboard="retention"
        >
          <div className="strip__head">
            <span className="strip__title">People you may know</span>
            <button className="react" aria-label="Dismiss">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="strip__scroll">
            {pymkCards.map((card) => (
              <div className="pymkcard" key={card.id}>
                <span className="avatar avatar--md">{card.avatar.initial}</span>
                <span className="pymkcard__name">{card.name}</span>
                <button
                  type="button"
                  className={followed.has(card.id) ? 'btn btn--following btn--sm js-pfollow' : 'btn btn--primary btn--sm js-pfollow'}
                  onClick={() => handleFollow(card.id)}
                >
                  {followed.has(card.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Instrumented>
  );
}

// ---- ActivityTab main component ----

interface ActivityTabProps {
  activity: ActivityItem[];
  pymkCards: PymkCard[];
  feedReady: boolean;
  pageCtx: PageContext;
  overlayC2: OverlayAttrs;
  overlayC3: OverlayAttrs;
  hidden?: boolean;
}

export function ActivityTab({
  activity,
  pymkCards,
  feedReady,
  pageCtx,
  overlayC2,
  overlayC3,
  hidden,
}: ActivityTabProps) {
  // C2: Simulate returning-member state — first 3 items are "new since last visit"
  const NEW_COUNT = Math.min(3, activity.length);
  const newItems = activity.slice(0, NEW_COUNT);
  const seenItems = activity.slice(NEW_COUNT);

  const pymkCandidates = {
    pymkDefault: pymkCards,
    pymkByGraph: pymkCards,
    newActivityCount: NEW_COUNT,
  };

  return (
    <section className="tabpanel" id="tab-activity" role="tabpanel" data-screen-label="Activity tab" hidden={hidden || undefined}>

      {/* C2: "Since your last visit" divider — PersonalizedSlot returning_banner */}
      <Instrumented attrs={overlayC2} regionLabel="activity-divider">
        <PersonalizedSlot
          name="returning_banner"
          page={pageCtx}
          candidates={pymkCandidates}
          overlay={overlayC2}
          sectionName="activity_feed"
        />
      </Instrumented>

      {/* Feed skeleton when not yet hydrated */}
      {!feedReady ? (
        <div aria-busy="true" aria-label="Loading activity feed">
          {[1, 2, 3].map((i) => (
            <div key={i} className="post skeleton" style={{ minHeight: 120 }} />
          ))}
        </div>
      ) : (
        <>
          {/* New items (above divider) */}
          {newItems.map((item) => (
            <PostCard
              key={item.id}
              item={item}
              isNew
              pageCtx={pageCtx}
            />
          ))}

          {/* C3: PYMK strip after item 3 */}
          <PymkStrip
            pymkCards={pymkCards}
            overlayC3={overlayC3}
            pageCtx={pageCtx}
          />

          {/* Seen items (below divider) */}
          {seenItems.map((item) => (
            <PostCard
              key={item.id}
              item={item}
              isNew={false}
              pageCtx={pageCtx}
            />
          ))}

          {activity.length === 0 && (
            <div className="post" style={{ textAlign: 'center', padding: 'var(--hrt-size-spacing-4)' }}>
              <p className="muted">No activity yet — be the first to donate or start a fundraiser.</p>
            </div>
          )}
        </>
      )}

      {/* Load more */}
      {feedReady && activity.length > 0 && (
        <div style={{ marginTop: 'var(--hrt-size-spacing-3)' }}>
          <button type="button" className="btn btn--secondary">Load more posts</button>
        </div>
      )}
    </section>
  );
}
