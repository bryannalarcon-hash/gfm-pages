// Postgres access layer. architecture.md §2 (lib/db/client.ts). Server-only.
//
// Dual backend so the app runs with OR without Docker:
//   • DATABASE_URL set to a real Postgres  → node `pg` pool (docker-compose / Railway / prod path).
//   • DATABASE_URL unset or the .env placeholder → embedded PGlite (Postgres+pgvector in-process),
//     persisted to .pglite/, so `npm run dev`, the seed, and tests work with no Docker/sudo.
// Both expose the same query()/queryRows()/queryOne() signatures; callers never branch on backend.
import { Pool, type QueryResultRow } from 'pg';

// Use embedded PGlite unless DATABASE_URL is a REAL, parseable Postgres URL (docker/prod).
// The shipped .env carries a descriptive placeholder (postgresql://USER:PASSWORD@HOST:PORT/DBNAME)
// whose non-numeric PORT makes `pg` throw — so an unparseable URL or a placeholder host both
// fall back to PGlite, keeping `npm run dev` working with no Docker.
export function usingPglite(): boolean {
  if (process.env.USE_PGLITE === 'true') return true;
  if (process.env.USE_PGLITE === 'false') return false;
  const url = process.env.DATABASE_URL;
  if (!url) return true;
  try {
    const u = new URL(url);
    const host = u.hostname.toUpperCase();
    if (!u.hostname || host === 'HOST' || host === 'HOSTNAME') return true; // placeholder host
    return false; // a real, parseable URL → use pg
  } catch {
    return true; // unparseable (e.g. the placeholder's non-numeric PORT) → PGlite
  }
}

interface DbBackend {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: Row[]; rowCount: number }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

let backend: DbBackend | null = null;

function makePgBackend(): DbBackend {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
  return {
    async query(text, params = []) {
      const res = await pool.query(text, params as never[]);
      return { rows: res.rows as never[], rowCount: res.rowCount ?? 0 };
    },
    async exec(sql) {
      await pool.query(sql);
    },
    async close() {
      await pool.end();
    },
  };
}

function makePgliteBackend(): DbBackend {
  // Dynamic import kept out of the prod (pg) path. PGlite is a single in-process instance.
  let dbPromise: Promise<import('@electric-sql/pglite').PGlite> | null = null;
  async function getDb() {
    if (!dbPromise) {
      dbPromise = (async () => {
        const { PGlite } = await import('@electric-sql/pglite');
        const { vector } = await import('@electric-sql/pglite/vector');
        const dir = process.env.PGLITE_DIR ?? '.pglite';
        const inMemory = process.env.PGLITE_MEMORY === 'true';
        return new PGlite(inMemory ? undefined : dir, { extensions: { vector } });
      })();
    }
    return dbPromise;
  }
  return {
    async query(text, params = []) {
      const db = await getDb();
      const res = await db.query(text, params as unknown[]);
      return { rows: (res.rows as never[]) ?? [], rowCount: res.affectedRows ?? (res.rows?.length ?? 0) };
    },
    async exec(sql) {
      const db = await getDb();
      await db.exec(sql);
    },
    async close() {
      if (dbPromise) {
        const db = await dbPromise;
        await db.close();
        dbPromise = null;
      }
    },
  };
}

function getBackend(): DbBackend {
  if (!backend) {
    backend = usingPglite() ? makePgliteBackend() : makePgBackend();
  }
  return backend;
}

export async function query<Row extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<{ rows: Row[]; rowCount: number }> {
  return getBackend().query<Row>(text, params);
}

export async function queryRows<Row extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<Row[]> {
  const { rows } = await query<Row>(text, params);
  return rows;
}

export async function queryOne<Row extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<Row | null> {
  const { rows } = await query<Row>(text, params);
  return rows[0] ?? null;
}

/** Run a multi-statement SQL script (schema / migrations) through the active backend. */
export async function execScript(sql: string): Promise<void> {
  await getBackend().exec(sql);
}

export async function closePool(): Promise<void> {
  if (backend) {
    await backend.close();
    backend = null;
  }
}

/** Test/seed helper: reset the cached backend (e.g. between PGlite test instances). */
export function __resetBackendForTests(): void {
  backend = null;
}
