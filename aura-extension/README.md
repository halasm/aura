# AURA Extension

This is the Chrome extension implementation for AURA (Assistive Universal Reading Assistant).

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `aura-extension` folder

## Icon Files

The extension requires icon files in the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Currently, placeholder files are present. Replace them with actual icon images before publishing.

## Usage

1. Click the AURA extension icon in the Chrome toolbar
2. Click "Read this page" to start reading
3. Choose **AI summary** or **Full article** in the popup before starting
4. Use the on-page overlay controls to pause, resume, or stop reading
5. Access settings via the "Settings" link in the popup

## Keyboard Shortcut

- `Ctrl+Shift+R` (Windows/Linux) or `Command+Shift+R` (Mac) to start reading

## Features

- Extracts main content from web pages
- Reads content aloud using Web Speech API
- AI-generated summaries (requires API key) or full-article playback
- On-page overlay with accessible controls
- Customizable speech settings (rate, pitch, volume, voice)
- Full keyboard navigation support
- ARIA-compliant accessibility features

## AI Summary Mode

- Open the **Settings** page and provide an OpenAI-compatible API key (stored locally in `chrome.storage.local`).
- Optionally change the base URL/model to point at Azure OpenAI or other compatible services.
- When "AI summary" mode is selected in the popup, the content script sends the extracted DOM text to the service worker, which calls the configured API and displays the returned summary inside the overlay before reading it aloud.
- Without a key, the extension automatically falls back to reading the full article.
