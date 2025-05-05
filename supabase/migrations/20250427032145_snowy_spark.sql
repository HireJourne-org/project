/*
  # Interview Preparation System Schema

  1. New Tables
    - `submissions`
      - `submission_id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `company_name` (text)
      - `job_description` (text)
      - `resume_url` (text)
      - `email` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `report_link` (text)

    - `reports`
      - `report_id` (uuid, primary key)
      - `submission_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `report_pdf_url` (text)
      - `company_overview_summary` (text)
      - `potential_interview_questions` (text)
      - `key_insights` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  job_description text NOT NULL,
  resume_url text,
  email text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  report_link text
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Submissions policies
CREATE POLICY "Users can create their own submissions"
  ON submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own submissions"
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

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES submissions(submission_id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  report_pdf_url text,
  company_overview_summary text,
  potential_interview_questions text,
  key_insights text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Reports policies
CREATE POLICY "Users can read their own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for resumes and reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their own resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can read reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'reports');