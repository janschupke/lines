-- Migration: Create get_table_indexes function for dynamic index validation

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
