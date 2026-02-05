
## Fix Request CTA Logic and Styling

### Problem Analysis

**Issue 1: Request CTA Missing for Direct Hits**

The current logic in `TopicSelectionSheet.tsx` only shows the "Request Topic" CTA when there are **no search results at all**. When there ARE direct hits, the CTA is completely absent.

```text
Current Logic:
┌─────────────────────────────────────────┐
│ Search query >= 2 chars                 │
├─────────────────────────────────────────┤
│ Has Results?                            │
│   YES → Show Direct Hits + Related      │
│         (NO Request CTA)         ← BUG  │
│   NO  → Show Request CTA                │
└─────────────────────────────────────────┘

Expected Logic:
┌─────────────────────────────────────────┐
│ Search query >= 2 chars                 │
├─────────────────────────────────────────┤
│ Has Results?                            │
│   YES → Show Direct Hits + Related      │
│         + Request CTA at bottom   ← FIX │
│   NO  → Show Request CTA                │
└─────────────────────────────────────────┘
```

**Issue 2: Blue CTA Styling Too Heavy**

The current button uses `bg-primary` (solid blue), which is inconsistent with the project's color patterns. Per the color standardization memory, hover states use subtle `primary/5` tints. The `SearchResultsSection.tsx` component (unused in this flow) correctly uses `variant="outline"` with subtle styling.

| Current | Expected |
|---------|----------|
| `bg-primary text-primary-foreground` (solid blue) | `variant="ghost"` or `variant="outline"` (lighter) |
| Full-width heavy button | Compact, centered, subtle button |

---

### Solution

#### Part 1: Add Request CTA After Search Results

**File: `src/components/TopicSelectionSheet.tsx`**

After the search results (line 483, after the Related Topics CommandGroup closes), add the Request CTA section:

```tsx
{/* Request Topic CTA - always show at bottom of search results */}
{searchQuery.trim().length >= 2 && (
  <div className="px-4 py-4 border-t border-border mt-2">
    <div className="flex items-center justify-center gap-2 text-sm">
      <span className="text-muted-foreground">Can't find what you need?</span>
      <button
        onClick={() => handleRequestTopic(searchQuery)}
        disabled={topicRequest.isPending}
        className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline disabled:opacity-50"
      >
        {topicRequest.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Lightbulb className="w-3.5 h-3.5" />
        )}
        Request topic
      </button>
    </div>
  </div>
)}
```

#### Part 2: Update No-Results CTA Styling

**File: `src/components/TopicSelectionSheet.tsx`**

Change the button in `CommandEmpty` (lines 498-514) from solid blue to a subtle ghost/outline style:

```tsx
// Before (line 501):
className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 ..."

// After:
className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-xl transition-colors disabled:opacity-50"
```

---

### Files to Change

| File | Change |
|------|--------|
| `src/components/TopicSelectionSheet.tsx` | Add Request CTA after search results; update no-results button styling |

### Expected Result

| Scenario | Before | After |
|----------|--------|-------|
| Direct hits found | No Request CTA | Request CTA at bottom of results |
| Related topics only | No Request CTA | Request CTA at bottom of results |
| No results | Solid blue "Request" button | Subtle tinted button |
| Button styling | Heavy `bg-primary` | Light `bg-primary/10` with text-primary |

### Visual Comparison

```text
Before (no results):
┌────────────────────────────────────┐
│  💡 No topics match "xyz"          │
│  Request this topic and we'll...   │
│  ┌────────────────────────────┐    │
│  │ 💡 Request "xyz"           │ ← Heavy solid blue
│  └────────────────────────────┘    │
└────────────────────────────────────┘

After (no results):
┌────────────────────────────────────┐
│  💡 No topics match "xyz"          │
│  Request this topic and we'll...   │
│     ┌──────────────────┐           │
│     │ 💡 Request "xyz" │ ← Subtle primary/10 tint
│     └──────────────────┘           │
└────────────────────────────────────┘

After (with results):
┌────────────────────────────────────┐
│  Direct Matches (3)                │
│  ├─ Topic A                        │
│  ├─ Topic B                        │
│  └─ Topic C                        │
│ ─────────────────────────────────  │
│  Can't find it? Request topic  💡  │ ← NEW subtle inline CTA
└────────────────────────────────────┘
```
