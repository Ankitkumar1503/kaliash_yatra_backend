ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_pricing JSONB DEFAULT '[]'::jsonb;
