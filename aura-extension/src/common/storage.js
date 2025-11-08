/**
 * Wrapper around chrome.storage.local for user preferences
 */

/**
 * Get a value from storage
 * @param {string|string[]} keys - Single key or array of keys
 * @returns {Promise<Object>} Promise that resolves with the stored values
 */
export function getStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Set a value in storage
 * @param {Object} items - Object with key-value pairs to store
 * @returns {Promise} Promise that resolves when storage is updated
 */
export function setStorage(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Remove a value from storage
 * @param {string|string[]} keys - Single key or array of keys to remove
 * @returns {Promise} Promise that resolves when keys are removed
 */
export function removeStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Clear all storage
 * @returns {Promise} Promise that resolves when storage is cleared
 */
export function clearStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get all stored values
 * @returns {Promise<Object>} Promise that resolves with all stored values
 */
export function getAllStorage() {
  return getStorage(null);
}

