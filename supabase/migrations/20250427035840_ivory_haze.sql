/*
  # Add tech stack caching

  1. New Tables
    - `tech_stack_cache`
      - `id` (uuid, primary key)
      - `domain` (text, unique)
      - `technologies` (jsonb array)
      - `last_updated` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policy for authenticated users to read
*/

CREATE TABLE IF NOT EXISTS tech_stack_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE NOT NULL,
  technologies jsonb NOT NULL,
  last_updated timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tech_stack_domain 
ON tech_stack_cache(domain);

-- Enable RLS
ALTER TABLE tech_stack_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read tech stack cache"
  ON tech_stack_cache
  FOR SELECT
  TO authenticated
  USING (true);