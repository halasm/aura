/**
 * Background service worker for AURA extension
 * Handles extension icon clicks, keyboard shortcuts, message routing
 */

// Message types (inline to avoid ES module issues)
const MESSAGE_TYPES = {
  START_READING: 'START_READING',
  PAUSE_READING: 'PAUSE_READING',
  RESUME_READING: 'RESUME_READING',
  STOP_READING: 'STOP_READING',
  GET_STATUS: 'GET_STATUS',
  STATUS_UPDATE: 'STATUS_UPDATE',
  CONTENT_EXTRACTED: 'CONTENT_EXTRACTED',
  READING_COMPLETE: 'READING_COMPLETE',
  READING_ERROR: 'READING_ERROR'
};

const COMMANDS = {
  READ_PAGE: 'read-page'
};

/**
 * Handle extension icon click
 */
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Send message to content script to start reading
    await chrome.tabs.sendMessage(tab.id, {
      type: MESSAGE_TYPES.START_READING
    });
  } catch (error) {
    console.error('Error starting reading from icon click:', error);
  }
});

/**
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === COMMANDS.READ_PAGE) {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          type: MESSAGE_TYPES.START_READING
        });
      }
    } catch (error) {
      console.error('Error starting reading from keyboard shortcut:', error);
    }
  }
});

/**
 * Handle messages from popup or content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages that need to be forwarded to content scripts
  if (message.type === MESSAGE_TYPES.START_READING ||
      message.type === MESSAGE_TYPES.PAUSE_READING ||
      message.type === MESSAGE_TYPES.RESUME_READING ||
      message.type === MESSAGE_TYPES.STOP_READING ||
      message.type === MESSAGE_TYPES.GET_STATUS) {
    
    // Forward to active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    
    return true; // Keep channel open for async response
  }
  
  return false;
});

