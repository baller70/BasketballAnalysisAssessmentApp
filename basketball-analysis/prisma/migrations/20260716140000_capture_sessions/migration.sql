-- Capture metadata is stored separately from analyses so web and native clients
-- can emit the same observations before a shot is accepted for scoring.
CREATE TABLE "capture_sessions" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "mode" VARCHAR(30) NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "platform" VARCHAR(30) NOT NULL,
    "device_model" VARCHAR(255),
    "camera_facing" VARCHAR(20),
    "orientation" VARCHAR(20),
    "view" VARCHAR(20),
    "shooting_hand" VARCHAR(20),
    "pose_provider" VARCHAR(100),
    "pose_model" VARCHAR(100),
    "readiness_status" VARCHAR(30) NOT NULL DEFAULT 'checking',
    "readiness_checks" JSONB,
    "frame_width" INTEGER,
    "frame_height" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "capture_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capture_session_observations" (
    "id" TEXT NOT NULL,
    "capture_session_id" TEXT NOT NULL,
    "timestamp_ms" INTEGER NOT NULL,
    "orientation" VARCHAR(20),
    "pose_confidence" DECIMAL(5,4),
    "full_body_visible" BOOLEAN,
    "subject_frame_ratio" DECIMAL(5,4),
    "stable" BOOLEAN,
    "lighting" VARCHAR(20),
    "hoop_visible" BOOLEAN,
    "ball_visible" BOOLEAN,
    "keypoints" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "capture_session_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_capture_session_user" ON "capture_sessions"("user_profile_id");
CREATE INDEX "idx_capture_session_created" ON "capture_sessions"("created_at");
CREATE INDEX "idx_capture_session_user_created" ON "capture_sessions"("user_profile_id", "created_at");
CREATE INDEX "idx_capture_observation_time" ON "capture_session_observations"("capture_session_id", "timestamp_ms");

ALTER TABLE "capture_sessions"
ADD CONSTRAINT "capture_sessions_user_profile_id_fkey"
FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "capture_session_observations"
ADD CONSTRAINT "capture_session_observations_capture_session_id_fkey"
FOREIGN KEY ("capture_session_id") REFERENCES "capture_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
