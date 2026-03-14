-- Push notification infrastructure for FieldLens

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS push_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered'))
);

CREATE INDEX IF NOT EXISTS idx_push_log_user ON push_notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_log_sent_at ON push_notifications_log(sent_at);

-- Auto cleanup old logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_push_logs()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM push_notifications_log WHERE sent_at < now() - INTERVAL '90 days';
END;
$$;
