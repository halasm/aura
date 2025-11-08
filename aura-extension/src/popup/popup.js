/**
 * Popup initialization and controls
 */

import { sendMessage, sendMessageToTab } from '../common/messaging.js';
import { MESSAGE_TYPES, READING_STATUS } from '../common/constants.js';

let currentStatus = READING_STATUS.IDLE;

// Get DOM elements
const readButton = document.getElementById('read-button');
const statusElement = document.getElementById('status');
const controls = document.getElementById('controls');
const pauseButton = document.getElementById('pause-button');
const resumeButton = document.getElementById('resume-button');
const stopButton = document.getElementById('stop-button');
const optionsLink = document.getElementById('options-link');

/**
 * Update status display
 * @param {string} status - Current reading status
 */
function updateStatus(status) {
  currentStatus = status;
  
  const statusMessages = {
    [READING_STATUS.IDLE]: 'Ready to read',
    [READING_STATUS.READING]: 'Reading…',
    [READING_STATUS.PAUSED]: 'Paused',
    [READING_STATUS.STOPPED]: 'Stopped',
    [READING_STATUS.COMPLETE]: 'Reading complete',
    [READING_STATUS.ERROR]: 'Error reading page'
  };

  statusElement.textContent = statusMessages[status] || 'Ready to read';
}

/**
 * Update button states based on status
 * @param {string} status - Current reading status
 */
function updateButtons(status) {
  switch (status) {
    case READING_STATUS.READING:
      readButton.disabled = true;
      controls.style.display = 'flex';
      pauseButton.style.display = 'block';
      resumeButton.style.display = 'none';
      pauseButton.disabled = false;
      resumeButton.disabled = true;
      stopButton.disabled = false;
      break;

    case READING_STATUS.PAUSED:
      readButton.disabled = true;
      controls.style.display = 'flex';
      pauseButton.style.display = 'none';
      resumeButton.style.display = 'block';
      pauseButton.disabled = true;
      resumeButton.disabled = false;
      stopButton.disabled = false;
      break;

    case READING_STATUS.COMPLETE:
    case READING_STATUS.STOPPED:
    case READING_STATUS.ERROR:
      readButton.disabled = false;
      controls.style.display = 'flex';
      pauseButton.style.display = 'block';
      resumeButton.style.display = 'none';
      pauseButton.disabled = true;
      resumeButton.disabled = true;
      stopButton.disabled = true;
      break;

    default:
      readButton.disabled = false;
      controls.style.display = 'none';
      pauseButton.disabled = true;
      resumeButton.disabled = true;
      stopButton.disabled = true;
  }
}

/**
 * Check if we can inject scripts into the tab
 * @param {number} tabId - Tab ID
 * @returns {Promise<boolean>} True if script can be injected
 */
async function canInjectScript(tabId) {
  try {
    // Try to get tab info - if it fails, we can't inject
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return false;
    
    // Check if URL is injectable (not chrome://, chrome-extension://, etc.)
    const url = new URL(tab.url);
    if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Inject content script if needed
 * @param {number} tabId - Tab ID
 */
async function ensureContentScript(tabId) {
  try {
    // Try to ping the content script
    await sendMessageToTab(tabId, MESSAGE_TYPES.GET_STATUS);
    return true; // Content script is ready
  } catch (error) {
    // Content script not ready, try to inject it
    try {
      if (await canInjectScript(tabId)) {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['src/content/contentScript.js']
        });
        // Wait a bit for the script to initialize
        await new Promise(resolve => setTimeout(resolve, 200));
        // Try to ping again to confirm it's ready
        try {
          await sendMessageToTab(tabId, MESSAGE_TYPES.GET_STATUS);
          return true;
        } catch (pingError) {
          console.error('Content script injected but not responding:', pingError);
          return false;
        }
      }
      return false;
    } catch (injectError) {
      console.error('Could not inject content script:', injectError);
      return false;
    }
  }
}

/**
 * Start reading
 */
async function startReading() {
  try {
    updateStatus(READING_STATUS.IDLE);
    updateButtons(READING_STATUS.IDLE);
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Check if we can inject scripts
    if (!(await canInjectScript(tab.id))) {
      throw new Error('Cannot read this page. Please navigate to a regular webpage (not chrome:// or extension pages).');
    }

    // Ensure content script is ready
    const scriptReady = await ensureContentScript(tab.id);
    if (!scriptReady) {
      throw new Error('Content script failed to load. Please refresh the page and try again.');
    }

    await sendMessageToTab(tab.id, MESSAGE_TYPES.START_READING);
    updateStatus(READING_STATUS.READING);
    updateButtons(READING_STATUS.READING);
  } catch (error) {
    console.error('Error starting reading:', error);
    const errorMessage = error.message || 'Failed to start reading';
    updateStatus(READING_STATUS.ERROR);
    updateButtons(READING_STATUS.ERROR);
    // Show error message to user
    statusElement.textContent = `Error: ${errorMessage}`;
  }
}

/**
 * Pause reading
 */
async function pauseReading() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await sendMessageToTab(tab.id, MESSAGE_TYPES.PAUSE_READING);
      updateStatus(READING_STATUS.PAUSED);
      updateButtons(READING_STATUS.PAUSED);
    }
  } catch (error) {
    console.error('Error pausing reading:', error);
    // If connection fails, content script might have been removed
    updateStatus(READING_STATUS.ERROR);
    updateButtons(READING_STATUS.ERROR);
  }
}

/**
 * Resume reading
 */
async function resumeReading() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await sendMessageToTab(tab.id, MESSAGE_TYPES.RESUME_READING);
      updateStatus(READING_STATUS.READING);
      updateButtons(READING_STATUS.READING);
    }
  } catch (error) {
    console.error('Error resuming reading:', error);
    updateStatus(READING_STATUS.ERROR);
    updateButtons(READING_STATUS.ERROR);
  }
}

/**
 * Stop reading
 */
async function stopReading() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await sendMessageToTab(tab.id, MESSAGE_TYPES.STOP_READING);
      updateStatus(READING_STATUS.STOPPED);
      updateButtons(READING_STATUS.STOPPED);
    }
  } catch (error) {
    console.error('Error stopping reading:', error);
    // Don't show error for stop - just reset to idle
    updateStatus(READING_STATUS.IDLE);
    updateButtons(READING_STATUS.IDLE);
  }
}

/**
 * Get current status from content script
 */
async function refreshStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const response = await sendMessageToTab(tab.id, MESSAGE_TYPES.GET_STATUS);
      if (response && response.status) {
        updateStatus(response.status);
        updateButtons(response.status);
      }
    }
  } catch (error) {
    // Content script might not be ready, that's okay
    updateStatus(READING_STATUS.IDLE);
    updateButtons(READING_STATUS.IDLE);
  }
}

// Set up event listeners
readButton.addEventListener('click', startReading);
pauseButton.addEventListener('click', pauseReading);
resumeButton.addEventListener('click', resumeReading);
stopButton.addEventListener('click', stopReading);

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Initialize
updateStatus(READING_STATUS.IDLE);
updateButtons(READING_STATUS.IDLE);

// Refresh status when popup opens
refreshStatus();

// Poll for status updates while popup is open
const statusInterval = setInterval(refreshStatus, 1000);

// Clear interval when popup closes
window.addEventListener('beforeunload', () => {
  clearInterval(statusInterval);
});

