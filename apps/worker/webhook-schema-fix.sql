-- Add missing webhook tables for comprehensive-worker
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id TEXT,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_rate_limits (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT
);

-- Ensure default tenant exists
INSERT OR IGNORE INTO tenants (id, plan, status, limits_json) 
VALUES ('default', 'Individual', 'active', '{"recommendations": 200}');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_ip ON webhook_rate_limits(ip_address);
