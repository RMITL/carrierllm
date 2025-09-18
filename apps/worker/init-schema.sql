-- Create tables that may not exist yet
CREATE TABLE IF NOT EXISTS recommendation_results (
  id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_results_intake_id ON recommendation_results(intake_id);
CREATE INDEX IF NOT EXISTS idx_documents_processed ON documents(processed) WHERE processed IS NOT NULL;