-- Fix storage policies to use the correct user folder structure
-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can upload files to uploads folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read reports" ON storage.objects;

-- Create proper policies for resumes bucket
CREATE POLICY "Users can upload their own resumes" ON storage.objects
  FOR INSERT WITH CHECK 
  (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own resumes" ON storage.objects
  FOR SELECT USING 
  (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own resumes" ON storage.objects
  FOR DELETE USING 
  (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create policies for reports bucket
CREATE POLICY "Anyone can read reports" ON storage.objects
  FOR SELECT USING 
  (bucket_id = 'reports');

CREATE POLICY "Authenticated users can insert reports" ON storage.objects
  FOR INSERT WITH CHECK 
  (bucket_id = 'reports' AND auth.role() = 'authenticated');

-- Allow authenticated users to access uploads folder during migration
CREATE POLICY "Allow migration from uploads folder" ON storage.objects
  FOR SELECT USING 
  (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'uploads' AND auth.role() = 'authenticated'); 