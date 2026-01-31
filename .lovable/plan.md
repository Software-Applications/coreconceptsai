
# Generate Realistic Textbook Covers with Authors

## Overview

Generate professional-looking textbook cover images for each subject and add author names displayed below the textbook title.

## Current State

| Subject | Current Textbook Title | Current Cover |
|---------|----------------------|---------------|
| Microbiology | Microbiology with Diseases by Body System, 5th edition | Unsplash stock photo |
| Chemistry | Chemistry: The Central Science, 15th edition | Unsplash stock photo |
| Biology | Campbell Biology, 12th edition | Unsplash stock photo |

## Changes Required

### 1. Database Schema Update

Add a new column to store author names:

```sql
ALTER TABLE subjects ADD COLUMN textbook_author text;
```

### 2. Generate Realistic Textbook Covers

Use the Nano banana image generation API (`google/gemini-2.5-flash-image`) to create professional textbook-style covers for each subject:

| Subject | Cover Prompt | Author |
|---------|-------------|--------|
| Microbiology | "Professional academic textbook cover design for 'Microbiology with Diseases by Body System, 5th edition'. Include microscopic bacteria imagery, medical/scientific aesthetic, publisher-style layout with title banner, dark blue and teal color scheme" | Robert W. Bauman |
| Chemistry | "Professional academic textbook cover design for 'Chemistry: The Central Science, 15th edition'. Include molecular structures and atomic imagery, scientific aesthetic, publisher-style layout, deep blue and gold color scheme" | Theodore L. Brown et al. |
| Biology | "Professional academic textbook cover design for 'Campbell Biology, 12th edition'. Include DNA helix and cell imagery, nature-inspired scientific aesthetic, green and blue color scheme, publisher-style layout" | Lisa A. Urry et al. |

### 3. Upload Generated Images

Store the generated cover images in Supabase Storage and update the `textbook_image_url` for each subject.

### 4. Update TypeScript Types

Regenerate Supabase types to include the new `textbook_author` column.

### 5. Update UI Components

Modify `src/pages/Index.tsx` to display the author name below the textbook title in the textbook card.

---

## Files to Create/Modify

| File | Change |
|------|--------|
| Database migration | Add `textbook_author` column |
| `src/integrations/supabase/types.ts` | Regenerated with new column |
| `src/hooks/useSubjects.ts` | Include `textbook_author` in the return type |
| `src/pages/Index.tsx` | Display author name below textbook title |
| Database records | Update with AI-generated cover URLs and author names |

---

## Technical Details

### Image Generation Flow

1. Create an edge function `generate-textbook-cover` to handle image generation
2. The function will:
   - Call the Nano banana API with the cover prompt
   - Upload the base64 result to Supabase Storage
   - Return the public URL
3. Run the function for each subject and update the database

### UI Update (Index.tsx)

```tsx
<div>
  <p className="text-sm font-medium text-foreground leading-snug">
    {selectedSubject.textbook.title}
  </p>
  {selectedSubject.textbook.author && (
    <p className="text-xs text-muted-foreground mt-0.5">
      {selectedSubject.textbook.author}
    </p>
  )}
</div>
```

### Expected Result

Each textbook card will display:
- A professionally designed, realistic textbook cover image
- The textbook title (existing)
- The author name in a smaller, muted text below the title (new)
