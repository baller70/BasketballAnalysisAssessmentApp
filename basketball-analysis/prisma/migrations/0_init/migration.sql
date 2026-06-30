-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "display_name" VARCHAR(255),
    "profile_complete" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "height_inches" INTEGER,
    "weight_lbs" INTEGER,
    "wingspan_inches" INTEGER,
    "age" INTEGER,
    "experience_level" VARCHAR(50),
    "body_type" VARCHAR(50),
    "athletic_ability" INTEGER,
    "dominant_hand" VARCHAR(20),
    "shooting_style" VARCHAR(50),
    "bio" TEXT,
    "enhanced_bio" TEXT,
    "points_state" JSONB,
    "coaching_tier" VARCHAR(50),
    "wingspan_to_height_ratio" DECIMAL(5,2),
    "bmi" DECIMAL(5,2),
    "profile_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_analyses" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "image_url" VARCHAR(500),
    "s3_path" VARCHAR(500),
    "roboflow_pose_data" JSONB,
    "roboflow_detection" JSONB,
    "shooting_phase" VARCHAR(50),
    "elbow_angle" DECIMAL(5,2),
    "knee_angle" DECIMAL(5,2),
    "wrist_angle" DECIMAL(5,2),
    "shoulder_angle" DECIMAL(5,2),
    "hip_angle" DECIMAL(5,2),
    "release_angle" DECIMAL(5,2),
    "vision_analysis" JSONB,
    "body_positions" JSONB,
    "annotated_image_url" VARCHAR(500),
    "annotated_s3_path" VARCHAR(500),
    "visual_overlays" JSONB,
    "overall_score" DECIMAL(5,2),
    "form_score" DECIMAL(5,2),
    "balance_score" DECIMAL(5,2),
    "release_score" DECIMAL(5,2),
    "consistency_score" DECIMAL(5,2),
    "strengths" JSONB,
    "improvements" JSONB,
    "drills" JSONB,
    "coaching_notes" TEXT,
    "matched_shooter_id" INTEGER,
    "match_confidence" DECIMAL(3,2),
    "similar_shooters" JSONB,
    "processing_status" VARCHAR(50) DEFAULT 'pending',
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_history" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "overall_score" DECIMAL(5,2) NOT NULL,
    "form_score" DECIMAL(5,2),
    "balance_score" DECIMAL(5,2),
    "release_score" DECIMAL(5,2),
    "consistency_score" DECIMAL(5,2),
    "score_change" DECIMAL(5,2),
    "improvement_areas" JSONB,
    "regression_areas" JSONB,
    "elbow_angle" DECIMAL(5,2),
    "knee_angle" DECIMAL(5,2),
    "release_angle" DECIMAL(5,2),
    "progress_notes" TEXT,
    "milestones_achieved" JSONB,
    "analysis_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shooters" (
    "shooter_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "position" VARCHAR(50),
    "height_inches" INTEGER,
    "weight_lbs" INTEGER,
    "wingspan_inches" INTEGER,
    "arm_length_inches" INTEGER,
    "body_type" VARCHAR(100),
    "dominant_hand" VARCHAR(20),
    "career_fg_percentage" DECIMAL(5,2),
    "career_3pt_percentage" DECIMAL(5,2),
    "career_ft_percentage" DECIMAL(5,2),
    "shooting_style" VARCHAR(100),
    "era" VARCHAR(50),
    "skill_level" VARCHAR(50),
    "profile_image_url" VARCHAR(500),
    "team" VARCHAR(255),
    "signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shooters_pkey" PRIMARY KEY ("shooter_id")
);

-- CreateTable
CREATE TABLE "shooting_biomechanics" (
    "biomech_id" SERIAL NOT NULL,
    "shooter_id" INTEGER NOT NULL,
    "elbow_angle" DECIMAL(5,2),
    "shoulder_angle" DECIMAL(5,2),
    "hip_angle" DECIMAL(5,2),
    "knee_angle" DECIMAL(5,2),
    "ankle_angle" DECIMAL(5,2),
    "release_height" DECIMAL(5,2),
    "release_angle" DECIMAL(5,2),
    "entry_angle" DECIMAL(5,2),
    "follow_through_extension" DECIMAL(5,2),
    "wrist_angle" DECIMAL(5,2),
    "balance_score" DECIMAL(3,2),
    "arc_consistency" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shooting_biomechanics_pkey" PRIMARY KEY ("biomech_id")
);

