-- Give every client-created analysis a durable, user-scoped identity so saving
-- the same local session again updates one row instead of creating duplicates.
ALTER TABLE "user_analyses"
  ADD COLUMN IF NOT EXISTS "client_session_id" VARCHAR(191),
  ADD COLUMN IF NOT EXISTS "media_type" VARCHAR(16),
  ADD COLUMN IF NOT EXISTS "capture_session_id" VARCHAR(191);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_analysis_user_client_session"
  ON "user_analyses"("user_profile_id", "client_session_id");

-- Legacy deployments could contain more than one history snapshot for a
-- single analysis. Keep the newest snapshot before enforcing one-to-one
-- analysis/history identity.
DELETE FROM "analysis_history" AS older
USING "analysis_history" AS newer
WHERE older."analysis_id" = newer."analysis_id"
  AND (
    older."created_at" < newer."created_at"
    OR (older."created_at" = newer."created_at" AND older."id" < newer."id")
  );

DROP INDEX IF EXISTS "idx_history_analysis";

CREATE UNIQUE INDEX IF NOT EXISTS "uq_history_analysis"
  ON "analysis_history"("analysis_id");
