-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('food_giver', 'food_receiver');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  profile_picture_url TEXT,
  organization_name TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create food_listings table
CREATE TABLE public.food_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quantity TEXT NOT NULL,
  pickup_time TIMESTAMPTZ NOT NULL,
  photo_url TEXT,
  image_urls TEXT[],
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  food_type TEXT,
  is_available BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on food_listings
ALTER TABLE public.food_listings ENABLE ROW LEVEL SECURITY;

-- Food listings policies
CREATE POLICY "Anyone can view available food listings"
  ON public.food_listings FOR SELECT
  USING (is_available = true);

CREATE POLICY "Food givers can view their own listings"
  ON public.food_listings FOR SELECT
  USING (auth.uid() = giver_id);

CREATE POLICY "Food givers can create listings"
  ON public.food_listings FOR INSERT
  WITH CHECK (auth.uid() = giver_id);

CREATE POLICY "Food givers can update their own listings"
  ON public.food_listings FOR UPDATE
  USING (auth.uid() = giver_id);

CREATE POLICY "Food givers can delete their own listings"
  ON public.food_listings FOR DELETE
  USING (auth.uid() = giver_id);

-- Create food_requests table
CREATE TABLE public.food_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  people_count INTEGER NOT NULL CHECK (people_count > 0),
  food_preference TEXT NOT NULL CHECK (food_preference IN ('vegetarian', 'non_vegetarian', 'vegan', 'any')),
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),
  needed_by TIMESTAMPTZ NOT NULL,
  notes TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  location_address TEXT NOT NULL,
  delivery_preference TEXT DEFAULT 'pickup' CHECK (delivery_preference IN ('pickup', 'delivery')),
  organization_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for food_requests
ALTER TABLE food_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for food_requests
CREATE POLICY "Anyone can view active requests"
  ON food_requests FOR SELECT
  USING (status = 'active' AND needed_by > NOW());

CREATE POLICY "Receivers can create requests"
  ON food_requests FOR INSERT
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Receivers can view their own requests"
  ON food_requests FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Receivers can update their own requests"
  ON food_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Receivers can delete their own requests"
  ON food_requests FOR DELETE
  USING (auth.uid() = receiver_id);

-- Indexes for food_requests
CREATE INDEX idx_food_requests_location ON food_requests(latitude, longitude);
CREATE INDEX idx_food_requests_status ON food_requests(status, needed_by);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (user1_id < user2_id)
);

-- Add unique constraint for conversations
CREATE UNIQUE INDEX idx_conversations_users ON conversations(user1_id, user2_id);

-- Enable RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() IN (user1_id, user2_id));

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL CHECK (LENGTH(message_text) <= 5000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth.uid() IN (user1_id, user2_id)
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Indexes for messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, sender_id) WHERE read_at IS NULL;

-- Enable realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    new.id,
    (new.raw_user_meta_data->>'role')::user_role,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function: Get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversation_id UUID;
  current_user_id UUID := auth.uid();
  user1 UUID;
  user2 UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure consistent ordering (smaller UUID first)
  IF current_user_id < other_user_id THEN
    user1 := current_user_id;
    user2 := other_user_id;
  ELSE
    user1 := other_user_id;
    user2 := current_user_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE user1_id = user1 AND user2_id = user2;

  -- Create if doesn't exist
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (user1, user2)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

-- Function: Mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND read_at IS NULL;
END;
$$;

-- Function: Auto-expire old requests
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE food_requests
  SET status = 'expired'
  WHERE status = 'active'
    AND needed_by < NOW();
END;
$$;

-- Create storage bucket for food photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-photos', 'food-photos', true);

-- Storage policies for food photos
CREATE POLICY "Anyone can view food photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'food-photos');

CREATE POLICY "Authenticated users can upload food photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'food-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own food photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own food photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE OR REPLACE FUNCTION public.get_user_conversations_with_details(p_user_id UUID)
RETURNS TABLE (
  id UUID,                -- The conversation's ID
  other_user_id UUID,     -- The ID of the other person in the chat
  other_user_name TEXT,   -- The full name of the other person
  other_user_avatar TEXT, -- The profile picture URL of the other person
  last_message_text TEXT, -- The text of the very last message
  last_message_at TIMESTAMPTZ, -- The timestamp of the last message
  unread_count BIGINT      -- How many messages are unread for the calling user (p_user_id)
)
LANGUAGE plpgsql
SECURITY DEFINER          -- This is necessary to bypass RLS and read the other user's profile info
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_messages AS (
    -- This subquery efficiently finds the single most recent message for each conversation
    SELECT
      m.conversation_id,
      m.message_text,
      ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
    FROM public.messages m
  )
  SELECT
    c.id, -- The conversation ID
    -- This logic correctly identifies who the "other user" is
    CASE
      WHEN c.user1_id = p_user_id THEN c.user2_id
      ELSE c.user1_id
    END AS other_user_id,

    -- This joins the profiles table to get the other user's name and avatar
    p.full_name AS other_user_name,
    p.profile_picture_url AS other_user_avatar,

    -- This joins our ranked_messages to get only the #1 ranked (most recent) message text
    lm.message_text AS last_message_text,
    c.last_message_at,

    -- This subquery efficiently counts only the messages that are unread by the user
    (
      SELECT COUNT(*)
      FROM public.messages msg
      WHERE msg.conversation_id = c.id
        AND msg.sender_id != p_user_id
        AND msg.read_at IS NULL
    ) AS unread_count
  FROM
    public.conversations c
  -- We join profiles on the "other_user_id" we figured out earlier
  JOIN
    public.profiles p ON p.id = CASE
      WHEN c.user1_id = p_user_id THEN c.user2_id
      ELSE c.user1_id
    END
  -- We use a LEFT JOIN because a conversation might not have any messages yet
  LEFT JOIN
    ranked_messages lm ON lm.conversation_id = c.id AND lm.rn = 1
  WHERE
    -- This ensures we only get conversations the user is actually a part of
    c.user1_id = p_user_id OR c.user2_id = p_user_id
  ORDER BY
    -- Sorts the list so the most recent conversation is at the top
    c.last_message_at DESC NULLS LAST;
END;
$$;
