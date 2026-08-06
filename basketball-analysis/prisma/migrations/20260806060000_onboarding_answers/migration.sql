-- The onboarding wizard asks four questions it has never been able to keep.
--
-- /onboarding collects the player's position, how long they have played, how
-- often they practise and what they are training toward, holds all four in
-- component state, prints them back on its own REVIEW step — and then calls
-- saveProfile(), which has no field for any of them. Every answer is discarded
-- at the moment the player presses Finish, and the next screen that wants to
-- know what the player is training for has to invent it.
--
-- Nullable throughout: an existing profile simply has not answered yet, which
-- is not the same as having answered "guard".
ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "position" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "years_playing" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "practice_frequency" VARCHAR(40),
  ADD COLUMN IF NOT EXISTS "primary_goal" VARCHAR(120);
