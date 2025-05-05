/*
  # Update Submissions Schema

  1. Changes
    - Add interviewers_list column to store interviewer information
    - Update status column with default value
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add interviewers_list column and update status default
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS interviewers_list JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Create index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_submissions_status 
ON submissions(status);

-- Create index for company name searches
CREATE INDEX IF NOT EXISTS idx_submissions_company_name 
ON submissions USING gin(to_tsvector('english', company_name));

-- Update status column with more specific defaults
ALTER TABLE submissions 
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN status TYPE TEXT,
ADD CONSTRAINT submissions_status_check 
CHECK (status IN ('pending', 'processing', 'complete', 'failed'));

-- Add comment to explain interviewers_list structure
COMMENT ON COLUMN submissions.interviewers_list IS 
'Array of interviewer objects with structure: [{"name": "string", "linkedin_url": "string"}]';

-- Update existing rows with empty interviewers list
UPDATE submissions 
SET interviewers_list = '[]'::jsonb 
WHERE interviewers_list IS NULL;