

# Update stripTags to Remove New Placeholders

## Change

**File**: `src/components/DailyDownloadPlayer.tsx`, line 125

Update the regex from:
```
/\[(?:PAUSE|PROMPT|NOTE|DIRECTION)[^\]]*\]/gi
```
To:
```
/\[(?:PAUSE|PROMPT|NOTE|DIRECTION|SIGNPOST|RETRIEVAL|PREDICT|TEACH)[^\]]*\]/gi
```

This adds `SIGNPOST`, `RETRIEVAL`, `PREDICT`, and `TEACH` to the existing bracket-tag removal pattern. Single line change, no other files affected.

