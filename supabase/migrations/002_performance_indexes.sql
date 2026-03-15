-- FieldLens: Performance Indexes
-- Migration: 002_performance_indexes

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- coaching_sessions: user sessions by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coaching_sessions_user_status_created
  ON coaching_sessions(user_id, status, created_at DESC);

-- ai_analyses: session analyses by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_analyses_session_created
  ON ai_analyses(session_id, created_at DESC);

-- guide_progress: user guide progress
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guide_progress_user_created
  ON guide_progress(user_id, created_at DESC);

-- skill_milestones: user milestones by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_milestones_user_created
  ON user_milestones(user_id, created_at DESC);

-- notifications: user unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;

-- subscriptions: user active subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status, created_at DESC);
