

# Add Clear Button to Search Input in Core Concepts Drawer

## Change

**File**: `src/components/ui/command.tsx` — Update `CommandInput` to accept an optional `onClear` callback and show an X button when there's text.

Add an `X` (circle) icon button after the input that appears when the value is non-empty. Tapping it calls `onClear`.

### CommandInput update (lines 38-53)

```tsx
import { Search, XCircle } from "lucide-react";

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & { onClear?: () => void }
>(({ className, onClear, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
    {props.value && String(props.value).length > 0 && onClear && (
      <button type="button" onClick={onClear} className="ml-1 p-1 shrink-0">
        <XCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
      </button>
    )}
  </div>
));
```

### TopicSelectionSheet update (line 331-337)

Add `onClear` prop to the `CommandInput`:

```tsx
<CommandInput
  ref={inputRef}
  placeholder="Search topics..."
  value={searchQuery}
  onValueChange={setSearchQuery}
  onClear={() => setSearchQuery('')}
  className={...}
/>
```

## Result

When the search field has text, an X icon appears on the right side. One tap clears the entire search term.

