-- Initialize database for local development
-- Note: The database 'lines_game' is created automatically by Docker
-- using the POSTGRES_DB environment variable in docker-compose.yml

-- Create extensions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION "uuid-ossp";
    END IF;
END$$;

-- Create schema_migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create high_scores table
CREATE TABLE IF NOT EXISTS high_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_name TEXT NOT NULL CHECK (LENGTH(TRIM(player_name)) > 0),
    score INTEGER NOT NULL CHECK (score >= 0),
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    game_duration INTEGER CHECK (game_duration IS NULL OR game_duration >= 0),
    balls_cleared INTEGER CHECK (balls_cleared IS NULL OR balls_cleared >= 0),
    turns_count INTEGER NOT NULL CHECK (turns_count >= 0),
    individual_balls_popped INTEGER NOT NULL CHECK (individual_balls_popped >= 0),
    lines_popped INTEGER NOT NULL CHECK (lines_popped >= 0),
    longest_line_popped INTEGER NOT NULL CHECK (longest_line_popped >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_achieved_at ON high_scores(achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_turns ON high_scores(turns_count DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_lines ON high_scores(lines_popped DESC);

-- Enable Row Level Security
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

-- Create access policies
CREATE POLICY IF NOT EXISTS "Allow read access" ON high_scores
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert access" ON high_scores
    FOR INSERT WITH CHECK (true);

-- Create execute_sql function for running arbitrary SQL
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the anon role (used by Supabase client)
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO anon;

-- Create get_table_indexes function for dynamic index validation
CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE(index_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT i.indexname::TEXT
  FROM pg_catalog.pg_indexes i
  WHERE i.tablename = table_name
  AND i.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the anon role (used by Supabase client)
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO anon;

-- Create migration RPC functions
-- Function to create the schema_migrations table if it does not exist
CREATE OR REPLACE FUNCTION create_migrations_table_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'schema_migrations'
  ) THEN
    EXECUTE 'CREATE TABLE schema_migrations (
      version INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to execute migration within a transaction
CREATE OR REPLACE FUNCTION execute_migration_transaction(
  migration_sql TEXT,
  migration_version INTEGER,
  migration_name VARCHAR(255)
)
RETURNS void AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Execute the migration SQL
    EXECUTE migration_sql;
    
    -- Record the migration
    INSERT INTO schema_migrations (version, name, applied_at)
    VALUES (migration_version, migration_name, NOW());
    
    -- If we reach here, both operations succeeded
    -- Transaction will be committed automatically
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on any error
      RAISE EXCEPTION 'Migration transaction failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to execute rollback within a transaction
CREATE OR REPLACE FUNCTION execute_rollback_transaction(
  rollback_sql TEXT,
  migration_version INTEGER
)
RETURNS void AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Execute the rollback SQL
    EXECUTE rollback_sql;
    
    -- Remove the migration record
    DELETE FROM schema_migrations WHERE version = migration_version;
    
    -- If we reach here, both operations succeeded
    -- Transaction will be committed automatically
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on any error
      RAISE EXCEPTION 'Rollback transaction failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions for migration functions
GRANT EXECUTE ON FUNCTION create_migrations_table_if_not_exists() TO anon;
GRANT EXECUTE ON FUNCTION execute_migration_transaction(TEXT, INTEGER, VARCHAR(255)) TO anon;
GRANT EXECUTE ON FUNCTION execute_rollback_transaction(TEXT, INTEGER) TO anon;

-- Insert initial migration records
INSERT INTO schema_migrations (version, name) VALUES 
    (1, 'Create high_scores table'),
    (2, 'Create execute_sql function'),
    (3, 'Create get_table_indexes function'),
    (4, 'Create migration RPC functions')
ON CONFLICT (version) DO NOTHING; 
