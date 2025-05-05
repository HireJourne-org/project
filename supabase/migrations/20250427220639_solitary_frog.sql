/*
  # Create submissions and reports tables

  1. New Tables
    - `submissions`
      - `submission_id` (uuid, primary key)
      - `job_description` (text)
      - `company_name` (text)
      - `timestamp` (timestamptz)
      - `report_link` (text, nullable)
      - `email` (text)
      - `user_id` (uuid, foreign key)

    - `reports`
      - `report_id` (uuid, primary key)
      - `submission_id` (uuid, foreign key)
      - `report_pdf_url` (text)
      - `company_overview_summary` (text)
      - `potential_interview_questions` (text)
      - `key_insights` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, foreign key)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description text NOT NULL,
  company_name text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  report_link text,
  email text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
  report_pdf_url text,
  company_overview_summary text,
  potential_interview_questions text,
  key_insights text,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can create their own submissions" ON submissions;
  DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
  DROP POLICY IF EXISTS "Users can update their own submissions" ON submissions;
  DROP POLICY IF EXISTS "Users can delete their own submissions" ON submissions;
  
  DROP POLICY IF EXISTS "Users can create their own reports" ON reports;
  DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
  DROP POLICY IF EXISTS "Users can update their own reports" ON reports;
  DROP POLICY IF EXISTS "Users can delete their own reports" ON reports;
END $$;

-- Policies for submissions
CREATE POLICY "Users can create their own submissions"
  ON submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
  ON submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions"
  ON submissions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for reports
CREATE POLICY "Users can create their own reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);