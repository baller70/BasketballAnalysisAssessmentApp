-- Every clip in the library claimed to be seven seconds long.
--
-- The media library's preview surface defaults to `0:00 / 0:07` and nothing has
-- ever overridden it, because a clip's LENGTH was never recorded anywhere:
-- `media_uploads` has a size in bytes and a content type but no duration, and
-- `/api/media` has been answering `len: "—"` for every row precisely because it
-- had nothing to answer with.
--
-- Nullable: rows uploaded before this, and images, genuinely have no duration,
-- and a zero would be a claim rather than an absence.
ALTER TABLE "media_uploads"
  ADD COLUMN IF NOT EXISTS "duration_seconds" DECIMAL(8, 2);
