-- GoFundMe redesign — data model. architecture.md §5.
-- pgvector enabled; embedding columns power D3/D11 (similar fundraisers) and P4/C3 (PYMK).
-- [seed] = populated by db/seed.ts; [live] = written at runtime by demo interactions.

CREATE EXTENSION IF NOT EXISTS vector;
-- UUIDs: runtime/live rows use core gen_random_uuid() (Postgres 13+); no uuid-ossp needed.

-- ---------------------------------------------------------------------------
-- Entities
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS community (                       -- [seed]
  id               uuid PRIMARY KEY,
  slug             text UNIQUE NOT NULL,
  name             text NOT NULL,
  description      text,
  raised_usd       bigint,
  fundraiser_count int,
  follower_count   int DEFAULT 0,
  cover_image_url  text                                      -- CB-15: 16:9 hero cover; nullable (placeholder fallback)
);

CREATE TABLE IF NOT EXISTS profile (                         -- [seed]
  id             uuid PRIMARY KEY,
  handle         text UNIQUE NOT NULL,        -- e.g. 'janahan'
  display_name   text NOT NULL,
  bio            text,
  joined_year    int,
  cause_tags     text[],                      -- P3 cause pills (max 3 rendered)
  follower_count int DEFAULT 0,
  embedding      vector(1024)                 -- P4 PYMK proximity; Voyage voyage-3.5 (1024-dim)
);

CREATE TABLE IF NOT EXISTS fundraiser (                      -- [seed]
  id             uuid PRIMARY KEY,
  slug           text UNIQUE NOT NULL,
  organizer_id   uuid REFERENCES profile(id),
  community_id   uuid REFERENCES community(id),   -- nullable; gates D3 community-follow CTA
  title          text NOT NULL,
  story          text,
  category       text NOT NULL,               -- cold-start trending fallback + tone-by-cause
  goal_usd       int NOT NULL,
  raised_usd     int NOT NULL,                -- SSR'd (zero CLS); drives D2/D6 states
  donation_count int NOT NULL,
  follower_count int DEFAULT 0,
  hero_image_url text,
  embedding      vector(1024)                 -- D3/D11 similarity (<=> cosine); Voyage voyage-3.5
);

