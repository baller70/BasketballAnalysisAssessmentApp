-- Give every existing analysis its timeline row.
--
-- The companion migration made `overall_score` nullable and save-analysis now
-- writes one history row per analysis unconditionally, which holds the two
-- tables together GOING FORWARD. It does nothing for rows already written: the
-- test account carries 4 `user_analyses` and 3 `analysis_history`, and the
-- orphan is a real scored video session that simply never got its row.
--
-- (The ledger claimed no backfill was needed because "the existing rows are
-- all scored". That was wrong — the orphan IS scored. The gap was never only
-- about scores, so the backfill is by ANALYSIS, not by score.)
--
-- Idempotent: NOT EXISTS, so re-running inserts nothing. `analysis_id` is
-- UNIQUE, which is what makes that safe.
--
-- The id column holds Prisma cuids generated client-side; SQL cannot make one,
-- so backfilled rows carry a 'bf_'-prefixed uuid. The prefix is deliberate —
-- a row whose provenance is this migration should be identifiable as such.
INSERT INTO "analysis_history" (
  "id", "user_profile_id", "analysis_id", "analysis_date",
  "overall_score", "form_score", "balance_score", "release_score",
  "consistency_score", "elbow_angle", "knee_angle", "release_angle",
  "created_at"
)
SELECT
  'bf_' || gen_random_uuid()::text,
  a."user_profile_id",
  a."id",
  a."created_at",
  a."overall_score", a."form_score", a."balance_score", a."release_score",
  a."consistency_score", a."elbow_angle", a."knee_angle", a."release_angle",
  a."created_at"
FROM "user_analyses" a
WHERE NOT EXISTS (
  SELECT 1 FROM "analysis_history" h WHERE h."analysis_id" = a."id"
);
