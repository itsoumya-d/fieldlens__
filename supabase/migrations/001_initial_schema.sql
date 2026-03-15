-- 001_initial_schema.sql
-- FieldLens: AI-powered trade coaching for skilled workers
-- Generated from database-schema.md

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'master');
CREATE TYPE trade_type AS ENUM ('plumbing', 'electrical', 'hvac', 'carpentry', 'general');
CREATE TYPE session_status AS ENUM ('capturing', 'analyzing', 'completed', 'failed');
CREATE TYPE analysis_severity AS ENUM ('critical', 'warning', 'suggestion', 'praise');
CREATE TYPE guide_difficulty AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE milestone_status AS ENUM ('locked', 'in_progress', 'completed');

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. PROFILES
-- ============================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    primary_trade trade_type NOT NULL DEFAULT 'general',
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0 AND experience_years <= 60),
    license_number TEXT,
    company_name TEXT,
    location_city TEXT,
    location_state TEXT,
    bio TEXT,
    skill_level INTEGER NOT NULL DEFAULT 1 CHECK (skill_level >= 1 AND skill_level <= 100),
    total_sessions INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_session_at TIMESTAMPTZ,
    preferences JSONB NOT NULL DEFAULT '{
        "notifications_enabled": true,
        "daily_reminder_time": "08:00",
        "preferred_units": "imperial",
        "camera_quality": "high",
        "offline_mode": false
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. TRADE_SPECIALTIES
-- ============================================================
CREATE TABLE trade_specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade trade_type NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    certification TEXT,
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, trade)
);

-- ============================================================
-- 4. COACHING_SESSIONS
-- ============================================================
CREATE TABLE coaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade trade_type NOT NULL,
    title TEXT,
    description TEXT,
    status session_status NOT NULL DEFAULT 'capturing',
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    job_type TEXT,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    duration_seconds INTEGER DEFAULT 0,
    is_offline_sync BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. SESSION_PHOTOS
-- ============================================================
CREATE TABLE session_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    original_width INTEGER,
    original_height INTEGER,
    file_size_bytes INTEGER,
    capture_order INTEGER NOT NULL DEFAULT 0,
    scene_classification TEXT,
    scene_confidence NUMERIC(4,3),
    exif_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. AI_ANALYSES
-- ============================================================
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES coaching_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_version TEXT NOT NULL DEFAULT 'gpt-4o-2024-08-06',
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    summary TEXT NOT NULL,
    raw_response JSONB NOT NULL,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. ANALYSIS_FINDINGS
-- ============================================================
CREATE TABLE analysis_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES ai_analyses(id) ON DELETE CASCADE,
    photo_id UUID REFERENCES session_photos(id) ON DELETE SET NULL,
    severity analysis_severity NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    code_reference TEXT,
    recommendation TEXT,
    bounding_box JSONB,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. GUIDES
-- ============================================================
CREATE TABLE guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade trade_type NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    difficulty guide_difficulty NOT NULL DEFAULT 'beginner',
    estimated_minutes INTEGER NOT NULL DEFAULT 10,
    cover_image_url TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. GUIDE_SECTIONS
-- ============================================================
CREATE TABLE guide_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_md TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'diagram')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    code_references TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. GUIDE_PROGRESS
-- ============================================================
CREATE TABLE guide_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    last_section_id UUID REFERENCES guide_sections(id) ON DELETE SET NULL,
    completed_sections INTEGER NOT NULL DEFAULT 0,
    total_sections INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, guide_id)
);

-- ============================================================
-- 11. SKILL_MILESTONES
-- ============================================================
CREATE TABLE skill_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade trade_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    required_score INTEGER NOT NULL DEFAULT 70,
    required_sessions INTEGER NOT NULL DEFAULT 5,
    skill_category TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    badge_icon TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. USER_MILESTONES
-- ============================================================
CREATE TABLE user_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES skill_milestones(id) ON DELETE CASCADE,
    status milestone_status NOT NULL DEFAULT 'locked',
    progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
    qualifying_sessions UUID[] DEFAULT '{}',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, milestone_id)
);

-- ============================================================
-- 13. PLANS
-- ============================================================
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tier subscription_tier NOT NULL UNIQUE,
    price_monthly_cents INTEGER NOT NULL,
    price_yearly_cents INTEGER NOT NULL,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    revcat_offering_id TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    revcat_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'expired')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('session_complete', 'milestone_unlocked', 'streak_reminder', 'guide_recommendation', 'subscription', 'system')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users & Profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_trade_specialties_user_id ON trade_specialties(user_id);
