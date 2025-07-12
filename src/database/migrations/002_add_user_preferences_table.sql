CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_name TEXT UNIQUE NOT NULL,
  board_size INTEGER DEFAULT 9,
  time_limit INTEGER DEFAULT 0,
  sound_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_player_name ON user_preferences(player_name);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read access" ON user_preferences
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert access" ON user_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow update access" ON user_preferences
  FOR UPDATE USING (true); 
