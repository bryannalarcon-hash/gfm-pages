// BATCH-ONLY — content-create / build time.
// NEVER import this file from app/ or components/.
// architecture.md §8.3: Voyage voyage-3.5, vector(1024).
// strategy-tech-stack.md: Voyage AI embeddings provider.

const VOYAGE_MODEL = 'voyage-3.5';
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const EMBEDDING_DIM = 1024;

// ---------------------------------------------------------------------------
// Fixtures fallback
// ---------------------------------------------------------------------------

function isEmbedFixturesMode(): boolean {
  return (
    process.env.EMBED_FIXTURES === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.VOYAGE_API_KEY
  );
}

/**
 * A simple numeric hash of a string, used to seed deterministic pseudo-embeddings.
 * Not cryptographic — purely for reproducible test/CI vectors.
 */
function hashString(s: string): number {
  let h = 0x811c9dc5; // FNV-1a offset basis (32-bit)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // Multiply by FNV prime and keep within 32-bit unsigned
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Generate a deterministic, L2-normalised 1024-dim pseudo-embedding for a text.
 * The vector is seeded by the text's hash so the same text always maps to the
 * same vector — stable across runs, suitable for offline fixtures and CI.
 */
function deterministicEmbedding(text: string): number[] {
  const seed = hashString(text);
  const vec: number[] = new Array(EMBEDDING_DIM);

  // LCG (linear congruential generator) seeded from the text hash.
  let state = seed >>> 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    // LCG: next = (a * state + c) mod 2^32
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    // Map [0, 2^32) → [-1, 1)
    vec[i] = (state / 0x100000000) * 2 - 1;
  }

  // L2-normalise so cosine similarity works correctly.
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      vec[i] = vec[i] / norm;
    }
  }

  return vec;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Embed a batch of texts using Voyage voyage-3.5 (1024-dim vectors).
 *
 * Safe with no VOYAGE_API_KEY — returns deterministic pseudo-embeddings so CI
 * and local dev never call the API.
 *
 * @param texts - Array of text strings to embed.
 * @returns Parallel array of 1024-dim float vectors.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  if (isEmbedFixturesMode()) {
    return texts.map(deterministicEmbedding);
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: texts,
        model: VOYAGE_MODEL,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(
        `Voyage API error ${response.status}: ${errBody}`,
      );
    }

    const data = (await response.json()) as {
      data: { embedding: number[]; index: number }[];
    };

    // Sort by index to guarantee input order matches output order.
    const sorted = [...data.data].sort((a, b) => a.index - b.index);
    return sorted.map((d) => d.embedding);
  } catch {
    // Never propagate — fall back to deterministic pseudo-embeddings.
    return texts.map(deterministicEmbedding);
  }
}

/**
 * Format a float[] as a pgvector literal: '[0.1,0.2,...]'
 * Used when writing embeddings to Postgres via the embedding column.
 */
export function toPgVector(v: number[]): string {
  return '[' + v.join(',') + ']';
}
