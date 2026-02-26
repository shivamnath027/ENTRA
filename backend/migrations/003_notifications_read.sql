-- migrations/003_notifications_read.sql
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications (user_id, read_at, created_at DESC);
