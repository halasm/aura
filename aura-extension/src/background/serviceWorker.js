/**
 * Background service worker for AURA extension
 * Handles toolbar clicks, keyboard shortcuts, messaging, and AI summaries
 */

import { MESSAGE_TYPES, COMMANDS, STORAGE_KEYS, READING_MODES } from '../common/constants.js';
import { getStorage } from '../common/storage.js';

const DEFAULT_AI_MODEL = 'gpt-4o-mini';
const DEFAULT_AI_BASE_URL = 'https://api.openai.com/v1';
const MAX_CONTENT_CHARS = 12000;
const KNOWN_SITES = [
  { url: 'https://www.google.com/', aliases: ['google'] },
  { url: 'https://www.youtube.com/', aliases: ['youtube', 'yt', 'you tube'] },
  { url: 'https://mail.google.com/', aliases: ['gmail', 'google mail'] },
  { url: 'https://calendar.google.com/', aliases: ['google calendar', 'calendar'] },
  { url: 'https://www.facebook.com/', aliases: ['facebook', 'fb'] },
  { url: 'https://www.twitter.com/', aliases: ['twitter', 'x', 'tweet'] },
  { url: 'https://www.instagram.com/', aliases: ['instagram', 'ig', 'insta'] },
  { url: 'https://www.tiktok.com/', aliases: ['tiktok', 'tick tock'] },
  { url: 'https://www.linkedin.com/', aliases: ['linkedin', 'linked in'] },
  { url: 'https://www.reddit.com/', aliases: ['reddit'] },
  { url: 'https://www.amazon.com/', aliases: ['amazon'] },
  { url: 'https://www.netflix.com/', aliases: ['netflix'] },
  { url: 'https://www.spotify.com/', aliases: ['spotify'] },
  { url: 'https://drive.google.com/', aliases: ['google drive', 'drive'] },
  { url: 'https://docs.google.com/document/u/0/', aliases: ['google docs', 'docs'] },
  { url: 'https://docs.google.com/spreadsheets/u/0/', aliases: ['google sheets', 'sheets'] },
  { url: 'https://open.spotify.com/', aliases: ['open spotify'] },
  { url: 'https://news.ycombinator.com/', aliases: ['hacker news', 'hn'] },
  { url: 'https://chat.openai.com/', aliases: ['chatgpt', 'gpt', 'openai chat'] },
  { url: 'https://www.bbc.com/', aliases: ['bbc'] }
];

chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab?.id) {
      throw new Error('No active tab');
    }
    await triggerReadingOnTab(tab.id);
  } catch (error) {
    console.error('Error starting reading from icon click:', error);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === COMMANDS.READ_PAGE) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await triggerReadingOnTab(tab.id);
      }
    } catch (error) {
      console.error('Error starting reading from keyboard shortcut:', error);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (shouldForwardToActiveTab(message.type)) {
    (async () => {
      try {
        const enrichedMessage = await enrichStartReadingMessage(message);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          sendResponse({ error: 'No active tab found' });
          return;
        }
        const response = await chrome.tabs.sendMessage(tab.id, enrichedMessage);
        sendResponse(response);
      } catch (error) {
        console.error('Error forwarding message to content script:', error);
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }

  if (message.type === MESSAGE_TYPES.REQUEST_SUMMARY) {
    (async () => {
      try {
        const summary = await summarizeContent(message.content, message.metadata);
        sendResponse({ summary, type: MESSAGE_TYPES.SUMMARY_READY });
      } catch (error) {
        console.error('Summary request failed:', error);
        sendResponse({ error: error.message, type: MESSAGE_TYPES.SUMMARY_ERROR });
      }
    })();
    return true;
  }

  if (message.type === MESSAGE_TYPES.OPEN_WEBSITE) {
    (async () => {
      try {
        const result = await openWebsite(message.query, message.options);
        sendResponse({ success: true, ...result });
      } catch (error) {
        console.error('Failed to open requested website:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  return false;
});

function shouldForwardToActiveTab(type) {
  return type === MESSAGE_TYPES.START_READING ||
    type === MESSAGE_TYPES.PAUSE_READING ||
    type === MESSAGE_TYPES.RESUME_READING ||
    type === MESSAGE_TYPES.STOP_READING ||
    type === MESSAGE_TYPES.GET_STATUS;
}

async function enrichStartReadingMessage(message) {
  if (message.type !== MESSAGE_TYPES.START_READING || message.mode) {
    return message;
  }
  const mode = await getPreferredReadingMode();
  return { ...message, mode };
}

async function triggerReadingOnTab(tabId) {
  const mode = await getPreferredReadingMode();
  await chrome.tabs.sendMessage(tabId, {
    type: MESSAGE_TYPES.START_READING,
    mode
  });
}

async function getPreferredReadingMode() {
  try {
    const stored = await getStorage(STORAGE_KEYS.READING_MODE);
    return stored?.[STORAGE_KEYS.READING_MODE] || READING_MODES.SUMMARY;
  } catch (error) {
    console.warn('Unable to read stored reading mode, defaulting to summary:', error);
    return READING_MODES.SUMMARY;
  }
}

async function summarizeContent(content, metadata = {}) {
  if (!content || !content.trim()) {
    throw new Error('No content provided for summarization');
  }

  const trimmed = content.trim();
  const truncated = trimmed.length > MAX_CONTENT_CHARS ? trimmed.slice(0, MAX_CONTENT_CHARS) : trimmed;
  const { apiKey, model, baseUrl } = await getAiSettings();

  if (!apiKey) {
    throw new Error('Add your AI API key in the AURA Settings page to enable summaries.');
  }

  const endpointBase = (baseUrl || DEFAULT_AI_BASE_URL).replace(/\/$/, '');
  const endpoint = `${endpointBase}/chat/completions`;

  const systemPrompt = 'You are AURA, an accessibility assistant. Provide a short, empathetic description (4-6 sentences) that helps visually impaired users understand the essence, structure, and key actions on the page.';
  const metaTitle = metadata?.title ? metadata.title : 'Untitled page';
  const metaUrl = metadata?.url ? metadata.url : 'Unknown URL';
  const userPrompt = `Title: ${metaTitle}\nURL: ${metaUrl}\n\nSummarize the important information, layout, and calls-to-action from this page.\n\nContent:\n${truncated}`;

  const body = {
    model: model || DEFAULT_AI_MODEL,
    temperature: 0.2,
    max_tokens: 320,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new Error(`Summary API failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const summary = data?.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    throw new Error('AI response did not include summary text');
  }
  return summary;
}

async function getAiSettings() {
  try {
    const stored = await getStorage([
      STORAGE_KEYS.AI_API_KEY,
      STORAGE_KEYS.AI_MODEL,
      STORAGE_KEYS.AI_BASE_URL
    ]);

    return {
      apiKey: stored?.[STORAGE_KEYS.AI_API_KEY] || '',
      model: stored?.[STORAGE_KEYS.AI_MODEL] || DEFAULT_AI_MODEL,
      baseUrl: stored?.[STORAGE_KEYS.AI_BASE_URL] || DEFAULT_AI_BASE_URL
    };
  } catch (error) {
    console.error('Failed to read AI settings from storage:', error);
    return {
      apiKey: '',
      model: DEFAULT_AI_MODEL,
      baseUrl: DEFAULT_AI_BASE_URL
    };
  }
}

async function readErrorBody(response) {
  try {
    const text = await response.text();
    return text.slice(0, 300) || 'Unknown error';
  } catch (error) {
    console.warn('Failed to read error body:', error);
    return 'Unknown error';
  }
}

async function openWebsite(rawQuery = '', options = {}) {
  const query = (rawQuery || '').toLowerCase().trim();
  if (!query) {
    throw new Error('No website name provided');
  }

  const match = findKnownSite(query);
  const aiResolvedUrl = match ? null : await resolveWebsiteWithAi(query);
  const urlToOpen = match || aiResolvedUrl || buildSearchUrl(query);

  const openInNewTab = options?.newTab ?? false;
  if (openInNewTab) {
    await chrome.tabs.create({ url: urlToOpen });
  } else {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      await chrome.tabs.update(activeTab.id, { url: urlToOpen });
    } else {
      await chrome.tabs.create({ url: urlToOpen });
    }
  }

  return {
    matchedUrl: match || aiResolvedUrl || '',
    finalUrl: urlToOpen,
    matched: Boolean(match || aiResolvedUrl)
  };
}

function findKnownSite(query) {
  const normalized = sanitizeSiteQuery(query);
  for (const entry of KNOWN_SITES) {
    if (entry.aliases.some(alias => sanitizeSiteQuery(alias) === normalized)) {
      return entry.url;
    }
  }

  // allow partial contains for queries like "open youtube videos"
  for (const entry of KNOWN_SITES) {
    if (entry.aliases.some(alias => normalized.includes(sanitizeSiteQuery(alias)))) {
      return entry.url;
    }
  }
  return null;
}

function sanitizeSiteQuery(input = '') {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

async function resolveWebsiteWithAi(query) {
  if (!query || !query.trim()) {
    return null;
  }

  const { apiKey, model, baseUrl } = await getAiSettings();
  if (!apiKey) {
    return null;
  }

  const endpointBase = (baseUrl || DEFAULT_AI_BASE_URL).replace(/\/$/, '');
  const endpoint = `${endpointBase}/chat/completions`;

  const systemPrompt = 'You help map informal user requests to well-known website URLs. Respond with a single absolute HTTPS URL if you can confidently identify the requested site, otherwise respond with the single word UNKNOWN.';
  const userPrompt = `User said: "${query}".\nReturn only the canonical URL (e.g., https://www.youtube.com/).`;

  const body = {
    model: model || DEFAULT_AI_MODEL,
    temperature: 0,
    max_tokens: 40,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await readErrorBody(response);
      console.warn('AI site resolution failed:', errorBody);
      return null;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text || text.toUpperCase() === 'UNKNOWN') {
      return null;
    }

    const normalized = normalizeUrl(text);
    return normalized;
  } catch (error) {
    console.error('resolveWebsiteWithAi error:', error);
    return null;
  }
}

function normalizeUrl(candidate = '') {
  let urlText = candidate.trim();
  if (!urlText) return null;
  if (!/^https?:\/\//i.test(urlText)) {
    urlText = `https://${urlText}`;
  }
  try {
    const parsed = new URL(urlText);
    return parsed.href;
  } catch {
    return null;
  }
}
