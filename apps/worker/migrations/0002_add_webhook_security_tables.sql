-- Migration to add webhook security and audit tables

-- Create webhook rate limiting table
CREATE TABLE IF NOT EXISTS webhook_rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Create webhook events audit table
CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    created_at TEXT NOT NULL,
    processed_at TEXT
);

-- Create user audit log table
CREATE TABLE IF NOT EXISTS user_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    changes TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL
);

-- Create user sessions table (if not exists)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL,
    ended_at TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_ip_time ON webhook_rate_limits (ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type_time ON webhook_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON webhook_events (user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_action ON user_audit_log (action, created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions (session_id);

-- Note: Rate limit cleanup can be handled by a scheduled job
-- DELETE FROM webhook_rate_limits WHERE created_at < datetime('now', '-24 hours');
