-- Migration: Create required RPC functions for migrations
-- This script creates the create_migrations_table_if_not_exists and execute_sql functions

-- 1. Function to create the schema_migrations table if it does not exist
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

-- 2. Function to execute arbitrary SQL (for use in migrations)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to execute migration within a transaction
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

-- 4. Function to execute rollback within a transaction
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
