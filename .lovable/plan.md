

# Fix Trending Topics Not Counting Plays

## Root Causes

Two issues prevent Chemical Equilibrium from appearing as trending:

### 1. Only one row per user per topic
`useListenedTopics` uses `upsert` with `onConflict: 'user_id,topic_id'`, so playing a topic twice overwrites the same row. The trending hook counts rows, so listen_count = 1 regardless of how many times you play it.

### 2. RLS blocks cross-user aggregation
The `user_progress` SELECT policy is `auth.uid() = user_id`, so the trending query can only see the *current* user's rows. For unauthenticated users, it returns zero rows.

## Solution

### A. Track each play as a separate row

**Database migration**: Create a new `topic_listens` table that records every play:

```sql
CREATE TABLE public.topic_listens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL,
  user_id uuid,
  listened_at timestamptz DEFAULT now()
);

ALTER TABLE public.topic_listens ENABLE ROW LEVEL SECURITY;

-- Anyone can read aggregated listen data (no PII exposed)
CREATE POLICY "Anyone can view topic listens"
  ON public.topic_listens FOR SELECT
  TO public USING (true);

-- Authenticated users can insert their own listens
CREATE POLICY "Users can insert own listens"
  ON public.topic_listens FOR INSERT
  TO public WITH CHECK (auth.uid() = user_id);

-- Anonymous users can also insert (user_id = NULL)
CREATE POLICY "Anonymous can insert listens"
  ON public.topic_listens FOR INSERT
  TO public WITH CHECK (user_id IS NULL);
```

### B. Record a listen on every play

**File**: `src/hooks/useListenedTopics.ts`

Add a new function `recordListen` that inserts into `topic_listens` every time a topic is played (not upserted). The existing `markAsListened` / `user_progress` logic stays unchanged for tracking completion status.

### C. Update trending hook to use `topic_listens`

**File**: `src/hooks/useTrendingTopics.ts`

Replace the `user_progress` query with a query against `topic_listens`, counting all rows per `topic_id`. Since the SELECT policy is public, this works for all users.

```typescript
const { data: listenData } = await supabase
  .from('topic_listens')
  .select('topic_id');

// Count per topic
listenData?.forEach(row => {
  const count = listenCounts.get(row.topic_id) || 0;
  listenCounts.set(row.topic_id, count + 1);
});
```

### D. Call `recordListen` from the audio player

**File**: `src/components/DailyDownloadPlayer.tsx` (or wherever play completion triggers `markAsListened`)

Add a call to the new `recordListen` function alongside the existing `markAsListened` call.

## Impact

- Each play increments the count (no more upsert overwrite)
- Trending data is visible to all users (public SELECT policy)
- No PII exposed -- `topic_listens` only stores topic_id, optional user_id, and timestamp
- Existing `user_progress` table and completion tracking remain unchanged

