-- Enhanced schema for history and analytics functionality
-- This ensures proper data relationships and analytics collection

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_intakes_user_id_created_at ON intakes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_intake_id ON recommendations(intake_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_recommendation_id ON outcomes(recommendation_id);

-- Create analytics aggregation table for better performance
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  snapshot_date TEXT NOT NULL, -- YYYY-MM-DD format
  total_intakes INTEGER DEFAULT 0,
  total_recommendations INTEGER DEFAULT 0,
  average_fit_score REAL DEFAULT 0,
  placement_rate REAL DEFAULT 0,
  top_carriers TEXT, -- JSON array of top carriers
  trends_data TEXT, -- JSON array of monthly trends
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_date ON analytics_snapshots(user_id, snapshot_date);

-- Create user activity log for detailed tracking
CREATE TABLE IF NOT EXISTS user_activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'intake_submitted', 'recommendation_viewed', 'outcome_logged'
  activity_data TEXT, -- JSON data specific to activity type
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_type ON user_activity_log(user_id, activity_type);

-- Create recommendation results table (if not exists)
CREATE TABLE IF NOT EXISTS recommendation_results (
  id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  recommendations TEXT NOT NULL, -- JSON array of recommendations
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(intake_id) REFERENCES intakes(id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_results_intake_id ON recommendation_results(intake_id);
