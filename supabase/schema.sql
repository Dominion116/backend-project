-- =============================================================================
-- MamaGuide Database Schema
-- Safe to run multiple times — all statements are idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- user_profiles (1:1 with auth.users, created on registration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
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

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read and update their own profile" ON user_profiles;
CREATE POLICY "Users can read and update their own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own conversations" ON conversations;
CREATE POLICY "Users can manage their own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT false,
  flagged_keyword TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(flagged) WHERE flagged = true;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON messages;
CREATE POLICY "Users can manage messages in their conversations"
  ON messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Keep conversations.updated_at in sync when a message is inserted
CREATE OR REPLACE FUNCTION touch_conversation_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_conversation ON messages;
CREATE TRIGGER trg_touch_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION touch_conversation_updated_at();

-- ---------------------------------------------------------------------------
-- research_consent (one row per user, upserted on submit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_consent (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consented BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL DEFAULT 'v1',
  consented_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE research_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own consent" ON research_consent;
CREATE POLICY "Users can manage their own consent"
  ON research_consent FOR ALL
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- sus_responses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sus_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  sus_score NUMERIC(5,2),
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sus_responses_user_id ON sus_responses(user_id);

ALTER TABLE sus_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own SUS response" ON sus_responses;
CREATE POLICY "Users can insert their own SUS response"
  ON sus_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own SUS response" ON sus_responses;
CREATE POLICY "Users can read their own SUS response"
  ON sus_responses FOR SELECT
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  category TEXT CHECK (category IN ('bug', 'suggestion', 'praise', 'other')),
  comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;
CREATE POLICY "Users can insert their own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own feedback" ON feedback;
CREATE POLICY "Users can read their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);
