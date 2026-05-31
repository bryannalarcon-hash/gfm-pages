-- HNSW cosine indexes for embedding similarity (architecture §8.3).
-- Applied after rows are seeded so the index builds over real vectors.
-- D3/D11 (similar fundraisers) and P4/C3 (PYMK) use the <=> cosine operator.
CREATE INDEX IF NOT EXISTS idx_fundraiser_embedding
  ON fundraiser USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_profile_embedding
  ON profile USING hnsw (embedding vector_cosine_ops);
