/**
 * Main entry point that coordinates domAnalyzer, pageReader, and overlay
 * Uses dynamic imports for Manifest V3 compatibility
 * 
 * Prevents multiple initializations by checking for existing instance
 */

// Check if script has already been initialized
if (window.__AURA_CONTENT_SCRIPT_LOADED__) {
  console.log('[AURA] Content script already loaded, skipping re-initialization');
} else {
  // Mark as loaded immediately to prevent race conditions
  window.__AURA_CONTENT_SCRIPT_LOADED__ = true;

  let extractPageContent, pageReader, overlay, registerMessageHandler, sendRuntimeMessage, MESSAGE_TYPES, READING_STATUS, READING_MODES;
  let modulesLoaded = false;
  let currentStatus = 'idle';

  /**
   * Load all required modules dynamically
   */
  async function loadModules() {
    if (modulesLoaded) return;
    
    try {
      // Get base path - ensure it ends with /
      let basePath = chrome.runtime.getURL('src/');
      if (!basePath.endsWith('/')) {
        basePath += '/';
      }
      
      console.log('[AURA] Loading modules from base path:', basePath);
      
      // Construct paths more reliably
      const domAnalyzerPath = basePath + 'content/domAnalyzer.js';
      const pageReaderPath = basePath + 'content/pageReader.js';
      const overlayPath = basePath + 'content/overlay.js';
      const messagingPath = basePath + 'common/messaging.js';
      const constantsPath = basePath + 'common/constants.js';
      
      console.log('[AURA] Loading modules:', {
        domAnalyzer: domAnalyzerPath,
        pageReader: pageReaderPath,
        overlay: overlayPath,
        messaging: messagingPath,
        constants: constantsPath
      });
      
      // Load modules sequentially to better handle nested imports
      console.log('[AURA] Loading constants module...');
      const constantsModule = await import(constantsPath);
      MESSAGE_TYPES = constantsModule.MESSAGE_TYPES;
      READING_STATUS = constantsModule.READING_STATUS;
      READING_MODES = constantsModule.READING_MODES;
      
      console.log('[AURA] Loading messaging module...');
      const messagingModule = await import(messagingPath);
      registerMessageHandler = messagingModule.onMessage;
      sendRuntimeMessage = messagingModule.sendMessage;
      
      console.log('[AURA] Loading domAnalyzer module...');
      const domAnalyzerModule = await import(domAnalyzerPath);
      extractPageContent = domAnalyzerModule.extractPageContent;
      
      console.log('[AURA] Loading overlay module...');
      const overlayModule = await import(overlayPath);
      overlay = overlayModule.overlay;
      
      console.log('[AURA] Loading pageReader module...');
      const pageReaderModule = await import(pageReaderPath);
      pageReader = pageReaderModule.pageReader;
      
      modulesLoaded = true;
      console.log('[AURA] ✅ All modules loaded successfully');
    } catch (error) {
      console.error('[AURA] ❌ Error loading modules:', error);
      console.error('[AURA] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      console.error('[AURA] Base path was:', chrome.runtime.getURL('src/'));
      
      // Provide helpful error message
      if (error.message.includes('Failed to fetch') || error.message.includes('Failed to load')) {
        console.error('[AURA] 💡 TIP: Check that all JS files are listed in web_accessible_resources in manifest.json');
        console.error('[AURA] 💡 TIP: Make sure the extension is reloaded after manifest changes');
      }
      
      throw error;
    }
  }

  /**
   * Initialize the content script
   */
  async function init() {
    try {
      await loadModules();
      
      // Set up overlay with callbacks
      overlay.setCallbacks({
        onPause: () => {
          pageReader.pauseReading();
        },
        onResume: () => {
          pageReader.resumeReading();
        },
        onStop: () => {
          pageReader.stopReading();
        }
      });

      // Set up page reader status callback
      pageReader.setStatusCallback((status) => {
        updateStatus(status);
      });

      // Set up message listener
      registerMessageHandler((message, sender, sendResponse) => {
        handleMessage(message, sender, sendResponse);
        return true; // Keep channel open for async responses
      });
      
      console.log('[AURA] ✅ Content script initialized successfully');
    } catch (error) {
      console.error('[AURA] ❌ Failed to initialize:', error);
      // Reset the flag so we can try again
      window.__AURA_CONTENT_SCRIPT_LOADED__ = false;
    }
  }

  /**
   * Handle messages from background script or popup
   * @param {Object} message - Message object
   * @param {Object} sender - Message sender
   * @param {Function} sendResponse - Response callback
   */
  async function handleMessage(message, sender, sendResponse) {
    try {
      await loadModules(); // Ensure modules are loaded
      
      switch (message.type) {
        case MESSAGE_TYPES.START_READING:
          await startReading({ mode: message.mode });
          sendResponse({ success: true });
          break;

        case MESSAGE_TYPES.PAUSE_READING:
          pageReader.pauseReading();
          sendResponse({ success: true });
          break;

        case MESSAGE_TYPES.RESUME_READING:
          pageReader.resumeReading();
          sendResponse({ success: true });
          break;

        case MESSAGE_TYPES.STOP_READING:
          pageReader.stopReading();
          sendResponse({ success: true });
          break;

        case MESSAGE_TYPES.GET_STATUS:
          sendResponse({ 
            status: getStatus(),
            isReading: pageReader.isReading(),
            isPaused: pageReader.isPaused()
          });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[AURA] Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Start reading the page content
   */
  async function startReading(options = {}) {
    try {
      await loadModules(); // Ensure modules are loaded

      // Extract content from page
      const content = extractPageContent();

      if (!content || content.trim().length === 0) {
        throw new Error('No readable content found on this page');
      }

      // Create and show overlay if it doesn't exist
      if (!overlay.exists()) {
        overlay.create();
      }
      overlay.show();
      const readingMode = options.mode || (READING_MODES ? READING_MODES.SUMMARY : 'summary');
      const shouldSummarize = readingMode === (READING_MODES ? READING_MODES.SUMMARY : 'summary');

      let textToRead = content;

      if (shouldSummarize) {
        updateStatus(READING_STATUS.SUMMARIZING);
        const { text: summaryText, isSummary } = await getSummaryForContent(content);
        textToRead = summaryText;
        if (overlay.updateSummary) {
          overlay.updateSummary(isSummary ? summaryText : '');
        }
      } else {
        if (overlay.updateSummary) {
          overlay.updateSummary('');
        }
        updateStatus(READING_STATUS.IDLE);
      }

      // Start reading
      await pageReader.startReading(textToRead);
    } catch (error) {
      console.error('[AURA] Error starting reading:', error);
      if (modulesLoaded && overlay && overlay.exists()) {
        updateStatus(READING_STATUS.ERROR);
      }
      throw error;
    }
  }

  /**
   * Request a summary from the background worker
   * @param {string} content - Raw extracted page text
   * @returns {Promise<string>} Summary or original text
   */
  async function getSummaryForContent(content) {
    if (!content || !content.trim()) {
      throw new Error('No readable content found on this page');
    }

    if (!sendRuntimeMessage) {
      return { text: content, isSummary: false };
    }

    try {
      const response = await sendRuntimeMessage(MESSAGE_TYPES.REQUEST_SUMMARY, {
        content,
        metadata: {
          title: document.title,
          url: window.location.href
        }
      });

      if (response && response.summary) {
        console.log('[AURA] Summary received from background');
        return { text: response.summary, isSummary: true };
      }

      return { text: content, isSummary: false };
    } catch (error) {
      console.error('[AURA] Summary request failed, falling back to full content:', error);
      return { text: content, isSummary: false };
    }
  }

  function updateStatus(status) {
    currentStatus = status;
    if (overlay && overlay.exists()) {
      overlay.updateStatus(status);
      overlay.updateButtons(status);
    }
  }

  function getStatus() {
    if (currentStatus) {
      return currentStatus;
    }
    if (pageReader) {
      return pageReader.getStatus();
    }
    return READING_STATUS ? READING_STATUS.IDLE : 'idle';
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init().catch(error => {
        console.error('[AURA] Failed to initialize AURA content script:', error);
      });
    });
  } else {
    init().catch(error => {
      console.error('[AURA] Failed to initialize AURA content script:', error);
    });
  }
}
