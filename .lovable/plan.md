
## Update Playback Settings Size

### Overview
The playback speed button and voice selector controls appear too large in the audio player interface. This plan reduces their size to create a more subtle, balanced appearance that doesn't compete visually with the main playback controls.

### Changes

**1. DailyDownloadPlayer.tsx - Reduce speed button size**
- Reduce padding from `px-2.5 py-1.5` to `px-2 py-1`
- Reduce font size from `text-xs` to `text-[10px]`
- Make the divider slightly shorter (from `h-4` to `h-3`)

**2. VoiceSelector.tsx - Reduce trigger button size**
- Reduce padding from `px-2.5 py-1.5` to `px-2 py-1`
- Reduce icon size from `w-3.5 h-3.5` to `w-3 h-3`
- Reduce text size from `text-xs` to `text-[10px]`

### Result
Both controls will be more compact and subtle, creating better visual hierarchy with the main play/skip buttons being the focal point.
