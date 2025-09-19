-- Migration to add carrier management tables
-- Created: 2025-09-19

-- User carrier preferences table
CREATE TABLE IF NOT EXISTS user_carrier_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    carrier_id TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, carrier_id)
);

-- Organization carrier settings table
CREATE TABLE IF NOT EXISTS organization_carrier_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id TEXT NOT NULL,
    carrier_id TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, carrier_id)
);

-- User documents table
CREATE TABLE IF NOT EXISTS user_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    carrier_id TEXT NOT NULL,
    carrier_name TEXT NOT NULL,
    effective_date DATE,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_carrier_preferences_user_id ON user_carrier_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carrier_preferences_carrier_id ON user_carrier_preferences(carrier_id);
CREATE INDEX IF NOT EXISTS idx_organization_carrier_settings_org_id ON organization_carrier_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_carrier_settings_carrier_id ON organization_carrier_settings(carrier_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_carrier_id ON user_documents(carrier_id);
