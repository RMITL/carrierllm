-- Migration to add user_id to intakes and recommendations tables
-- Created: 2025-09-19

-- Add user_id to intakes table
ALTER TABLE intakes ADD COLUMN user_id TEXT;

-- Add columns to recommendations table
ALTER TABLE recommendations ADD COLUMN recommendation_id TEXT;
ALTER TABLE recommendations ADD COLUMN user_id TEXT;
ALTER TABLE recommendations ADD COLUMN carrier_id TEXT;
ALTER TABLE recommendations ADD COLUMN carrier_name TEXT;
ALTER TABLE recommendations ADD COLUMN fit_score REAL;

-- Add user_id to legacy tables
ALTER TABLE submissions ADD COLUMN user_id TEXT;
ALTER TABLE intake_submissions ADD COLUMN user_id TEXT;

-- Add foreign key constraints if possible, though not all SQLite versions support this
-- This is more for documentation; the schema.sql is the source of truth for new databases.
-- PRAGMA foreign_keys=off;
-- CREATE TABLE intakes_new (...);
-- INSERT INTO intakes_new SELECT ..., NULL FROM intakes;
-- DROP TABLE intakes;
-- ALTER TABLE intakes_new RENAME TO intakes;
-- PRAGMA foreign_keys=on;
