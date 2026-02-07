
# Standardize Spacing Above Related Videos and Practice Section

## Current State

The "Related Videos and Practice" section container has `pt-4` (16px top padding), which is inconsistent with the recently standardized 12px (`pt-3`) pattern used in CoreConceptsHub sections (Saved Cards, Trending Topics).

**Current code (line 315)**:
```tsx
<div className="pt-4 pb-3">
```

## Issue

- CoreConceptsHub sections: `pt-3` (12px) - Saved Cards, Trending Topics
- Related Videos and Practice: `pt-4` (16px) - inconsistent spacing
- This creates visual inconsistency on the home screen

## Solution

Change the container padding from `pt-4` to `pt-3` to match the established 12px spacing pattern throughout the application.

**Updated code (line 315)**:
```tsx
<div className="pt-3 pb-3">
```

## Impact

- Unified spacing: all major sections on home screen will use `pt-3` (12px) for top separation
- Maintains consistent visual rhythm across the interface
- Single-line change with no side effects

