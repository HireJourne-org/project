/*
  # Fix chat messages migration
  
  1. Tables
    - Ensure chat_messages table exists with proper structure
    - Add index for performance
  
  2. Security
    - Enable RLS
    - Add policies for user access control
    
  3. Changes
    - Add policy existence checks to prevent conflicts
*/

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index on user_id and created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created 
ON chat_messages(user_id, created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can create messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
END $$;

-- Create policies
CREATE POLICY "Users can read their own messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);