-- CreateTable
CREATE TABLE "shooter_images" (
    "image_id" SERIAL NOT NULL,
    "shooter_id" INTEGER NOT NULL,
    "image_category" VARCHAR(50),
    "image_url" VARCHAR(500),
    "s3_path" VARCHAR(500),
    "image_resolution" VARCHAR(20),
    "capture_phase" VARCHAR(50),
    "shooting_angle" VARCHAR(50),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shooter_images_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "shooting_stats" (
    "stat_id" SERIAL NOT NULL,
    "shooter_id" INTEGER NOT NULL,
    "season" VARCHAR(20),
    "games_played" INTEGER,
    "fg_attempts" INTEGER,
    "fg_made" INTEGER,
    "three_pt_attempts" INTEGER,
    "three_pt_made" INTEGER,
    "ft_attempts" INTEGER,
    "ft_made" INTEGER,
    "points_per_game" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shooting_stats_pkey" PRIMARY KEY ("stat_id")
);

-- CreateTable
CREATE TABLE "shooting_strengths" (
    "strength_id" SERIAL NOT NULL,
    "shooter_id" INTEGER NOT NULL,
    "strength_category" VARCHAR(100),
    "description" TEXT,
    "confidence_score" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shooting_strengths_pkey" PRIMARY KEY ("strength_id")
);

-- CreateTable
CREATE TABLE "shooting_weaknesses" (
    "weakness_id" SERIAL NOT NULL,
    "shooter_id" INTEGER NOT NULL,
    "weakness_category" VARCHAR(100),
    "description" TEXT,
    "severity_score" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shooting_weaknesses_pkey" PRIMARY KEY ("weakness_id")
);

-- CreateTable
CREATE TABLE "habitual_mechanics" (
    "habit_id" SERIAL NOT NULL,
    "shooter_id" INTEGER NOT NULL,
    "habit_name" VARCHAR(100),
    "habit_type" VARCHAR(50),
    "frequency" VARCHAR(50),
    "impact_on_performance" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habitual_mechanics_pkey" PRIMARY KEY ("habit_id")
);

-- CreateTable
CREATE TABLE "drill_video_submissions" (
    "id" TEXT NOT NULL,
    "drill_id" VARCHAR(100) NOT NULL,
    "drill_name" VARCHAR(255) NOT NULL,
    "focus_area" VARCHAR(100),
    "media_type" VARCHAR(20),
    "media_url" TEXT,
    "thumbnail_url" TEXT,
    "video_duration" DECIMAL(10,2),
    "workout_id" VARCHAR(100),
    "workout_name" VARCHAR(255),
    "workout_date" TIMESTAMP(3),
    "analyzed" BOOLEAN NOT NULL DEFAULT false,
    "analyzed_at" TIMESTAMP(3),
    "analysis_type" VARCHAR(20),
    "overall_grade" VARCHAR(1),
    "grade_description" TEXT,
    "is_correct_drill" BOOLEAN,
    "wrong_drill_message" TEXT,
    "what_i_see" TEXT,
    "coach_says" TEXT,
    "priority_issue" TEXT,
    "priority_why" TEXT,
    "priority_how_to_fix" TEXT,
    "priority_cue" VARCHAR(255),
    "coach_analysis" JSONB,
    "form_score" INTEGER,
    "feedback" JSONB,
    "improvements" JSONB,
    "positives" JSONB,
    "coaching_tips" JSONB,
    "detailed_feedback" TEXT,
    "drill_specific" BOOLEAN NOT NULL DEFAULT false,
    "user_profile_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drill_video_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "target_value" INTEGER NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "unit" VARCHAR(100) NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3),
    "landmark" VARCHAR(255),
    "coordinates" JSONB,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "drill_ids" JSONB NOT NULL,
    "focus_areas" JSONB,
    "duration" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "total_shots" INTEGER DEFAULT 0,
    "total_made" INTEGER DEFAULT 0,
    "total_missed" INTEGER DEFAULT 0,
    "accuracy" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_preferences" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "preferred_duration" INTEGER NOT NULL,
    "drill_count" INTEGER NOT NULL,
    "workout_mode" VARCHAR(50) NOT NULL,
    "sound_enabled" BOOLEAN NOT NULL DEFAULT true,
    "age_level" VARCHAR(50) NOT NULL,
    "auto_populate_from_flaws" BOOLEAN NOT NULL DEFAULT false,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_workouts" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "drill_count" INTEGER NOT NULL,
    "drill_ids" JSONB NOT NULL,
    "total_made" INTEGER NOT NULL DEFAULT 0,
    "total_missed" INTEGER NOT NULL DEFAULT 0,
    "last_played" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "notifications" JSONB,
    "privacy" JSONB,
    "automation" JSONB,
    "avatar_url" VARCHAR(500),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_events" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "points" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earned_badges" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "badge_id" VARCHAR(100) NOT NULL,
    "progress" JSONB,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earned_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_challenges" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "challenge_key" VARCHAR(100) NOT NULL,
    "target" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "week_start" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_experience" ON "user_profiles"("experience_level");

-- CreateIndex
CREATE INDEX "idx_user_body_type" ON "user_profiles"("body_type");

-- CreateIndex
CREATE INDEX "idx_user_coaching_tier" ON "user_profiles"("coaching_tier");

-- CreateIndex
CREATE INDEX "idx_user_height" ON "user_profiles"("height_inches");

-- CreateIndex
CREATE INDEX "idx_analysis_user" ON "user_analyses"("user_profile_id");

-- CreateIndex
CREATE INDEX "idx_analysis_date" ON "user_analyses"("created_at");

-- CreateIndex
CREATE INDEX "idx_analysis_matched" ON "user_analyses"("matched_shooter_id");

-- CreateIndex
CREATE INDEX "idx_shooting_phase" ON "user_analyses"("shooting_phase");

-- CreateIndex
CREATE INDEX "idx_processing_status" ON "user_analyses"("processing_status");

-- CreateIndex
CREATE INDEX "idx_history_user" ON "analysis_history"("user_profile_id");

-- CreateIndex
CREATE INDEX "idx_history_date" ON "analysis_history"("analysis_date");

-- CreateIndex
CREATE INDEX "idx_history_analysis" ON "analysis_history"("analysis_id");

-- CreateIndex
CREATE INDEX "idx_history_user_date" ON "analysis_history"("user_profile_id", "analysis_date");

-- CreateIndex
CREATE UNIQUE INDEX "shooters_name_key" ON "shooters"("name");

-- CreateIndex
CREATE INDEX "idx_shooter_name" ON "shooters"("name");

-- CreateIndex
CREATE INDEX "idx_skill_level" ON "shooters"("skill_level");

-- CreateIndex
CREATE INDEX "idx_shooting_style" ON "shooters"("shooting_style");

-- CreateIndex
CREATE INDEX "idx_position" ON "shooters"("position");

-- CreateIndex
CREATE INDEX "idx_era" ON "shooters"("era");

-- CreateIndex
CREATE INDEX "idx_3pt_percentage" ON "shooters"("career_3pt_percentage");

-- CreateIndex
CREATE INDEX "idx_fg_percentage" ON "shooters"("career_fg_percentage");

-- CreateIndex
CREATE INDEX "idx_ft_percentage" ON "shooters"("career_ft_percentage");

-- CreateIndex
CREATE INDEX "idx_skill_position" ON "shooters"("skill_level", "position");

-- CreateIndex
CREATE INDEX "idx_skill_style" ON "shooters"("skill_level", "shooting_style");

-- CreateIndex
CREATE INDEX "idx_era_skill" ON "shooters"("era", "skill_level");

-- CreateIndex
CREATE INDEX "idx_height" ON "shooters"("height_inches");

-- CreateIndex
CREATE INDEX "idx_body_type" ON "shooters"("body_type");

-- CreateIndex
CREATE UNIQUE INDEX "shooting_biomechanics_shooter_id_key" ON "shooting_biomechanics"("shooter_id");

-- CreateIndex
CREATE INDEX "idx_biomech_shooter_id" ON "shooting_biomechanics"("shooter_id");

-- CreateIndex
CREATE INDEX "idx_elbow_angle" ON "shooting_biomechanics"("elbow_angle");

-- CreateIndex
CREATE INDEX "idx_release_angle" ON "shooting_biomechanics"("release_angle");

-- CreateIndex
CREATE INDEX "idx_knee_angle" ON "shooting_biomechanics"("knee_angle");

-- CreateIndex
CREATE INDEX "idx_elbow_knee" ON "shooting_biomechanics"("elbow_angle", "knee_angle");

-- CreateIndex
CREATE INDEX "idx_release_metrics" ON "shooting_biomechanics"("release_angle", "release_height");

-- CreateIndex
CREATE INDEX "idx_images_shooter_id" ON "shooter_images"("shooter_id");

-- CreateIndex
CREATE INDEX "idx_image_category" ON "shooter_images"("image_category");

-- CreateIndex
CREATE INDEX "idx_capture_phase" ON "shooter_images"("capture_phase");

-- CreateIndex
CREATE INDEX "idx_shooting_angle" ON "shooter_images"("shooting_angle");

-- CreateIndex
CREATE INDEX "idx_is_primary" ON "shooter_images"("is_primary");

-- CreateIndex
CREATE INDEX "idx_shooter_phase" ON "shooter_images"("shooter_id", "capture_phase");

-- CreateIndex
CREATE INDEX "idx_shooter_angle" ON "shooter_images"("shooter_id", "shooting_angle");

-- CreateIndex
CREATE INDEX "idx_shooter_category" ON "shooter_images"("shooter_id", "image_category");

-- CreateIndex
CREATE INDEX "idx_shooter_primary" ON "shooter_images"("shooter_id", "is_primary");

-- CreateIndex
CREATE INDEX "idx_stats_shooter_id" ON "shooting_stats"("shooter_id");

-- CreateIndex
CREATE INDEX "idx_season" ON "shooting_stats"("season");

-- CreateIndex
CREATE INDEX "idx_shooter_season" ON "shooting_stats"("shooter_id", "season");

-- CreateIndex
CREATE INDEX "idx_strengths_shooter_id" ON "shooting_strengths"("shooter_id");

-- CreateIndex
CREATE INDEX "idx_weaknesses_shooter_id" ON "shooting_weaknesses"("shooter_id");

-- CreateIndex
CREATE INDEX "idx_habits_shooter_id" ON "habitual_mechanics"("shooter_id");

-- CreateIndex
CREATE INDEX "idx_drill_video_drill_id" ON "drill_video_submissions"("drill_id");

-- CreateIndex
CREATE INDEX "idx_drill_video_analyzed" ON "drill_video_submissions"("analyzed");

-- CreateIndex
CREATE INDEX "idx_drill_video_user" ON "drill_video_submissions"("user_profile_id");

-- CreateIndex
CREATE INDEX "idx_drill_video_created" ON "drill_video_submissions"("created_at");

-- CreateIndex
CREATE INDEX "idx_drill_video_focus" ON "drill_video_submissions"("focus_area");

-- CreateIndex
CREATE INDEX "idx_drill_video_workout" ON "drill_video_submissions"("workout_id");

-- CreateIndex
CREATE INDEX "idx_drill_video_grade" ON "drill_video_submissions"("overall_grade");

-- CreateIndex
CREATE INDEX "idx_drill_video_media_type" ON "drill_video_submissions"("media_type");

-- CreateIndex
CREATE INDEX "idx_goal_user" ON "goals"("user_profile_id");

-- CreateIndex
CREATE INDEX "idx_goal_category" ON "goals"("category");

-- CreateIndex
CREATE INDEX "idx_goal_user_completed" ON "goals"("user_profile_id", "completed_at");

-- CreateIndex
CREATE INDEX "idx_workout_user" ON "workouts"("user_profile_id");

-- CreateIndex
CREATE INDEX "idx_workout_user_date" ON "workouts"("user_profile_id", "scheduled_date");

-- CreateIndex
CREATE UNIQUE INDEX "training_preferences_user_profile_id_key" ON "training_preferences"("user_profile_id");

-- CreateIndex
CREATE INDEX "idx_saved_workout_user" ON "saved_workouts"("user_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_verification_token_user" ON "verification_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_profile_id_key" ON "user_settings"("user_profile_id");

-- CreateIndex
CREATE INDEX "idx_point_event_user" ON "point_events"("user_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "earned_badges_user_profile_id_badge_id_key" ON "earned_badges"("user_profile_id", "badge_id");

-- CreateIndex
CREATE INDEX "idx_user_challenge_user" ON "user_challenges"("user_profile_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_analyses" ADD CONSTRAINT "user_analyses_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_analyses" ADD CONSTRAINT "user_analyses_matched_shooter_id_fkey" FOREIGN KEY ("matched_shooter_id") REFERENCES "shooters"("shooter_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_history" ADD CONSTRAINT "analysis_history_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "user_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_history" ADD CONSTRAINT "analysis_history_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shooting_biomechanics" ADD CONSTRAINT "shooting_biomechanics_shooter_id_fkey" FOREIGN KEY ("shooter_id") REFERENCES "shooters"("shooter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shooter_images" ADD CONSTRAINT "shooter_images_shooter_id_fkey" FOREIGN KEY ("shooter_id") REFERENCES "shooters"("shooter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shooting_stats" ADD CONSTRAINT "shooting_stats_shooter_id_fkey" FOREIGN KEY ("shooter_id") REFERENCES "shooters"("shooter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shooting_strengths" ADD CONSTRAINT "shooting_strengths_shooter_id_fkey" FOREIGN KEY ("shooter_id") REFERENCES "shooters"("shooter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shooting_weaknesses" ADD CONSTRAINT "shooting_weaknesses_shooter_id_fkey" FOREIGN KEY ("shooter_id") REFERENCES "shooters"("shooter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habitual_mechanics" ADD CONSTRAINT "habitual_mechanics_shooter_id_fkey" FOREIGN KEY ("shooter_id") REFERENCES "shooters"("shooter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drill_video_submissions" ADD CONSTRAINT "drill_video_submissions_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_preferences" ADD CONSTRAINT "training_preferences_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_workouts" ADD CONSTRAINT "saved_workouts_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earned_badges" ADD CONSTRAINT "earned_badges_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

