-- Core carrier and product tables
CREATE TABLE IF NOT EXISTS carriers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  am_best TEXT,
  portal_url TEXT,
  agent_phone TEXT,
  preferred_tier_rank INTEGER DEFAULT 0,
  available_states TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  carrier_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- IUL, Term, Annuity, etc.
  min_age INTEGER,
  max_age INTEGER,
  bands TEXT, -- JSON object for coverage bands
  underwriting_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (carrier_id) REFERENCES carriers(id)
);

-- Document management tables
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  carrier_id TEXT NOT NULL,
  title TEXT NOT NULL,
  effective_date TEXT NOT NULL,
  version TEXT,
  r2_key TEXT NOT NULL,
  doc_type TEXT NOT NULL, -- underwriting_guide, build_chart, program_flyer, etc.
  provenance TEXT,
  hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (carrier_id) REFERENCES carriers(id)
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  text TEXT NOT NULL,
  section TEXT,
  page INTEGER,
  tokens INTEGER,
  vector_id TEXT, -- Reference to Vectorize index
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- Business rules extracted from documents
CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  carrier_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  condition_json TEXT NOT NULL, -- JSON object
  effect_json TEXT NOT NULL, -- JSON object
  source_chunk_ids TEXT, -- JSON array of chunk IDs
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (carrier_id) REFERENCES carriers(id)
);

-- Tenant and authentication tables
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL, -- Individual, Team, Enterprise
  status TEXT NOT NULL DEFAULT 'active', -- active, past_due, suspended
  limits_json TEXT, -- JSON object for usage limits
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Intake submissions with Orion's structure
CREATE TABLE IF NOT EXISTS intakes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  payload_json TEXT NOT NULL, -- The 8 core questions + tier2 data
  validated BOOLEAN DEFAULT FALSE,
  tier2_triggered BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
);

-- Recommendations with enhanced structure
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  model_snapshot TEXT,
  fit_json TEXT NOT NULL, -- JSON array of carrier recommendations
  citations TEXT NOT NULL, -- JSON array of citations
  latency_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  recommendation_id TEXT,
  user_id TEXT,
  carrier_id TEXT,
  carrier_name TEXT,
  fit_score REAL,
  FOREIGN KEY (intake_id) REFERENCES intakes(id)
);

-- Placement outcomes
CREATE TABLE IF NOT EXISTS outcomes (
  id TEXT PRIMARY KEY,
  recommendation_id TEXT NOT NULL,
  status TEXT NOT NULL, -- applied, approved, declined
  final_carrier_id TEXT,
  notes TEXT,
  premium REAL,
  face_amount REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recommendation_id) REFERENCES recommendations(id),
  FOREIGN KEY (final_carrier_id) REFERENCES carriers(id)
);

-- Advisory notes linked to recommendations
CREATE TABLE IF NOT EXISTS advisories (
  id TEXT PRIMARY KEY,
  recommendation_id TEXT NOT NULL,
  text TEXT NOT NULL,
  source_chunk_ids TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recommendation_id) REFERENCES recommendations(id)
);

-- Audit logging for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  event TEXT NOT NULL,
  entity TEXT,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Legacy compatibility (keep existing table names but mark as deprecated)
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  user_id TEXT
);

-- For current worker compatibility
CREATE TABLE IF NOT EXISTS intake_submissions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'intake',
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT
);

-- User profiles and subscription management (modern SaaS structure)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'inactive', -- active, past_due, suspended, canceled
  subscription_tier TEXT NOT NULL DEFAULT 'individual', -- individual, team, enterprise
  stripe_customer_id TEXT,
  recommendations_used INTEGER DEFAULT 0,
  recommendations_limit INTEGER DEFAULT 200,
  current_period_start TEXT,
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_active_at TEXT
);

-- Analytics and usage tracking
CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- recommendation_requested, recommendation_viewed, outcome_logged
  event_data TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);

-- User carrier preferences (individual user selections)
CREATE TABLE IF NOT EXISTS user_carrier_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  carrier_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user_profiles(user_id),
  FOREIGN KEY(carrier_id) REFERENCES carriers(id),
  UNIQUE(user_id, carrier_id)
);

-- Organization carrier settings (admin-controlled)
CREATE TABLE IF NOT EXISTS organization_carrier_settings (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  carrier_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(carrier_id) REFERENCES carriers(id),
  UNIQUE(organization_id, carrier_id)
);

-- User document uploads (for underwriting documents)
CREATE TABLE IF NOT EXISTS user_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  carrier_id TEXT NOT NULL,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  doc_type TEXT NOT NULL DEFAULT 'underwriting_guide',
  effective_date TEXT,
  version TEXT DEFAULT '1.0',
  processed BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user_profiles(user_id),
  FOREIGN KEY(carrier_id) REFERENCES carriers(id)
);

-- Add missing columns to existing tables
ALTER TABLE documents ADD COLUMN processed BOOLEAN DEFAULT FALSE;
ALTER TABLE chunks ADD COLUMN chunk_index INTEGER DEFAULT 0;
ALTER TABLE chunks ADD COLUMN embedding_id TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_vector_id ON chunks(vector_id);
CREATE INDEX IF NOT EXISTS idx_rules_carrier_id ON rules(carrier_id);
CREATE INDEX IF NOT EXISTS idx_intakes_tenant_id ON intakes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_intake_id ON recommendations(intake_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_recommendation_id ON outcomes(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_documents_carrier_id ON documents(carrier_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carrier_preferences_user_id ON user_carrier_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carrier_preferences_carrier_id ON user_carrier_preferences(carrier_id);
CREATE INDEX IF NOT EXISTS idx_organization_carrier_settings_org_id ON organization_carrier_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_carrier_settings_carrier_id ON organization_carrier_settings(carrier_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_carrier_id ON user_documents(carrier_id);
