
## Update Transcript System Prompt - Pause Timings

### Changes to Make

**File**: `supabase/functions/generate-transcript/index.ts`

**Change 1: Reduce paragraph pause duration**
- **Line 46** - Update from:
  ```
  - Paragraphs must end with the [PAUSE: 3 Seconds] marker.
  ```
  to:
  ```
  - Paragraphs must end with the [PAUSE: 2 Seconds] marker.
  ```

**Change 2: Add pause after reflective questions**
- **Section 2. ACTIVE PROMPTING** (lines 55-58) - Add instruction:
  ```
  - After each reflective question, always include [PAUSE: 3 Seconds] to give the user time to think and respond mentally before proceeding to the answer.
  ```

### Summary
These two changes will:
1. Shorten the breathing room at paragraph ends from 3 seconds → 2 seconds (paces the content faster)
2. Ensure a mandatory 3-second pause after every reflective question so students have time to think before the answer is revealed

### Impact
- Existing cached transcripts without the 3-second question pause will be regenerated on next access
- New transcripts will have the faster pacing and explicit question pauses
