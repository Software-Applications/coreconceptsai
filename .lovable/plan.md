

# Show Request Topic Button for Related-Only Results

## Summary

Update the search results UI to show the "Request Topic" button when there are no direct hits, even if related topics are found.

## Current Behavior

| Search Result | Request Button |
|---------------|----------------|
| Direct hits found | Hidden |
| Related only (no direct hits) | **Hidden** ← Problem |
| No results at all | Shown |

## Desired Behavior

| Search Result | Request Button |
|---------------|----------------|
| Direct hits found | Hidden |
| Related only (no direct hits) | **Shown** ← Fix |
| No results at all | Shown |

## File to Modify

`src/components/topic-selection/SearchResultsSection.tsx`

## Change Required

Add a "Request Topic" section at the bottom of the search results when `hasRelated && !hasDirectHits`:

```text
Current flow:
  if (!hasAnyResults) → Show "No topics found" + Request button
  if (hasResults) → Show results only

New flow:
  if (!hasAnyResults) → Show "No topics found" + Request button
  if (hasRelated && !hasDirectHits) → Show related results + Request button at bottom
  if (hasDirectHits) → Show results only (no request button)
```

## Implementation

Add a conditional section after the related topics display that shows the request button when there are only related matches.

