ALTER TABLE "user_analyses"
  ADD COLUMN "video_url" VARCHAR(1000),
  ADD COLUMN "video_s3_path" VARCHAR(500);

CREATE TABLE "media_uploads" (
  "id" TEXT NOT NULL,
  "user_profile_id" TEXT NOT NULL,
  "client_session_id" VARCHAR(191) NOT NULL,
  "analysis_id" TEXT,
  "file_name" VARCHAR(255) NOT NULL,
  "content_type" VARCHAR(100) NOT NULL,
  "size_bytes" BIGINT NOT NULL,
  "object_key" VARCHAR(500) NOT NULL,
  "storage_upload_id" VARCHAR(500) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "completed_parts" JSONB,
  "media_url" VARCHAR(1000),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "media_uploads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_media_upload_user_client_session"
  ON "media_uploads"("user_profile_id", "client_session_id");
CREATE INDEX "idx_media_upload_user_status" ON "media_uploads"("user_profile_id", "status");
CREATE INDEX "idx_media_upload_analysis" ON "media_uploads"("analysis_id");

ALTER TABLE "media_uploads"
  ADD CONSTRAINT "media_uploads_user_profile_id_fkey"
  FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_uploads"
  ADD CONSTRAINT "media_uploads_analysis_id_fkey"
  FOREIGN KEY ("analysis_id") REFERENCES "user_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
