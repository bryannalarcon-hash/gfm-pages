// PostHog HogQL query client — SERVER ONLY. architecture.md §4.5.
// The personal API key + project id NEVER reach the client bundle.
import 'server-only';

import type { PersonaSlug } from '@/lib/personas/types';

export interface QueryParams {
  hogql: string;
  dateRange?: { from: string; to: string };
  persona?: PersonaSlug | 'all';
}

export interface QueryResult<Row = Record<string, unknown>> {
  columns: string[];
  rows: Row[];
}

// Return an empty result instead of throwing; callers render empty-state gracefully.
const EMPTY: QueryResult = { columns: [], rows: [] };

export async function queryPostHog<Row = Record<string, unknown>>(
  p: QueryParams,
): Promise<QueryResult<Row>> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) {
    // Offline mode — no PostHog key; dashboard falls back to local ingest store
    return EMPTY as QueryResult<Row>;
  }

  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!projectId) {
    console.warn('[queryPostHog] POSTHOG_PROJECT_ID not set; returning empty result');
    return EMPTY as QueryResult<Row>;
  }

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  const url = `${host}/api/projects/${projectId}/query/`;

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    attempt++;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          query: { kind: 'HogQLQuery', query: p.hogql },
        }),
        // Next.js fetch — no caching on analytics queries
        cache: 'no-store',
      });
    } catch (err) {
      console.error('[queryPostHog] fetch error', err);
      return EMPTY as QueryResult<Row>;
    }

    if (res.status === 429) {
      // Rate-limited — back off for one second and retry once
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      console.warn('[queryPostHog] 429 rate-limited after retries');
      return EMPTY as QueryResult<Row>;
    }

    if (!res.ok) {
      console.error(`[queryPostHog] ${res.status} ${res.statusText}`);
      return EMPTY as QueryResult<Row>;
    }

    let body: unknown;
    try {
      body = await res.json();
    } catch (err) {
      console.error('[queryPostHog] JSON parse error', err);
      return EMPTY as QueryResult<Row>;
    }

    // PostHog /query can return { results: [...] } or { rows: [...] } depending on version.
    const raw = body as Record<string, unknown>;
    const rawColumns = (raw.columns as string[] | undefined) ?? [];
    const rawRows =
      (raw.rows as Row[] | null) ??
      (raw.results as Row[] | null) ??
      [];

    return { columns: rawColumns, rows: rawRows };
  }

  return EMPTY as QueryResult<Row>;
}
