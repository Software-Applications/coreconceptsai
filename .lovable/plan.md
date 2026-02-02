

# Fix Transcript Paragraph Separation

## Problem Analysis

The transcript section appears as a wall of text without visible paragraph breaks. After investigation, I found:

1. **Paragraph splitting relies on double newlines**: The code at line 95 splits on `\n\n+`:
   ```js
   return fullTranscriptText.split(/\n\n+/).filter(p => p.trim());
   ```

2. **If no double newlines exist**, all text becomes a single paragraph, making `space-y-6` useless (nothing to space between)

3. **The AI prompt asks for paragraph breaks** (lines 44-48), but AI responses may not always comply, or the breaks may get stripped during processing

## Solution

### 1. Add Fallback Paragraph Detection

Create a smarter paragraph parsing function that:
- First tries splitting on double newlines (`\n\n`)
- If that results in only 1 paragraph and the text is long, fall back to splitting on:
  - Single newlines (`\n`)
  - Sentence boundaries (after `.` followed by capital letter) for very long blocks
  - Or chunk by word count (~100 words per paragraph)

### 2. Add Visual Paragraph Indicators

Even with proper spacing, add visual cues for paragraph breaks:
- **Increase spacing** to `space-y-8` (32px) for more obvious separation
- **Add a subtle top border/line** to paragraphs (except the first) as a visual separator
- **Or use text-indent** on paragraphs to indicate new paragraph starts

## Implementation

| File | Change |
|------|--------|
| `src/components/DailyDownloadPlayer.tsx` | Improve paragraph parsing logic with fallback splitting, add visual paragraph separators |

### Code Changes

**Improved paragraph parsing (around line 93):**
```jsx
const paragraphs = useMemo(() => {
  if (!fullTranscriptText) return [];
  
  // Try splitting on double newlines first
  let parts = fullTranscriptText.split(/\n\n+/).filter(p => p.trim());
  
  // Fallback: if only 1 paragraph and text is long, try single newlines
  if (parts.length === 1 && fullTranscriptText.length > 500) {
    parts = fullTranscriptText.split(/\n/).filter(p => p.trim());
  }
  
  // Final fallback: split long text into chunks by sentences
  if (parts.length === 1 && fullTranscriptText.length > 500) {
    const sentences = fullTranscriptText.match(/[^.!?]+[.!?]+\s*/g) || [fullTranscriptText];
    parts = [];
    let currentParagraph = '';
    
    for (const sentence of sentences) {
      if ((currentParagraph + sentence).length > 400) {
        if (currentParagraph.trim()) parts.push(currentParagraph.trim());
        currentParagraph = sentence;
      } else {
        currentParagraph += sentence;
      }
    }
    if (currentParagraph.trim()) parts.push(currentParagraph.trim());
  }
  
  return parts;
}, [fullTranscriptText]);
```

**Add visual separator between paragraphs (around line 703-736):**
```jsx
<div className="space-y-6">
  {paragraphs.map((paragraph, index) => {
    const isActive = index === activeSegmentIndex;
    const words = paragraph.split(/\s+/);
    
    return (
      <div key={index}>
        {/* Subtle separator line between paragraphs */}
        {index > 0 && (
          <div className="h-px bg-border/50 mb-6" />
        )}
        <p
          ref={isActive ? activeSegmentRef : null}
          className={`text-sm leading-relaxed transition-all duration-300 ${
            isActive 
              ? 'text-foreground' 
              : hasStarted && index < activeSegmentIndex
                ? 'text-muted-foreground/60'
                : 'text-muted-foreground'
          }`}
        >
          {/* ... word highlighting logic ... */}
        </p>
      </div>
    );
  })}
</div>
```

## Visual Result

**Before:**
```
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi. Duis aute irure dolor in reprehenderit...
```

**After:**
```
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore.
────────────────────────────────────────
Ut enim ad minim veniam, quis nostrud exercitation 
ullamco laboris nisi ut aliquip ex ea commodo.
────────────────────────────────────────
Duis aute irure dolor in reprehenderit in voluptate 
velit esse cillum dolore eu fugiat nulla pariatur.
```

