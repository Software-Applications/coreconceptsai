

## Add iOS-Style Status Bar

### Overview
Add a realistic iOS-style status bar showing time, network signal, wifi, and battery indicators. This will enhance the native mobile app feel and complete the phone frame simulation.

### Current State
- The app has a `MobileFrame` component with a Dynamic Island bezel (visible on screens ≥500px)
- The header in `Index.tsx` uses `pt-4` and `mt-4` to clear the notch area
- On actual mobile devices, the bezel is hidden and native status bar is used

### Design Decision
The status bar should:
- Show on **desktop preview only** (≥500px) where the phone frame is visible
- Be hidden on actual mobile devices where the real OS status bar exists
- Display simulated but realistic-looking indicators
- Update time in real-time

### Implementation

**New Component: `src/components/StatusBar.tsx`**

Create a reusable status bar component with:

```
+------------------------------------------+
| 9:41          [Signal] [WiFi] [Battery]  |
+------------------------------------------+
```

- **Left**: Current time (updates every minute)
- **Right**: Signal bars, WiFi icon, battery percentage + icon
- Uses Lucide icons: `Signal`, `Wifi`, `Battery`/`BatteryMedium`/`BatteryFull`
- Fixed position at top of mobile frame content
- Only renders on larger screens via CSS media query

**Modify: `src/components/MobileFrame.tsx`**

- Import and render `StatusBar` at the top of the content area
- Position it below the Dynamic Island but above app content

**Modify: `src/index.css`**

- Add `.status-bar` styles for proper positioning
- Hide on mobile devices (≤499px) using media query

### Technical Details

| Element | Implementation |
|---------|----------------|
| Time | `useState` + `useEffect` with 1-minute interval, formatted as "9:41" |
| Signal | Static 4-bar icon (simulated full signal) |
| WiFi | Static wifi icon (simulated connected) |
| Battery | Static "100%" with full battery icon |

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/StatusBar.tsx` | Create | iOS-style status bar component |
| `src/components/MobileFrame.tsx` | Modify | Include StatusBar in frame |
| `src/index.css` | Modify | Add status bar positioning styles |

### Visual Spacing

The status bar will be positioned:
- Below the Dynamic Island (which is at `top: 12px`, height `36px`)
- Status bar starts at approximately `top: 52px`
- Height: ~20px for the status bar itself
- This leaves the existing `pt-14` header padding working correctly

