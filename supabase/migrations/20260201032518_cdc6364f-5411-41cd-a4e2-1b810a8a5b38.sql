-- Create topic_requests table for user-submitted content suggestions
CREATE TABLE public.topic_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  query TEXT NOT NULL,
  subject_id UUID NULL REFERENCES public.subjects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.topic_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated or anonymous) to insert requests
CREATE POLICY "Anyone can submit topic requests"
ON public.topic_requests
FOR INSERT
WITH CHECK (true);

-- Users can only view their own requests (for future "My Requests" feature)
CREATE POLICY "Users can view own topic requests"
ON public.topic_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Add index for efficient querying by status
CREATE INDEX idx_topic_requests_status ON public.topic_requests(status);

-- Add index for user lookups
CREATE INDEX idx_topic_requests_user_id ON public.topic_requests(user_id);