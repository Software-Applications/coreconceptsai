CREATE TABLE public.topic_listens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id uuid,
  listened_at timestamptz DEFAULT now()
);

ALTER TABLE public.topic_listens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topic listens"
  ON public.topic_listens FOR SELECT
  TO public USING (true);

CREATE POLICY "Users can insert own listens"
  ON public.topic_listens FOR INSERT
  TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous can insert listens"
  ON public.topic_listens FOR INSERT
  TO public WITH CHECK (user_id IS NULL);

CREATE INDEX idx_topic_listens_topic_id ON public.topic_listens(topic_id);