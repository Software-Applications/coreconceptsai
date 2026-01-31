-- Add textbook_author column to subjects table
ALTER TABLE public.subjects ADD COLUMN textbook_author text;

-- Create storage bucket for textbook covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('textbook-covers', 'textbook-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to textbook covers
CREATE POLICY "Textbook covers are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'textbook-covers');

-- Allow service role to insert textbook covers
CREATE POLICY "Service role can upload textbook covers"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'textbook-covers');

-- Update subjects with author names
UPDATE public.subjects 
SET textbook_author = 'Robert W. Bauman'
WHERE name = 'Microbiology';

UPDATE public.subjects 
SET textbook_author = 'Theodore L. Brown et al.'
WHERE name = 'Chemistry';

UPDATE public.subjects 
SET textbook_author = 'Lisa A. Urry et al.'
WHERE name = 'Biology';