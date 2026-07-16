-- Persist detector output and append-only human review corrections.
-- This migration follows 20260716140000_capture_sessions and is intentionally
-- forward-only so existing capture/analysis data remains untouched.
CREATE TABLE "shot_events" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "capture_session_id" TEXT,
    "sequence" INTEGER,
    "timestamp_ms" INTEGER,
    "start_frame" INTEGER,
    "end_frame" INTEGER,
    "thumbnail_url" TEXT,
    "detected" BOOLEAN NOT NULL DEFAULT true,
    "detected_result" VARCHAR(10),
    "detected_shooter" VARCHAR(255),
    "detected_phase" VARCHAR(50),
    "confidence" DECIMAL(5,4),
    "phase_markers" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shot_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shot_event_corrections" (
    "id" TEXT NOT NULL,
    "shot_event_id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "value" JSONB NOT NULL,
    "timestamp_ms" INTEGER,
    "frame_index" INTEGER,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shot_event_corrections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_shot_event_user_created" ON "shot_events"("user_profile_id", "created_at");
CREATE INDEX "idx_shot_event_session_time" ON "shot_events"("capture_session_id", "timestamp_ms");
CREATE INDEX "idx_shot_correction_event_created" ON "shot_event_corrections"("shot_event_id", "created_at");
CREATE INDEX "idx_shot_correction_user_created" ON "shot_event_corrections"("user_profile_id", "created_at");

ALTER TABLE "shot_events"
ADD CONSTRAINT "shot_events_user_profile_id_fkey"
FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shot_events"
ADD CONSTRAINT "shot_events_capture_session_id_fkey"
FOREIGN KEY ("capture_session_id") REFERENCES "capture_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shot_event_corrections"
ADD CONSTRAINT "shot_event_corrections_shot_event_id_fkey"
FOREIGN KEY ("shot_event_id") REFERENCES "shot_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shot_event_corrections"
ADD CONSTRAINT "shot_event_corrections_user_profile_id_fkey"
FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
