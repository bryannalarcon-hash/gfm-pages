// Server-side PostHog HogQL proxy — hides personal API key from the client.
// architecture.md §4.5 + §3.
//
// Accepts GET or POST:
//   GET  /api/query?hogql=...&from=...&to=...&persona=...
//   POST /api/query  { hogql, from, to, persona }
//
// Returns JSON QueryResult.
import { NextRequest, NextResponse } from 'next/server';
import { queryPostHog } from '@/lib/posthog/query';
import type { PersonaSlug } from '@/lib/personas/types';

export const runtime = 'nodejs';

function parseParams(
  hogql: string | null,
  from: string | null,
  to: string | null,
  persona: string | null,
) {
  if (!hogql) {
    return null;
  }
  return {
    hogql,
    dateRange:
      from && to ? { from, to } : undefined,
    persona: (persona ?? 'all') as PersonaSlug | 'all',
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const params = parseParams(
    sp.get('hogql'),
    sp.get('from'),
    sp.get('to'),
    sp.get('persona'),
  );
  if (!params) {
    return NextResponse.json(
      { error: '`hogql` query parameter is required' },
      { status: 400 },
    );
  }
  const result = await queryPostHog(params);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const params = parseParams(
    typeof body.hogql === 'string' ? body.hogql : null,
    typeof body.from === 'string' ? body.from : null,
    typeof body.to === 'string' ? body.to : null,
    typeof body.persona === 'string' ? body.persona : null,
  );
  if (!params) {
    return NextResponse.json(
      { error: '`hogql` field is required' },
      { status: 400 },
    );
  }
  const result = await queryPostHog(params);
  return NextResponse.json(result);
}
