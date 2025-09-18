-- User analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  intakes_submitted INTEGER DEFAULT 0,
  recommendations_generated INTEGER DEFAULT 0,
  carriers_evaluated INTEGER DEFAULT 0,
  placements_successful INTEGER DEFAULT 0,
  average_fit_score REAL,
  total_processing_time INTEGER, -- milliseconds
  citations_found INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period_start, period_end)
);

-- Organization analytics table
CREATE TABLE IF NOT EXISTS org_analytics (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  intakes_submitted INTEGER DEFAULT 0,
  recommendations_generated INTEGER DEFAULT 0,
  placements_successful INTEGER DEFAULT 0,
  average_fit_score REAL,
  top_carriers JSON, -- Array of {carrierId, count, successRate}
  seat_utilization REAL, -- percentage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, period_start, period_end)
);

-- Usage tracking table for monitoring
CREATE TABLE IF NOT EXISTS usage_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT,
  event_type TEXT NOT NULL, -- 'intake', 'recommendation', 'api_call', etc.
  event_details JSON,
  quota_used INTEGER DEFAULT 1,
  quota_limit INTEGER,
  is_within_limit BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_timestamp (user_id, timestamp),
  INDEX idx_org_timestamp (organization_id, timestamp)
);

-- Admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id TEXT PRIMARY KEY,
  notification_type TEXT NOT NULL, -- 'usage_alert', 'subscription_change', 'error_alert', etc.
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  user_id TEXT,
  organization_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSON,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  INDEX idx_unread (is_read, created_at)
);

-- Webhook events log
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  user_id TEXT,
  organization_id TEXT,
  payload JSON,
  status TEXT DEFAULT 'received', -- 'received', 'processing', 'completed', 'failed'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type, created_at),
  INDEX idx_status (status, created_at)
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id TEXT PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'api_latency', 'rag_query_time', 'recommendation_generation', etc.
  endpoint TEXT,
  user_id TEXT,
  value REAL NOT NULL, -- milliseconds or count
  metadata JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metric_type (metric_type, timestamp)
);

-- Billing events table
CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT,
  event_type TEXT NOT NULL, -- 'subscription_created', 'payment_succeeded', 'payment_failed', etc.
  plan_key TEXT,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'USD',
  stripe_event_id TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_billing (user_id, created_at)
);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'data_access', 'data_modification', 'settings_change', etc.
  resource_type TEXT, -- 'intake', 'recommendation', 'user_profile', etc.
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_audit (user_id, timestamp),
  INDEX idx_action (action, timestamp)
);