-- The four KEY MEASUREMENTS that the biomechanics screen has always shown and
-- never computed: release height, release distance, vertical jump and
-- centreline deviation. They are now derived from the pose keypoints
-- (lib/vision/derivedMetrics.ts) and stored per analysis.
--
-- All four are NULLABLE on purpose. A length needs a real-world scale, which
-- comes from the player's profile height; without it the value is withheld
-- rather than estimated, and NULL is how that is recorded.
ALTER TABLE "user_analyses"
  ADD COLUMN IF NOT EXISTS "release_height_inches"    DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS "release_distance_inches"  DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS "vertical_jump_inches"     DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS "centerline_deviation_deg" DECIMAL(5,2);
