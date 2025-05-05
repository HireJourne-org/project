/*
  # Fix chat messages policies

  1. Changes
    - Drop existing policies before recreating them
    - Recreate chat_messages policies with proper checks
  
  2. Security
    - Maintain RLS for chat_messages table
    - Ensure users can only access their own messages
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can create messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
END $$;

-- Recreate policies
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