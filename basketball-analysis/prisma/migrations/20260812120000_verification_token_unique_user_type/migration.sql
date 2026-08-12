-- One live verification token per (user, type), enforced by the database.
--
-- `issueToken`/`issueEmailCode` documented the invariant "issuing invalidates
-- the previous one, so only the newest works" and implemented it as
-- deleteMany-then-create. Those are two statements, so the invariant held only
-- when nothing raced: three concurrent resends were measured leaving THREE live
-- codes for one user, with the OLDEST still verifying, and two orphans left
-- behind for the rest of their TTL. That multiplies the per-account guess
-- surface by the number of racing requests.
--
-- Collapse any pre-existing duplicates before adding the constraint, keeping the
-- newest row per (user, type) — which is the row the application already
-- intended to be the only one.
DELETE FROM "verification_tokens" a
 USING "verification_tokens" b
 WHERE a."user_id" = b."user_id"
   AND a."type" = b."type"
   AND (a."created_at" < b."created_at"
        OR (a."created_at" = b."created_at" AND a."id" < b."id"));

ALTER TABLE "verification_tokens"
  ADD CONSTRAINT "uniq_verification_token_user_type" UNIQUE ("user_id", "type");
