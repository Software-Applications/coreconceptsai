-- Add transcript column to store full audio transcripts
-- This keeps 'description' reserved for short summaries
ALTER TABLE public.topics 
ADD COLUMN transcript text;