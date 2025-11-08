# Configuration Guide

## API Keys

**For the MVP version, no API keys are required!**

The current implementation uses the **Web Speech API** (`speechSynthesis`), which is built into modern browsers and doesn't require any external services or API keys.

## Future Features That May Require API Keys

If you plan to implement the following features from the roadmap, you'll need API keys:

### AI-Powered Summaries
- **OpenAI API** - For GPT-based summaries
- **Anthropic API** - For Claude-based summaries
- **Google Gemini API** - Alternative option

### Advanced Features
- Cloud-based TTS services (if you want more voices)
- Translation services
- Content analysis APIs

## How to Add API Keys (When Needed)

1. Create a `.env` file in the extension root (not included in git)
2. Add your API keys:
   ```
   OPENAI_API_KEY=your_key_here
   ```
3. Use a build tool (webpack, rollup, etc.) to inject these at build time
4. **Never commit `.env` files to git!**

## Current Architecture

The extension currently:
- ✅ Uses browser-native Web Speech API (no keys needed)
- ✅ Stores user preferences in `chrome.storage.local`
- ✅ Works completely offline (after initial load)

No external API calls are made in the MVP version.

