
# Validate Topic Requests Before Submission

## Problem
Currently, any search query (2+ characters) can be submitted as a topic request. This could lead to:
- Unclear/gibberish requests ("asdf", "???", "123")
- Off-topic requests (e.g., "pizza recipes" in a Biology context)
- Spam submissions that clutter the content queue

## Solution
Add client-side validation before allowing topic request submission. If the query is unclear or unrelated to the subject, show a toast asking the user to provide a cleaner, subject-relevant topic.

---

## Validation Rules

### 1. Clarity Checks
- Minimum 3 meaningful characters (letters)
- At least one word with 3+ letters
- Not purely numbers or special characters
- Not common gibberish patterns ("asdf", "qwerty", "test", etc.)

### 2. Subject Relevance Checks
Create a lightweight keyword map for each subject to verify the query has some relevance:

| Subject | Relevant Keywords (sample) |
|---------|---------------------------|
| Biology | cell, gene, DNA, protein, evolution, organism, tissue, etc. |
| Chemistry | atom, molecule, reaction, bond, acid, electron, compound, etc. |
| Microbiology | bacteria, virus, pathogen, culture, antibiotic, infection, etc. |

If the query contains no subject-related keywords AND is not a recognized scientific term, show a validation message.

---

## Implementation

### File: `src/lib/topicValidation.ts` (new)
Create a validation utility with:
- `isQueryClear(query: string): boolean` - checks for gibberish/unclear text
- `isQueryRelevant(query: string, subjectName: string): boolean` - checks subject relevance
- `validateTopicRequest(query: string, subjectName?: string): { valid: boolean; message?: string }` - combined validation

### File: `src/components/TopicSelectionSheet.tsx`
Update `handleRequestTopic`:
- Import the validation utility
- Before submitting, call `validateTopicRequest(query, subjectName)`
- If invalid, show a toast with the validation message instead of submitting
- Keep the CTA button visible but the submission blocked with feedback

---

## User Experience Flow

```text
User types query -> Clicks "Request" button
           |
           v
     Run validation
           |
     +-----+------+
     |            |
   Valid        Invalid
     |            |
     v            v
  Submit      Show toast:
  request     "Please enter a clear topic
              related to [Subject]"
```

---

## Validation Examples

| Query | Subject | Result | Message |
|-------|---------|--------|---------|
| "asdfgh" | Biology | Invalid | "Please enter a clear topic name" |
| "123" | Chemistry | Invalid | "Please enter a clear topic name" |
| "pizza recipes" | Biology | Invalid | "Please enter a topic related to Biology" |
| "mitochondria" | Biology | Valid | - |
| "electron orbitals" | Chemistry | Valid | - |
| "bacterial growth" | Microbiology | Valid | - |
| "cell membrane" | Chemistry | Valid | - (science term, acceptable cross-subject) |

---

## Technical Changes Summary

| File | Change |
|------|--------|
| `src/lib/topicValidation.ts` | New file with validation logic |
| `src/components/TopicSelectionSheet.tsx` | Import validation, add check before `topicRequest.mutate()`, show toast on invalid |

---

## Edge Cases Handled

- Short but valid terms like "ATP" or "DNA" will pass (recognized abbreviations)
- Cross-subject scientific terms are allowed (e.g., "cell" is valid for any science subject)
- Unknown but clear multi-word queries get a softer validation (benefit of the doubt)
- Empty subject context falls back to general science relevance check
