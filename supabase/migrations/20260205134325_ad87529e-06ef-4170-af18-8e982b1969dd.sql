-- Create exams table for storing user exam schedules
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_chapters junction table to link exams to specific chapters
CREATE TABLE public.exam_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate chapter links per exam
  UNIQUE(exam_id, chapter_id)
);

-- Enable Row Level Security
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_chapters ENABLE ROW LEVEL SECURITY;

-- RLS policies for exams table
CREATE POLICY "Users can view own exams"
ON public.exams
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exams"
ON public.exams
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exams"
ON public.exams
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exams"
ON public.exams
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for exam_chapters - users can manage chapters for their own exams
CREATE POLICY "Users can view chapters for own exams"
ON public.exam_chapters
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.exams
  WHERE exams.id = exam_chapters.exam_id
  AND exams.user_id = auth.uid()
));

CREATE POLICY "Users can insert chapters for own exams"
ON public.exam_chapters
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.exams
  WHERE exams.id = exam_chapters.exam_id
  AND exams.user_id = auth.uid()
));

CREATE POLICY "Users can delete chapters for own exams"
ON public.exam_chapters
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.exams
  WHERE exams.id = exam_chapters.exam_id
  AND exams.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_exams_user_id ON public.exams(user_id);
CREATE INDEX idx_exams_subject_id ON public.exams(subject_id);
CREATE INDEX idx_exams_exam_date ON public.exams(exam_date);
CREATE INDEX idx_exam_chapters_exam_id ON public.exam_chapters(exam_id);
CREATE INDEX idx_exam_chapters_chapter_id ON public.exam_chapters(chapter_id);