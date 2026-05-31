-- CB-21: persist live demo interactions so /dashboard has live data on arrival.
-- analytics_event stores every ingest-route event for cold-start buffer hydration.
-- [live] — written at runtime by /api/ticker/ingest on every capture() call.
CREATE TABLE IF NOT EXISTS analytics_event (
  id               uuid PRIMARY KEY,           -- mirrors TickerEvent.uuid (dedupe key)
  event            text NOT NULL,              -- EventName
  persona          text NOT NULL,              -- PersonaSlug
  referrer_source  text NOT NULL,              -- ReferrerSource
  key_label        text,                       -- TickerEvent.keyProp.label (nullable guard)
  key_value        text,                       -- TickerEvent.keyProp.value (nullable guard)
  created_at       timestamptz NOT NULL        -- ISO timestamp from the original event
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_created_at
  ON analytics_event (created_at DESC);