CREATE TABLE IF NOT EXISTS donation (                        -- [seed] + [live]
  id             uuid PRIMARY KEY,
  fundraiser_id  uuid REFERENCES fundraiser(id),
  donor_id       uuid REFERENCES profile(id),  -- nullable (anonymous/guest)
  amount_usd     int NOT NULL,
  frequency      text NOT NULL,               -- 'one_time' | 'monthly'
  tip_amount_usd int,
  comment        text,
  created_at     timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fundraiser_update (               -- [seed]
  id            uuid PRIMARY KEY,
  fundraiser_id uuid REFERENCES fundraiser(id),
  author_id     uuid REFERENCES profile(id),
  body          text NOT NULL,
  created_at    timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS update_summary (                  -- [seed] (batch-precomputed, cached)
  update_id uuid PRIMARY KEY REFERENCES fundraiser_update(id),
  summary   text NOT NULL                      -- D13 1-line; written by precomputeUpdateSummary
);

CREATE TABLE IF NOT EXISTS share_copy (                      -- [seed] (batch-precomputed, cached)
  entity_type text NOT NULL,                   -- 'fundraiser' | 'community' | 'profile'
  entity_id   uuid NOT NULL,
  channel     text NOT NULL,                   -- ShareChannel
  copy        text NOT NULL,                   -- D9/C6/P8; written by precomputeShareCopy
  PRIMARY KEY (entity_type, entity_id, channel)
);

CREATE TABLE IF NOT EXISTS community_membership (            -- [seed] + [live]
  community_id uuid REFERENCES community(id),
  member_id    uuid REFERENCES profile(id),
  role         text DEFAULT 'follower',        -- 'follower' | 'organizer'
  joined_at    timestamptz NOT NULL,
  PRIMARY KEY (community_id, member_id)
);

CREATE TABLE IF NOT EXISTS community_activity (              -- [seed]
  id             uuid PRIMARY KEY,
  community_id   uuid REFERENCES community(id),
  actor_id       uuid REFERENCES profile(id),
  verb           text NOT NULL,                -- 'donated' | 'started' | 'milestone'
  body           text,
  created_at     timestamptz NOT NULL,
  reaction_count int DEFAULT 0,
  comment_count  int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS follow (                          -- [seed] + [live]  (the follow graph)
  follower_id uuid REFERENCES profile(id),
  target_type text NOT NULL,                   -- 'fundraiser' | 'profile' | 'community'
  target_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL,
  PRIMARY KEY (follower_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS comment (                         -- [seed] + [live]
  id          uuid PRIMARY KEY,
  target_type text NOT NULL,                   -- 'activity' | 'update' | 'donation'
  target_id   uuid NOT NULL,
  author_id   uuid REFERENCES profile(id),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS reaction (                        -- [seed] + [live]  (C2 HEART reactions)
  target_type text NOT NULL,                   -- 'activity' | 'update'
  target_id   uuid NOT NULL,
  member_id   uuid REFERENCES profile(id),     -- per-user → a persona's OWN reactions render
  kind        text DEFAULT 'heart',
  created_at  timestamptz NOT NULL,
  PRIMARY KEY (target_type, target_id, member_id)
);
-- community_activity.reaction_count stays the denormalized aggregate count for display.

-- ---------------------------------------------------------------------------
-- Suns board (S1–S5) — share attribution + marks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS share_event (                     -- [seed] + [live]  (S3 attribution source)
  share_id     uuid PRIMARY KEY,               -- minted at Share Clicked; rides the share link
  sharer_token text NOT NULL,                  -- pseudonymous; real identity only with consent
  entity_type  text NOT NULL,                  -- 'fundraiser' | 'community' | 'profile'
  entity_id    uuid NOT NULL,
  channel      text NOT NULL,                  -- ShareChannel
  created_at   timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS donation_attribution (            -- [seed] + [live]  (S3 single-touch)
  donation_id  uuid PRIMARY KEY REFERENCES donation(id),
  share_id     uuid REFERENCES share_event(share_id),  -- last-touch share that drove this donation
  sharer_token text                            -- denormalized for the 50%-inherit rollup
);

CREATE TABLE IF NOT EXISTS sun_mark (                        -- [live] — DERIVED + recomputable
  id             uuid PRIMARY KEY,
  entity_type    text NOT NULL,                -- board scope: 'fundraiser' | 'community' | 'profile'
  entity_id      uuid NOT NULL,
  owner_token    text NOT NULL,                -- pseudonymous; display_name non-null only with consent
  display_name   text,
  action_mask    text NOT NULL,                -- which of follow/share/give earned it
  gradient_id    text,                         -- curated key-gradient ('grey' = follow-only)
  own_amount_usd int DEFAULT 0,                -- settled donations by this owner
  inherited_usd  int DEFAULT 0,                -- 50% of donations attributed to this owner's shares (S3)
  size_score     real,                         -- derived: sublinear(own + inherited) + floor
  visible        boolean DEFAULT true,         -- reactive moderation (report → hide)
  created_at     timestamptz NOT NULL,
  UNIQUE (entity_type, entity_id, owner_token) -- one mark per owner per board (concurrency-safe upsert)
);
-- size is RECOGNITION, recomputable: a refund/chargeback shrinks own/inherited → size_score.
-- No dollar figures are ever rendered.

CREATE INDEX IF NOT EXISTS idx_donation_fundraiser ON donation(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_follow_target ON follow(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_community ON community_activity(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sun_mark_entity ON sun_mark(entity_type, entity_id) WHERE visible;

-- ---------------------------------------------------------------------------
-- Analytics event log (CB-21) — live demo interaction persistence
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics_event (                 -- [live]
  id               uuid PRIMARY KEY,           -- mirrors TickerEvent.uuid (dedupe key)
  event            text NOT NULL,              -- EventName
  persona          text NOT NULL,              -- PersonaSlug
  referrer_source  text NOT NULL,              -- ReferrerSource
  key_label        text,                       -- TickerEvent.keyProp.label
  key_value        text,                       -- TickerEvent.keyProp.value
  created_at       timestamptz NOT NULL        -- ISO timestamp from the original event
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_created_at
  ON analytics_event (created_at DESC);
