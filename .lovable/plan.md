

# Clear All Generated Transcripts

## What needs to happen

Set `transcript` and `generated_audio_url` to NULL for all 15 topics that currently have transcripts. This clears the cached content so new transcripts will be generated using the updated 3-stage prompt pipeline.

## Approach

Since this is a data UPDATE operation, I'll create a database migration that runs:

```sql
UPDATE topics SET transcript = NULL, generated_audio_url = NULL WHERE transcript IS NOT NULL;
```

This clears:
- **transcript**: 15 topics with cached transcripts (generated from the old prompt)
- **generated_audio_url**: Any TTS audio generated from those old transcripts

The `audio_url`, `title`, `description`, and other fields remain untouched.

## Affected Topics (15 total)

All subjects: Biology (Homeostatic Feedback, Signal Transduction, Epigenetics, etc.), Chemistry (Chemical Equilibrium, Stereochemistry, etc.), Microbiology (Virulence Factors, Horizontal Gene Transfer, etc.)

## Result

Next time a user plays any topic, the app will call the `generate-transcript` edge function with the new Architect + Script Writer prompt, producing a fresh transcript.

