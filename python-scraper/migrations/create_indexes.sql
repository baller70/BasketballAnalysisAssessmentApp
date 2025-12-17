-- ============================================
-- DATABASE INDEXES FOR FAST RETRIEVAL
-- Basketball Shooting Analysis System
-- ============================================

-- Run this after creating the tables to add all indexes

-- ============================================
-- SHOOTERS TABLE INDEXES
-- ============================================

-- Search by name (most common query)
CREATE INDEX IF NOT EXISTS idx_shooter_name ON shooters(name);

-- Filter by skill level (Professional/College/Amateur)
CREATE INDEX IF NOT EXISTS idx_skill_level ON shooters(skill_level);

-- Filter by shooting style (One-motion/Two-motion)
CREATE INDEX IF NOT EXISTS idx_shooting_style ON shooters(shooting_style);

-- Filter by position (Guard/Forward/Center)
CREATE INDEX IF NOT EXISTS idx_position ON shooters(position);

-- Filter by era (Modern/Classic/Historical)
CREATE INDEX IF NOT EXISTS idx_era ON shooters(era);

-- Sort by shooting percentages (find best shooters)
CREATE INDEX IF NOT EXISTS idx_3pt_percentage ON shooters(career_3pt_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_fg_percentage ON shooters(career_fg_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_ft_percentage ON shooters(career_ft_percentage DESC);

-- Physical attributes (for matching similar body types)
CREATE INDEX IF NOT EXISTS idx_height ON shooters(height_inches);
CREATE INDEX IF NOT EXISTS idx_body_type ON shooters(body_type);
CREATE INDEX IF NOT EXISTS idx_dominant_hand ON shooters(dominant_hand);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_skill_position ON shooters(skill_level, position);
CREATE INDEX IF NOT EXISTS idx_skill_style ON shooters(skill_level, shooting_style);
CREATE INDEX IF NOT EXISTS idx_era_skill ON shooters(era, skill_level);
CREATE INDEX IF NOT EXISTS idx_position_style ON shooters(position, shooting_style);

-- Full-text search on name (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS idx_shooter_name_trgm ON shooters USING gin(name gin_trgm_ops);

-- ============================================
-- SHOOTER_IMAGES TABLE INDEXES
-- ============================================

-- Find all images for a shooter
CREATE INDEX IF NOT EXISTS idx_images_shooter_id ON shooter_images(shooter_id);

-- Filter by image category (form_front, form_side, release_point)
CREATE INDEX IF NOT EXISTS idx_image_category ON shooter_images(image_category);

-- Filter by capture phase (setup, dip, release, follow-through)
CREATE INDEX IF NOT EXISTS idx_capture_phase ON shooter_images(capture_phase);

-- Filter by shooting angle (front, side, 45-degree)
CREATE INDEX IF NOT EXISTS idx_shooting_angle ON shooter_images(shooting_angle);

-- Find primary images quickly
CREATE INDEX IF NOT EXISTS idx_is_primary ON shooter_images(is_primary) WHERE is_primary = TRUE;

-- Composite indexes for specific queries
CREATE INDEX IF NOT EXISTS idx_shooter_phase ON shooter_images(shooter_id, capture_phase);
CREATE INDEX IF NOT EXISTS idx_shooter_angle ON shooter_images(shooter_id, shooting_angle);
CREATE INDEX IF NOT EXISTS idx_shooter_category ON shooter_images(shooter_id, image_category);
CREATE INDEX IF NOT EXISTS idx_shooter_primary ON shooter_images(shooter_id, is_primary);

-- ============================================
-- SHOOTING_BIOMECHANICS TABLE INDEXES
-- ============================================

-- Link to shooter
CREATE INDEX IF NOT EXISTS idx_biomech_shooter_id ON shooting_biomechanics(shooter_id);

-- Find shooters with similar angles (for matching)
CREATE INDEX IF NOT EXISTS idx_elbow_angle ON shooting_biomechanics(elbow_angle);
CREATE INDEX IF NOT EXISTS idx_knee_angle ON shooting_biomechanics(knee_angle);
CREATE INDEX IF NOT EXISTS idx_release_angle ON shooting_biomechanics(release_angle);
CREATE INDEX IF NOT EXISTS idx_shoulder_angle ON shooting_biomechanics(shoulder_angle);
CREATE INDEX IF NOT EXISTS idx_hip_angle ON shooting_biomechanics(hip_angle);

-- Release metrics
CREATE INDEX IF NOT EXISTS idx_release_height ON shooting_biomechanics(release_height);
CREATE INDEX IF NOT EXISTS idx_balance_score ON shooting_biomechanics(balance_score);

-- Composite indexes for similarity matching
CREATE INDEX IF NOT EXISTS idx_elbow_knee ON shooting_biomechanics(elbow_angle, knee_angle);
CREATE INDEX IF NOT EXISTS idx_release_metrics ON shooting_biomechanics(release_angle, release_height);
CREATE INDEX IF NOT EXISTS idx_form_angles ON shooting_biomechanics(elbow_angle, shoulder_angle, knee_angle);

-- ============================================
-- SHOOTING_STATS TABLE INDEXES
-- ============================================

-- Link to shooter
CREATE INDEX IF NOT EXISTS idx_stats_shooter_id ON shooting_stats(shooter_id);

-- Filter by season
CREATE INDEX IF NOT EXISTS idx_season ON shooting_stats(season);

-- Composite: Get stats for shooter in a season
CREATE INDEX IF NOT EXISTS idx_shooter_season ON shooting_stats(shooter_id, season);

-- ============================================
-- SHOOTING_STRENGTHS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_strengths_shooter_id ON shooting_strengths(shooter_id);
CREATE INDEX IF NOT EXISTS idx_strength_category ON shooting_strengths(strength_category);

-- ============================================
-- SHOOTING_WEAKNESSES TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_weaknesses_shooter_id ON shooting_weaknesses(shooter_id);
CREATE INDEX IF NOT EXISTS idx_weakness_category ON shooting_weaknesses(weakness_category);
CREATE INDEX IF NOT EXISTS idx_severity_score ON shooting_weaknesses(severity_score DESC);

-- ============================================
-- HABITUAL_MECHANICS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_habits_shooter_id ON habitual_mechanics(shooter_id);
CREATE INDEX IF NOT EXISTS idx_habit_type ON habitual_mechanics(habit_type);

-- ============================================
-- ENABLE TRIGRAM EXTENSION (for fuzzy search)
-- ============================================
-- Run this first if not already enabled:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- ANALYZE TABLES (update statistics for query planner)
-- ============================================
ANALYZE shooters;
ANALYZE shooter_images;
ANALYZE shooting_biomechanics;
ANALYZE shooting_stats;
ANALYZE shooting_strengths;
ANALYZE shooting_weaknesses;
ANALYZE habitual_mechanics;







