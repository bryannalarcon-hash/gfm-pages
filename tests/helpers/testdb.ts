// Ephemeral in-memory Postgres+pgvector for integration tests (no Docker needed).
// Each call to freshTestDb() returns an isolated PGlite instance with schema + migrations
// applied, so mark/funnel/attribution counts never bleed across tests (test-plan §0/§10).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';

const DB_DIR = join(process.cwd(), 'db');

export interface TestDb {
  query<Row = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: Row[]; rowCount: number }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  raw: PGlite;
}

export async function freshTestDb(opts?: { withSchema?: boolean }): Promise<TestDb> {
  const db = await PGlite.create({ extensions: { vector } });
  const wrapper: TestDb = {
    async query<Row = Record<string, unknown>>(sql: string, params: unknown[] = []) {
      const res = await db.query<Row>(sql, params);
      return { rows: (res.rows as Row[]) ?? [], rowCount: res.affectedRows ?? res.rows?.length ?? 0 };
    },
    async exec(sql: string) {
      await db.exec(sql);
    },
    async close() {
      await db.close();
    },
    raw: db,
  };

  if (opts?.withSchema !== false) {
    await wrapper.exec(readFileSync(join(DB_DIR, 'schema.sql'), 'utf8'));
    const migDir = join(DB_DIR, 'migrations');
    for (const f of readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()) {
      await wrapper.exec(readFileSync(join(migDir, f), 'utf8'));
    }
  }
  return wrapper;
}
