

# Fix Topic Descriptions Not Updating in Core Concepts Drawer

## Problem
Topic descriptions in the Core Concepts AI drawer are showing stale/old data because TanStack Query is caching the results for 5 minutes (`staleTime: 1000 * 60 * 5`), and there's no mechanism to invalidate the cache when data is updated in the database.

## Solution
Reduce the cache time and add automatic refetch behavior so users always see the most current data.

---

## Changes

### File: `src/hooks/useTopics.ts`

**Update the query configuration (around line 87)**

Current:
```typescript
staleTime: 1000 * 60 * 5, // 5 minutes
```

New:
```typescript
staleTime: 1000 * 30, // 30 seconds - shorter cache for fresher data
refetchOnWindowFocus: true, // Refetch when user returns to the tab
```

This applies to:
- The main `useTopics` hook (line ~87)
- The `useTopicById` hook (add after line ~144)

---

## Why This Works

| Setting | Purpose |
|---------|---------|
| `staleTime: 30s` | Data is considered fresh for 30 seconds, then refetched on next access |
| `refetchOnWindowFocus: true` | Automatically refetches when user switches back to the browser tab |

---

## Alternative: Force Refresh Button

If you'd prefer manual control, we could also add a refresh button to the Core Concepts drawer header that invalidates the topics query. Let me know if you'd like that approach instead.

---

## Technical Details

The changes reduce the cache duration from 5 minutes to 30 seconds and enable automatic refetching when the browser tab regains focus. This ensures users see updated descriptions within 30 seconds of any database changes, or immediately when they return to the app.

