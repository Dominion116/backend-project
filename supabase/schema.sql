-- User profiles (1:1 with auth.users, created on registration)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'pregnant_woman'
    CHECK (role IN ('pregnant_woman', 'nurse', 'admin', 'researcher')),
  pregnancy_stage TEXT
    CHECK (pregnancy_stage IN ('first_trimester', 'second_trimester', 'third_trimester', 'postpartum')),
  language TEXT NOT NULL DEFAULT 'en'
    CHECK (language IN ('en', 'yo', 'ha', 'ig')),
  due_date DATE,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_profiles_role ON user_profiles(role);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read and update their own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Conversations (one per chat session)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages (individual chat turns)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT false,   -- true when emergency keywords detected
  flagged_keyword TEXT,                      -- which keyword triggered the flag
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Keep conversations.updated_at current whenever a message is inserted
CREATE OR REPLACE FUNCTION touch_conversation_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_conversation
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION touch_conversation_updated_at();

-- Research participation consent (one row per user, upserted)
CREATE TABLE research_consent (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consented BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL DEFAULT 'v1',
  consented_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE research_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own consent"
  ON research_consent FOR ALL
  USING (auth.uid() = user_id);

-- SUS (System Usability Scale) questionnaire responses
CREATE TABLE sus_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,          -- { q1: 1-5, q2: 1-5, … q10: 1-5 }
  sus_score NUMERIC(5,2),         -- computed 0-100 stored for fast querying
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sus_responses_user_id ON sus_responses(user_id);

ALTER TABLE sus_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own SUS response"
  ON sus_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own SUS response"
  ON sus_responses FOR SELECT
  USING (auth.uid() = user_id);

-- User feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  category TEXT CHECK (category IN ('bug', 'suggestion', 'praise', 'other')),
  comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_category ON feedback(category);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in their conversations"
  ON messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
