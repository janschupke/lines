CREATE TABLE IF NOT EXISTS high_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_duration INTEGER,
  balls_cleared INTEGER,
  turns_count INTEGER NOT NULL,
  individual_balls_popped INTEGER NOT NULL,
  lines_popped INTEGER NOT NULL,
  longest_line_popped INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_achieved_at ON high_scores(achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_turns ON high_scores(turns_count DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_lines ON high_scores(lines_popped DESC);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read access" ON high_scores
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert access" ON high_scores
  FOR INSERT WITH CHECK (true); 
