

# Topic Request Feature for Core Concepts AI

## Overview

When a search in the Core Concepts AI bottom drawer returns no matching topics, users will see a new "Request this topic" button that allows them to submit their search query for potential new content generation.

## User Flow

```text
User searches "mitochondria DNA" 
       │
       ▼
No results found
       │
       ▼
┌─────────────────────────────────────────┐
│  🔍 No topics found                     │
│                                         │
│  Try a different search term or         │
│  browse by chapter                      │
│                                         │
│  ─────────── or ───────────             │
│                                         │
│  [ 💡 Request "mitochondria DNA" ]      │
│                                         │
│  We'll add it to our content queue      │
└─────────────────────────────────────────┘
       │
       ▼
User taps button
       │
       ▼
Toast confirms submission
Search clears, user continues browsing
```

## Database Design

### New Table: `topic_requests`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Nullable (anonymous requests allowed) |
| query | text | The search term submitted |
| subject_id | uuid | Optional - current subject context |
| status | text | 'pending', 'approved', 'rejected', 'completed' |
| created_at | timestamp | Auto-set on creation |

### RLS Policies

- **INSERT**: Allow all users (authenticated or anonymous) to submit requests
- **SELECT**: Users can only view their own requests (for future "My Requests" feature)
- **UPDATE/DELETE**: Not allowed from client

## Technical Implementation

### 1. Database Migration

Create the `topic_requests` table with appropriate RLS policies for anonymous and authenticated submissions.

### 2. `src/components/topic-selection/SearchResultsSection.tsx`

Update the "no results" empty state to include the request button:

- Add new props: `searchQuery` (for display) and `onRequestTopic` callback
- Show the request button with the search query displayed
- Include a subtle divider with "or" text
- Style the button as a secondary/outline variant with a lightbulb icon

### 3. `src/components/TopicSelectionSheet.tsx`

- Add `onRequestTopic` handler that:
  - Submits the request to Supabase
  - Shows a success toast
  - Clears the search input
  - Provides haptic feedback
- Pass the handler and query to `SearchResultsSection`
- Track the current subject context if available

### 4. `src/hooks/useTopicRequest.ts` (new)

Create a custom hook using TanStack Query mutation:
- Handles the Supabase insert for topic requests
- Provides loading/success/error states
- Uses optimistic UI patterns

### 5. Toast Feedback

Success message: "Topic requested! We'll review 'mitochondria DNA' for future content."

## UI Design Details

### Empty State Enhancement

The current empty state shows:
- Search icon in a muted circle
- "No topics found" text
- "Try a different search term or browse by chapter" subtext

Enhanced version adds below:
- Horizontal divider with "or" text
- Button: `💡 Request "[query]"`  
- Muted helper text: "We'll add it to our content queue"

### Button Styling

- Variant: Ghost or outline
- Icon: Lightbulb (from lucide-react)
- Color: Primary accent for the query text
- Truncate long queries with ellipsis

### Loading State

While submitting, the button shows a subtle loading spinner and is disabled.

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Very long query | Truncate display to ~30 chars with ellipsis |
| Duplicate requests | Allow - deduplication is server-side concern |
| No auth | Still allow submission (user_id is nullable) |
| Network error | Show error toast, keep query for retry |
| Rapid submissions | Debounce/disable button after submission |

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/[timestamp].sql` | Create `topic_requests` table |
| `src/hooks/useTopicRequest.ts` | New hook for request submission |
| `src/components/topic-selection/SearchResultsSection.tsx` | Add request button to empty state |
| `src/components/TopicSelectionSheet.tsx` | Wire up request handler |

## Future Considerations (Not in Scope)

- "My Requests" section showing submitted topics and their status
- Admin dashboard to review and action requests
- Auto-generate content when request is approved
- Upvote system for popular requests