CREATE INDEX idx_trade_specialties_trade ON trade_specialties(trade);

-- Coaching Sessions
CREATE INDEX idx_sessions_user_id ON coaching_sessions(user_id);
CREATE INDEX idx_sessions_user_status ON coaching_sessions(user_id, status);
CREATE INDEX idx_sessions_user_created ON coaching_sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_trade ON coaching_sessions(trade);
CREATE INDEX idx_session_photos_session ON session_photos(session_id);
CREATE INDEX idx_session_photos_user ON session_photos(user_id);

-- AI Analyses
CREATE INDEX idx_analyses_session ON ai_analyses(session_id);
CREATE INDEX idx_analyses_user ON ai_analyses(user_id);
CREATE INDEX idx_findings_analysis ON analysis_findings(analysis_id);
CREATE INDEX idx_findings_severity ON analysis_findings(severity);

-- Guides
CREATE INDEX idx_guides_trade ON guides(trade);
CREATE INDEX idx_guides_difficulty ON guides(difficulty);
CREATE INDEX idx_guides_published ON guides(is_published) WHERE is_published = true;
CREATE INDEX idx_guide_sections_guide ON guide_sections(guide_id);
CREATE INDEX idx_guide_progress_user ON guide_progress(user_id);
CREATE INDEX idx_guide_progress_user_guide ON guide_progress(user_id, guide_id);

-- Progress
CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);
CREATE INDEX idx_user_milestones_status ON user_milestones(user_id, status);
CREATE INDEX idx_skill_milestones_trade ON skill_milestones(trade);

-- Subscriptions
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status) WHERE status = 'active';
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Trade Specialties
ALTER TABLE trade_specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialties_select_own" ON trade_specialties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "specialties_insert_own" ON trade_specialties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "specialties_update_own" ON trade_specialties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "specialties_delete_own" ON trade_specialties FOR DELETE USING (auth.uid() = user_id);

-- Coaching Sessions
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own" ON coaching_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON coaching_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON coaching_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON coaching_sessions FOR DELETE USING (auth.uid() = user_id);

-- Session Photos
ALTER TABLE session_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_select_own" ON session_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "photos_insert_own" ON session_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "photos_delete_own" ON session_photos FOR DELETE USING (auth.uid() = user_id);

-- AI Analyses
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analyses_select_own" ON ai_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "analyses_insert_service" ON ai_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analysis Findings
ALTER TABLE analysis_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "findings_select_own" ON analysis_findings FOR SELECT
    USING (EXISTS (SELECT 1 FROM ai_analyses WHERE ai_analyses.id = analysis_findings.analysis_id AND ai_analyses.user_id = auth.uid()));

-- Guides (public read for published)
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guides_select_published" ON guides FOR SELECT USING (is_published = true);

ALTER TABLE guide_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sections_select_published" ON guide_sections FOR SELECT
    USING (EXISTS (SELECT 1 FROM guides WHERE guides.id = guide_sections.guide_id AND guides.is_published = true));

-- Guide Progress
ALTER TABLE guide_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_select_own" ON guide_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_insert_own" ON guide_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update_own" ON guide_progress FOR UPDATE USING (auth.uid() = user_id);

-- User Milestones
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_select_own" ON user_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "milestones_insert_own" ON user_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "milestones_update_own" ON user_milestones FOR UPDATE USING (auth.uid() = user_id);

-- Skill Milestones (public read)
ALTER TABLE skill_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_milestones_select_all" ON skill_milestones FOR SELECT USING (true);

-- Plans (public read)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_select_active" ON plans FOR SELECT USING (is_active = true);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sessions_updated_at BEFORE UPDATE ON coaching_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_guides_updated_at BEFORE UPDATE ON guides FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_guide_sections_updated_at BEFORE UPDATE ON guide_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_guide_progress_updated_at BEFORE UPDATE ON guide_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_user_milestones_updated_at BEFORE UPDATE ON user_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

    INSERT INTO profiles (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment session count on profile after session completes
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE profiles
        SET total_sessions = total_sessions + 1,
            last_session_at = now()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_session_completed
    AFTER UPDATE ON coaching_sessions
    FOR EACH ROW EXECUTE FUNCTION update_session_stats();
