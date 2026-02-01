

## Remove Background from List Icon

### Current State
The List icon in the chapter selector trigger has a circular muted background:
```tsx
<div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
  <List className="w-4 h-4 text-muted-foreground" />
</div>
```

### Change
Remove the wrapper div and show just the List icon directly:
```tsx
<List className="w-4 h-4 text-muted-foreground" />
```

### File to Update
- `src/components/ChapterDrawer.tsx` - Line 138-140

