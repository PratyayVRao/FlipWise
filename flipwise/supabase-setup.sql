-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sets table
CREATE TABLE IF NOT EXISTS study_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_set_id UUID REFERENCES study_sets(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  study_set_id UUID REFERENCES study_sets(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Study sets policies
CREATE POLICY "Study sets are viewable by owner" 
  ON study_sets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sets" 
  ON study_sets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sets" 
  ON study_sets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sets" 
  ON study_sets FOR DELETE 
  USING (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Flashcards are viewable by study set owner" 
  ON flashcards FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM study_sets WHERE id = flashcards.study_set_id
    )
  );

CREATE POLICY "Users can insert flashcards to their study sets" 
  ON flashcards FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM study_sets WHERE id = flashcards.study_set_id
    )
  );

CREATE POLICY "Users can update flashcards in their study sets" 
  ON flashcards FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM study_sets WHERE id = flashcards.study_set_id
    )
  );

CREATE POLICY "Users can delete flashcards from their study sets" 
  ON flashcards FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM study_sets WHERE id = flashcards.study_set_id
    )
  );

-- Study sessions policies
CREATE POLICY "Study sessions are viewable by owner" 
  ON study_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" 
  ON study_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" 
  ON study_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions" 
  ON study_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_study_sets_modtime
BEFORE UPDATE ON study_sets
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_flashcards_modtime
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

