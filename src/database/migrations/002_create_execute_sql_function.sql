-- Migration: Create execute_sql function for running arbitrary SQL

CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the anon role (used by Supabase client)
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO anon; 
