-- CB-15: add cover_image_url to the community table.
-- The column is nullable; existing rows default to NULL (placeholder fallback in the UI).
ALTER TABLE community ADD COLUMN IF NOT EXISTS cover_image_url text;
