/**
 * posthog/query — unit tests
 * Covers: queryPostHog param→HogQL body mapping, returns empty on missing key / 429 / 5xx / {rows:null}.
 * Never throws.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Setup ────────────────────────────────────────────────────────────────────

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock;
  // Default: clear all env vars related to posthog
  vi.stubEnv('POSTHOG_PERSONAL_API_KEY', '');
  vi.stubEnv('POSTHOG_PROJECT_ID', '');
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', '');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const EMPTY = { columns: [], rows: [] };

// ── Missing key → EMPTY ──────────────────────────────────────────────────────

describe('queryPostHog — missing API key', () => {
  it('returns empty result when POSTHOG_PERSONAL_API_KEY is not set', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', '');
    const { queryPostHog } = await import('@/lib/posthog/query');
    const result = await queryPostHog({ hogql: 'SELECT 1' });
    expect(result).toEqual(EMPTY);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns empty result when POSTHOG_PROJECT_ID is not set (key is set)', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', '');
    const { queryPostHog } = await import('@/lib/posthog/query');
    const result = await queryPostHog({ hogql: 'SELECT 1' });
    expect(result).toEqual(EMPTY);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── 429 → EMPTY (after retry) ────────────────────────────────────────────────

describe('queryPostHog — 429 rate limit', () => {
  it('returns empty after 429 and does NOT throw', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_123');
    fetchMock.mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests' });

    // Use fake timers so the 1-second backoff does not stall the test
    vi.useFakeTimers();
    const { queryPostHog } = await import('@/lib/posthog/query');

    const promise = queryPostHog({ hogql: 'SELECT 1' });
    // Advance past the 1-second retry wait
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual(EMPTY);
    vi.useRealTimers();
  });
});

// ── 5xx → EMPTY ──────────────────────────────────────────────────────────────

describe('queryPostHog — 5xx error', () => {
  it('returns empty on 500 and does NOT throw', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_123');
    fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

    const { queryPostHog } = await import('@/lib/posthog/query');
    const result = await queryPostHog({ hogql: 'SELECT 1' });
    expect(result).toEqual(EMPTY);
  });

  it('returns empty on 503 and does NOT throw', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_123');
    fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' });

    const { queryPostHog } = await import('@/lib/posthog/query');
    const result = await queryPostHog({ hogql: 'SELECT 1' });
    expect(result).toEqual(EMPTY);
  });
});

// ── {rows: null} → EMPTY ─────────────────────────────────────────────────────

describe('queryPostHog — {rows: null} response', () => {
  it('returns empty when the response body has rows: null', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_123');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ columns: ['event'], rows: null }),
    });

    const { queryPostHog } = await import('@/lib/posthog/query');
    const result = await queryPostHog({ hogql: 'SELECT event FROM events' });
    expect(result.columns).toEqual(['event']);
    expect(result.rows).toEqual([]);
  });
});

// ── Successful response — column + row mapping ───────────────────────────────

describe('queryPostHog — successful response', () => {
  it('maps columns and rows from the response body', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_123');
    const mockRows = [{ event: 'Page Viewed', count: 42 }];
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ columns: ['event', 'count'], rows: mockRows }),
    });

    const { queryPostHog } = await import('@/lib/posthog/query');
    const result = await queryPostHog({ hogql: 'SELECT event, count(*) FROM events' });
    expect(result.columns).toEqual(['event', 'count']);
    expect(result.rows).toEqual(mockRows);
  });

  it('supports the alternative {results: [...]} response format', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_123');
    const mockResults = [{ event: 'Follow Clicked' }];
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ columns: ['event'], results: mockResults }),
    });

    const { queryPostHog } = await import('@/lib/posthog/query');
    const result = await queryPostHog({ hogql: 'SELECT event FROM events' });
    expect(result.rows).toEqual(mockResults);
  });

  it('sends the HogQL query in the request body with the correct shape', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_456');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ columns: [], rows: [] }),
    });

    const { queryPostHog } = await import('@/lib/posthog/query');
    await queryPostHog({ hogql: 'SELECT 1 AS x' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.query.kind).toBe('HogQLQuery');
    expect(body.query.query).toBe('SELECT 1 AS x');
  });

  it('includes Authorization Bearer header with the API key', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_my_secret_key');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_789');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ columns: [], rows: [] }),
    });

    const { queryPostHog } = await import('@/lib/posthog/query');
    await queryPostHog({ hogql: 'SELECT 1' });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer phc_my_secret_key');
  });

  it('uses the configured NEXT_PUBLIC_POSTHOG_HOST for the request URL', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_000');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://eu.posthog.com');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ columns: [], rows: [] }),
    });

    const { queryPostHog } = await import('@/lib/posthog/query');
    await queryPostHog({ hogql: 'SELECT 1' });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('eu.posthog.com');
    expect(url).toContain('proj_000');
  });
});

// ── fetch error (network) → EMPTY, never throws ──────────────────────────────

describe('queryPostHog — fetch network error', () => {
  it('returns empty when fetch throws a network error', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_123');
    fetchMock.mockRejectedValue(new Error('Network failure'));

    const { queryPostHog } = await import('@/lib/posthog/query');
    const result = await queryPostHog({ hogql: 'SELECT 1' });
    expect(result).toEqual(EMPTY);
  });
});

// ── JSON parse error → EMPTY, never throws ───────────────────────────────────

describe('queryPostHog — malformed JSON response', () => {
  it('returns empty when response.json() throws', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phc_testkey');
    vi.stubEnv('POSTHOG_PROJECT_ID', 'proj_123');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    });

    const { queryPostHog } = await import('@/lib/posthog/query');
    const result = await queryPostHog({ hogql: 'SELECT 1' });
    expect(result).toEqual(EMPTY);
  });
});
