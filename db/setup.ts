// Applies schema.sql then ordered migrations through the active DB backend (pg or PGlite).
//   npm run db:setup            → create schema + migrations (idempotent)
//   npm run db:setup -- --reset → drop all tables first, then recreate
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execScript, closePool, usingPglite } from '../lib/db/client';

const DB_DIR = __dirname;

async function main() {
  const reset = process.argv.includes('--reset');
  console.log(`[db:setup] backend: ${usingPglite() ? 'pglite (embedded)' : 'postgres (DATABASE_URL)'}`);

  if (reset) {
    console.log('[db:setup] dropping public schema…');
    await execScript('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  }

  console.log('[db:setup] applying schema.sql…');
  await execScript(readFileSync(join(DB_DIR, 'schema.sql'), 'utf8'));

  const migDir = join(DB_DIR, 'migrations');
  const migrations = readdirSync(migDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const f of migrations) {
    console.log(`[db:setup] migration ${f}…`);
    await execScript(readFileSync(join(migDir, f), 'utf8'));
  }

  console.log('[db:setup] done.');
  await closePool();
}

main().catch((err) => {
  console.error('[db:setup] failed:', err);
  process.exit(1);
});
