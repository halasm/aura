/**
 * Helper functions for chrome.runtime messaging between components
 */

import { MESSAGE_TYPES } from './constants.js';

/**
 * Send a message and return a promise
 * @param {string} type - Message type from MESSAGE_TYPES
 * @param {Object} data - Optional data to send
 * @returns {Promise} Promise that resolves with the response
 */
export function sendMessage(type, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send a message to a specific tab
 * @param {number} tabId - The tab ID
 * @param {string} type - Message type from MESSAGE_TYPES
 * @param {Object} data - Optional data to send
 * @returns {Promise} Promise that resolves with the response
 */
export function sendMessageToTab(tabId, type, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Set up a message listener
 * @param {Function} handler - Function that handles messages: (message, sender, sendResponse) => boolean
 */
export function onMessage(handler) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle async responses
    const result = handler(message, sender, sendResponse);
    if (result instanceof Promise) {
      result.then(sendResponse).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true; // Keep channel open for async response
    }
    return result !== false; // Return true to keep channel open if needed
  });
}

/**
 * Set up a message listener for content scripts
 * @param {Function} handler - Function that handles messages: (message, sender, sendResponse) => boolean
 */
export function onContentMessage(handler) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Only handle messages sent to content scripts
    if (sender.tab) {
      const result = handler(message, sender, sendResponse);
      if (result instanceof Promise) {
        result.then(sendResponse).catch((error) => {
          sendResponse({ error: error.message });
        });
        return true;
      }
      return result !== false;
    }
    return false;
  });
}

