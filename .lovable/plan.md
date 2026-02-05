
## Fix Flash Card Visual Content Generation

### Problem
The AI-generated flash card visual content is too long and verbose. In the screenshot, the "Homeostatic Feedback" card shows 178 characters of text displayed at `text-3xl` (30px), making it look cluttered and hard to read.

**Current AI Output:**
```
The Feedback Loop Team: The Sensor (Scout 🕵️) detects a change, the Control 
Center (Boss 🧠) compares it to the Set Point, and the Effector (Worker 🛠️) 
carries out the correction.
```

**Expected Output (based on working mock data examples):**
```
🕵️ Sensor → 🧠 Control Center → 🛠️ Effector
```

### Root Cause
The edge function prompt specifies "max 200 chars" but the mock data examples that look good are only 20-50 characters. The current prompt lacks:
1. Clear examples showing the expected format
2. Strict character limit enforcement
3. Emphasis on mnemonics/diagrams over full sentences

### Solution
Update the `generate-flashcard` edge function to:
1. Reduce the character limit from 200 to 60 characters
2. Add concrete examples showing the expected concise format
3. Emphasize that visual_content should be a mnemonic/headline, NOT a sentence
4. Add post-generation validation to truncate overly long content

### Technical Changes

**File: `supabase/functions/generate-flashcard/index.ts`**

1. Update the system prompt (lines 43-47) to include examples:
```typescript
Output your response as a JSON object with these exact fields:
- visual_type: one of "diagram", "formula", or "analogy"
- visual_content: a SHORT mnemonic, formula, or visual representation (MAX 60 characters). Examples:
  * "🔬 Bacteria → Viruses → Fungi → Protozoa"
  * "📈 Lag → Log → Stationary → Death"
  * "⚛️ Nucleus (p⁺ + n⁰) | Shell (e⁻)"
  * "E = mc²"
  NOT a sentence - think headline/mnemonic!
- bullet_points: an array of exactly 3 concise bullet points summarizing key concepts
- difficulty: one of "easy", "medium", or "hard"
```

2. Update the user prompt (lines 120-126) with stricter instructions:
```typescript
IMPORTANT: Return ONLY a valid JSON object with these exact fields:
- "visual_type": one of "diagram", "formula", or "analogy"
- "visual_content": MAX 60 CHARACTERS - a mnemonic or visual like "🧬 DNA → RNA → Protein" (NOT a full sentence!)
- "bullet_points": array of exactly 3 short strings
- "difficulty": one of "easy", "medium", or "hard"
```

3. Add post-generation validation to truncate long visual_content (after line 192):
```typescript
// Truncate visual_content if too long
if (parsed.visual_content.length > 80) {
  console.warn(`[Flashcard] visual_content too long (${parsed.visual_content.length} chars), truncating`);
  // Try to find a natural break point
  const truncated = parsed.visual_content.slice(0, 60);
  const lastSpace = truncated.lastIndexOf(' ');
  parsed.visual_content = lastSpace > 30 ? truncated.slice(0, lastSpace) + '...' : truncated + '...';
}
```

### Expected Result

| Before | After |
|--------|-------|
| 178-char full sentence displayed at 30px | 30-60 char mnemonic headline |
| Cluttered, hard to read | Clean, scannable visual |
| Looks like paragraph text | Looks like a formula/diagram |

### Files to Change
| File | Change |
|------|--------|
| `supabase/functions/generate-flashcard/index.ts` | Update prompts with examples and add length validation |

### Notes
- Existing cached flashcards will still show the old format until regenerated
- New flashcards will use the improved concise format
- The fallback (line 210) already uses a short format: `📚 Key concepts`
