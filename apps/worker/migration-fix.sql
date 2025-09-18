-- Fix recommendations table to match worker expectations
ALTER TABLE recommendations ADD COLUMN recommendation_id TEXT;
ALTER TABLE recommendations ADD COLUMN user_id TEXT;
ALTER TABLE recommendations ADD COLUMN carrier_id TEXT;
ALTER TABLE recommendations ADD COLUMN carrier_name TEXT;
ALTER TABLE recommendations ADD COLUMN fit_score INTEGER;

-- Add index for user_id for history queries
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_recommendation_id ON recommendations(recommendation_id);

-- Fix intakes table to add user_id for compatibility
ALTER TABLE intakes ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_intakes_user_id ON intakes(user_id);