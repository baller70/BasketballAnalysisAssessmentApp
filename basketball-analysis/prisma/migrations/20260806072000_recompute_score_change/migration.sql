-- Re-chain score_change after the backfill.
--
-- The backfill inserted BACKDATED rows — an orphaned analysis from 01:24 landed
-- before sessions already recorded at 03:19 and 04:06. score_change is a delta
-- against the previous session, so inserting a row ahead of others invalidates
-- theirs: the 03:19 session had been the first scored session and carried NULL,
-- and after the backfill it has an 82 in front of it and should read -1.
--
-- save-analysis recomputes this chain in a transaction whenever it writes (its
-- own comment says "including the row immediately after an inserted backdated
-- session"), but the backfill was raw SQL and triggered none of that.
--
-- The rule matches the application's: each SCORED session is compared to the
-- previous SCORED session, skipping unscored rows, and the first scored session
-- of a profile has no delta. Unscored sessions have no delta of their own.

-- 1. An unscored session has no score change.
UPDATE "analysis_history"
SET "score_change" = NULL
WHERE "overall_score" IS NULL AND "score_change" IS NOT NULL;

-- 2. Every scored session, against the previous SCORED one for that profile.
WITH chained AS (
  SELECT
    "id",
    "overall_score" - LAG("overall_score") OVER (
      PARTITION BY "user_profile_id"
      ORDER BY "analysis_date", "created_at", "id"
    ) AS delta
  FROM "analysis_history"
  WHERE "overall_score" IS NOT NULL
)
UPDATE "analysis_history" h
SET "score_change" = c.delta
FROM chained c
WHERE h."id" = c."id"
  AND h."score_change" IS DISTINCT FROM c.delta;
