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
3. Use the on-page overlay controls to pause, resume, or stop reading
4. Access settings via the "Settings" link in the popup

## Keyboard Shortcut

- `Ctrl+Shift+R` (Windows/Linux) or `Command+Shift+R` (Mac) to start reading

## Features

- Extracts main content from web pages
- Reads content aloud using Web Speech API
- On-page overlay with accessible controls
- Customizable speech settings (rate, pitch, volume, voice)
- Full keyboard navigation support
- ARIA-compliant accessibility features

