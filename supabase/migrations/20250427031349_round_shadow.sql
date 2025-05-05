/*
  # Initial Schema Setup

  1. New Tables
    - `users` - User profiles
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
    
    - `questions` - Interview questions
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `question` (text)
      - `answer` (text)
      - `category` (text)
      - `status` (text)
      - `difficulty` (text)
      - `notes` (text)
      - `last_reviewed` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  category text,
  status text DEFAULT 'Pending',
  difficulty text,
  notes text,
  last_reviewed timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Questions policies
CREATE POLICY "Users can create their own questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions"
  ON questions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  description text,
  funding_rounds jsonb,
  employee_count integer,
  industry text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text,
  url text,
  source text,
  published_date date
);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news articles"
  ON news_articles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create financials table
CREATE TABLE IF NOT EXISTS financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  market_cap bigint,
  revenue bigint,
  net_income bigint,
  pe_ratio double precision,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read financials"
  ON financials
  FOR SELECT
  TO authenticated
  USING (true);

-- Create tech_stack table
CREATE TABLE IF NOT EXISTS tech_stack (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  tech_name text,
  category text
);

ALTER TABLE tech_stack ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tech stack"
  ON tech_stack
  FOR SELECT
  TO authenticated
  USING (true);