# AURA – Assistive Universal Reading Assistant

AURA is a Chrome extension that helps users with visual, motor, or social impairments understand and navigate web pages through natural voice controls, AI summaries, and accessible UI.

---

## Current Capabilities

- **Two reading modes**
  - **AI Summary** – extracts the page, sends it to your configured AI endpoint, and reads back a short empathetic description.
  - **Full Article** – reads the entire article using the browser’s `speechSynthesis` voices.

- **Glassmorphic UI**
  - Refreshed popup and settings panels with consistent gradients matching the AURA branding.
  - On-page overlay with Pause / Resume / Stop buttons, live status, summary panel, and keyboard focus rings.

- **Voice-first controls (SpeechRecognition)**
  - Start reading or summarizing (“read this page”, “describe this page”).
  - Media control: “pause”, “resume”, “stop”.
  - Page navigation: “scroll up/down/left/right”, “go left/right”, “scroll to top/bottom”.
  - Zoom adjustments: “zoom in 20%”, “reset zoom”.
  - Open sites: “open Gmail”, “go to developer docs”, etc. Unknown sites attempt an AI URL lookup before falling back to Google search.

- **Personalization & storage**
  - Options page stores speech rate, pitch, volume, preferred voice, and AI settings (`chrome.storage.local`).
  - Gradient text + feature cards ready for marketing or in-product highlights.

- **Server-assisted AI**
  - `server/` exposes a lightweight Express proxy (optional) for local testing or secure API-key handling.

---

## Voice Command Reference

| Category | Example phrases |
| --- | --- |
| Reading modes | “Read this page”, “Describe this page”, “Summarize this page” |
| Playback | “Pause”, “Resume”, “Stop reading” |
| Scrolling | “Scroll down 30%”, “Go left”, “Scroll to the top” |
| Zoom | “Zoom in 15%”, “Make it smaller”, “Reset zoom” |
| Navigation | “Open YouTube”, “Go to aura website”, “Visit documentation” |

> Voice listening currently runs inside the extension popup. Keep the popup open while issuing commands, or pop it out into its own window.

---

## Installation

1. **Install dependencies (optional server)**
   ```bash
   cd server
   npm install
   ```
   Run `npm start` if you want the local proxy for AI requests.

2. **Load the extension**
   - Open `chrome://extensions`
   - Toggle **Developer mode**
   - Click **Load unpacked** and select `aura-extension/`

3. **Configure AI (optional but recommended)**
   - Click the gear icon in the popup or open `chrome-extension://<id>/src/options/options.html`
   - Enter your API key, base URL, and model (OpenAI-compatible)
   - Set speech preferences (rate, pitch, voice, volume)

4. **Use the popup**
   - Choose *AI summary* or *Full article*
   - Tap **Read this page**
   - Optionally enable voice commands and speak controls hands-free

---

## Tech Stack

- **Browser**: Chrome / Manifest V3
- **Languages**: HTML, CSS, vanilla JavaScript
- **Extension APIs**: `chrome.action`, `chrome.tabs`, `chrome.runtime`, `chrome.storage`, `chrome.scripting`
- **Voice**: Web Speech API (`speechSynthesis`, `SpeechRecognition`)
- **Server (optional)**: Node.js + Express proxy
- **Accessibility**: ARIA roles, `aria-live` regions, keyboard focus outlines, high-contrast/dark-mode support

---

## Project Structure (abridged)

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

server/
├─ index.js                 # optional Express proxy for AI calls
├─ package.json
└─ package-lock.json

```

---

## Roadmap Ideas

- Keep voice listening alive outside the popup (service worker / content script hook).
- Add “social assist” canned responses for community platforms.
- Inline translations and tone adjustments.
- Exportable listening transcripts for note-taking.

Contributions are welcome! Fork the repo, make changes, and open a pull request. If you encounter issues or ideas, file them via GitHub issues. Let's keep making the web more inclusive. 🎧✨
