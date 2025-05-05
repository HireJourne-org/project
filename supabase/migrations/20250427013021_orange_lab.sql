/*
  # Create interview data tables

  1. New Tables
    - `interviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `resume_url` (text)
      - `job_description` (text)
      - `created_at` (timestamptz)
      - `status` (text)
    
    - `interviewers`
      - `id` (uuid, primary key)
      - `interview_id` (uuid, references interviews)
      - `linkedin_url` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create interviews table
CREATE TABLE interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  resume_url text,
  job_description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending'
);

-- Create interviewers table
CREATE TABLE interviewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES interviews(id) ON DELETE CASCADE NOT NULL,
  linkedin_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviewers ENABLE ROW LEVEL SECURITY;

-- Policies for interviews table
CREATE POLICY "Users can create their own interviews"
  ON interviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interviews"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews"
  ON interviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interviews"
  ON interviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for interviewers table
CREATE POLICY "Users can create interviewers for their interviews"
  ON interviewers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE id = interview_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view interviewers for their interviews"
  ON interviewers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE id = interview_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update interviewers for their interviews"
  ON interviewers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE id = interview_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE id = interview_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete interviewers for their interviews"
  ON interviewers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE id = interview_id
      AND user_id = auth.uid()
    )
  );