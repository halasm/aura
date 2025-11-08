# AURA – Assistive Universal Reading Assistant

AURA is a Chrome extension that helps users with visual, motor, or social impairments understand web pages through accessible, natural controls.

Current focus (MVP):  
“Read / describe this page” — extract the main content of a page and read it aloud using text-to-speech, with a simple on-page overlay for feedback and controls.

---

## Features (MVP)

### Implemented / In Scope for this version

- **Read this page**  
  - Extracts the primary content from the current tab (prefers `<main>`, `<article>`, and ARIA landmarks).
  - Reads it aloud using the Web Speech API (`speechSynthesis`).

- **On-page overlay**  
  - Small, accessible floating panel injected into the page.
  - Shows status: “Reading…”, “Paused”, “Done”.
  - Provides Pause / Resume / Stop controls.

- **Accessibility-aware UI**  
  - ARIA roles on overlay and controls.
  - Keyboard accessible buttons and focus states.
  - Uses `aria-live` for status updates where appropriate.

- **User preferences (basic)**  
  - Stores speech settings (e.g., rate, pitch, voice) using `chrome.storage.local` (if enabled).

### Planned (not in this MVP, but in design)

- Voice commands (e.g., “Scroll down”, “Open YouTube”) using `SpeechRecognition`.
- “Social assist mode” to quickly insert common social phrases.
- AI-powered summaries and simplified explanations of complex pages.

---

## Tech Stack

- **Browser**: Chrome (Manifest V3)
- **Frontend**: HTML, CSS, vanilla JavaScript
- **Extension APIs**:
  - `chrome.action`, `chrome.scripting`, `chrome.storage`, `chrome.commands`
- **Voice**: Web Speech API  
  - `speechSynthesis` (MVP)  
  - `SpeechRecognition` (future)
- **Storage**: `chrome.storage.local`
- **Accessibility**: ARIA roles, keyboard navigation, `aria-live` regions

---

## Project Structure

This is the intended structure for the extension source.

```text
aura-extension/
├─ manifest.json
├─ icons/
│  ├─ icon16.png
│  ├─ icon48.png
│  └─ icon128.png
├─ docs/
│  └─ DESIGN.md
├─ src/
│  ├─ background/
│  │  └─ serviceWorker.js
│  ├─ popup/
│  │  ├─ popup.html
│  │  ├─ popup.js
│  │  └─ popup.css
│  ├─ options/              # optional settings page
│  │  ├─ options.html
│  │  ├─ options.js
│  │  └─ options.css
│  ├─ content/
│  │  ├─ contentScript.js   # main bridge between page & extension
│  │  ├─ domAnalyzer.js     # extracts main readable content
│  │  ├─ pageReader.js      # wraps speechSynthesis controls
│  │  ├─ overlay.js         # creates & manages on-page overlay UI
│  │  └─ overlay.css
│  ├─ speech/
│  │  └─ speechConfig.js    # reads/writes TTS settings
│  └─ common/
│     ├─ messaging.js       # helper for runtime/tabs messaging
│     ├─ storage.js         # wrapper around chrome.storage.local
│     └─ constants.js       # message types, command names, etc.
└─ README.md
