-- Migration: Add settings column to users table
-- Date: 2024-11-16
-- Description: Adds JSONB settings column to store user preferences

-- Add settings column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'settings'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN settings JSONB DEFAULT NULL;
        
        -- Add comment to the column
        COMMENT ON COLUMN users.settings IS 'User preferences and settings stored as JSON';
    END IF;
END $$;

