# Configuration Guide

## API Keys

**AI summaries now require an API key.**

The base reading experience still uses the **Web Speech API** (`speechSynthesis`) and works offline, but the new "AI Summary" mode sends page content to your configured AI provider (OpenAI by default). Without a valid key, the extension will fall back to reading the full article.

## AI Summary Configuration

1. Open the extension's **Settings** page.
2. Enter your **AI API key** (OpenAI-compatible) and optional custom base URL/model.
3. The key is stored locally via `chrome.storage.local` and never leaves your machine except when calling the configured API endpoint.

### Supported Providers

- **OpenAI API** (default)
- Any OpenAI-compatible endpoint (Anthropic via proxy, Azure OpenAI, etc.) by changing the base URL.

### Advanced Features
- Cloud-based TTS services (if you want more voices)
- Translation services
- Content analysis APIs

## How to Add API Keys

1. Navigate to the **Options** page inside the extension.
2. Paste your API key into the **AI API Key** field.
3. (Optional) Change the base URL or model name if you're targeting a different provider.
4. Click **Save Settings**. The background service worker will use these values for every summary request.

## Current Architecture

The extension currently:
- ✅ Uses browser-native Web Speech API (no keys needed)
- ✅ Stores user preferences in `chrome.storage.local`
- ✅ Works completely offline (after initial load)

No external API calls are made in the MVP version.
