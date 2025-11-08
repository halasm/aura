# Testing Guide for AURA Extension

## Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right corner)
3. Click "Load unpacked"
4. Select the `aura-extension` folder
5. The extension should appear in your extensions list

## Testing Steps

### 1. Basic Functionality Test
- Navigate to any webpage (e.g., a news article or blog post)
- Click the AURA extension icon in the toolbar
- Click "Read this page"
- You should see:
  - An overlay appear on the page with "Reading…" status
  - The page content being read aloud
  - Pause/Resume/Stop buttons in the overlay

### 2. Overlay Controls Test
- While reading, click "Pause" - reading should pause
- Click "Resume" - reading should continue
- Click "Stop" - reading should stop

### 3. Keyboard Shortcut Test
- Press `Ctrl+Shift+R` (Windows/Linux) or `Command+Shift+R` (Mac)
- Reading should start automatically

### 4. Settings Test
- Click the extension icon
- Click "Settings" link
- Adjust speech rate, pitch, volume, or voice
- Click "Save Settings"
- Start reading again to verify settings are applied

### 5. AI Summary Test
- In Settings, paste a valid OpenAI-compatible API key and click "Save Settings"
- In the popup, ensure **AI summary** mode is selected
- Click "Read this page"
- Verify the overlay displays a "Summarizing…" status followed by the generated summary block
- Confirm the summary is spoken aloud before/without the full article

### 6. Different Page Types Test
- Test on pages with:
  - `<main>` element
  - `<article>` element
  - ARIA landmarks
  - Regular body content

## Troubleshooting

### If you see module loading errors:
The extension uses ES6 modules which may not work directly in Manifest V3 content scripts. If you see errors like "Cannot use import statement outside a module", we'll need to convert to dynamic imports.

### Check the Console:
1. Right-click the extension icon → "Inspect popup" (for popup errors)
2. Open DevTools on any webpage → Console tab (for content script errors)
3. Go to `chrome://extensions/` → Click "service worker" link under AURA (for background errors)

### Common Issues:
- **No sound**: Check system volume and browser permissions
- **Overlay not appearing**: Check console for CSS loading errors
- **Content not extracted**: Check if page has readable content (some pages may be mostly JavaScript-rendered)
- **Summary errors**: Ensure an API key is saved, the key has access to the requested model, and the device has network connectivity.

## Expected Behavior

✅ Extension loads without errors
✅ Icons display correctly
✅ Popup opens and shows controls
✅ Reading starts when triggered
✅ Overlay appears with correct status
✅ Summary block appears (when AI mode is enabled) and falls back gracefully when disabled
✅ Speech synthesis works
✅ Controls (pause/resume/stop) function correctly
✅ Settings page loads and saves preferences
✅ Keyboard shortcut works
