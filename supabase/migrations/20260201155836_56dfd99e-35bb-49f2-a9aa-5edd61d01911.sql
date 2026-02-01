-- Clear all existing transcripts and generated audio URLs
-- This is part of implementing the transcript caching architecture
-- Transcripts will only be saved for user-requested topics going forward
UPDATE topics SET transcript = NULL, generated_audio_url = NULL;