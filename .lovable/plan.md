
## Fix First Topic Always in Hover State

### Problem
The first topic in the Core Concepts AI drawer is always displayed in a "hover" (selected) state. This happens because the `cmdk` library (which powers the Command component) automatically selects the first item by default when no controlled `value` is provided.

### Root Cause
In `src/components/TopicSelectionSheet.tsx`, the `Command` component is rendered without a controlled `value` prop:

```tsx
<Command 
  className="flex-1 min-h-0 border-t border-border"
  shouldFilter={false}
>
```

Without explicit control, cmdk auto-selects the first `CommandItem`, applying the `data-[selected='true']` attribute which triggers the hover-like styling.

### Solution
Control the Command component's selection state by:
1. Adding a `value` state initialized to an empty string (no selection)
2. Passing `value` and `onValueChange` props to the Command component

This approach:
- Prevents automatic first-item selection on mount
- Allows user interaction (keyboard/mouse) to still work naturally
- Follows the documented cmdk API pattern

### Technical Implementation

**File: `src/components/TopicSelectionSheet.tsx`**

1. Add new state for controlling selection (around line 73):
```tsx
const [selectedValue, setSelectedValue] = useState('');
```

2. Update Command component props (around line 285):
```tsx
<Command 
  className="flex-1 min-h-0 border-t border-border"
  shouldFilter={false}
  value={selectedValue}
  onValueChange={setSelectedValue}
>
```

3. Reset the selection when the sheet closes (update existing useEffect around line 231):
```tsx
useEffect(() => {
  if (!isOpen) {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedValue(''); // Reset selection when sheet closes
  }
}, [isOpen]);
```

### Visual Result

| Before | After |
|--------|-------|
| First topic always highlighted with blue tint | No topic highlighted until user hovers or uses keyboard |
| Appears "stuck" in hover state | Clean, neutral appearance on open |

### Files to Change
| File | Change |
|------|--------|
| `src/components/TopicSelectionSheet.tsx` | Add controlled selection state to Command component |
