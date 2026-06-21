-- Make password optional (OAuth-only accounts have no password)
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- Add OAuth / profile columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" VARCHAR(512);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "provider" VARCHAR(32);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "provider_id" VARCHAR(255);
