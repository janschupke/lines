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

CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_achieved_at ON high_scores(achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_turns ON high_scores(turns_count DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_lines ON high_scores(lines_popped DESC);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read access" ON high_scores
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert access" ON high_scores
  FOR INSERT WITH CHECK (true); 
