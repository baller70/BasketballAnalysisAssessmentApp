-- Persisted analysis -> drill -> retest loop targets.
CREATE TABLE "coaching_targets" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "flaw" VARCHAR(255) NOT NULL,
    "cue" TEXT NOT NULL,
    "drill_id" VARCHAR(100) NOT NULL,
    "drill_name" VARCHAR(255) NOT NULL,
    "metric" VARCHAR(100) NOT NULL,
    "baseline" DECIMAL(10,2) NOT NULL,
    "target_value" DECIMAL(10,2) NOT NULL,
    "direction" VARCHAR(20) NOT NULL,
    "confidence" DECIMAL(4,3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "retest_value" DECIMAL(10,2),
    "retested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "coaching_targets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_coaching_target_user_status"
  ON "coaching_targets"("user_profile_id", "status");
CREATE INDEX "idx_coaching_target_user_created"
  ON "coaching_targets"("user_profile_id", "created_at");

-- The API replaces the active row in a transaction. This index prevents two
-- concurrent requests from leaving a player with multiple active targets.
CREATE UNIQUE INDEX "idx_coaching_target_one_active"
  ON "coaching_targets"("user_profile_id")
  WHERE "status" = 'active';

ALTER TABLE "coaching_targets"
  ADD CONSTRAINT "coaching_targets_user_profile_id_fkey"
  FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
