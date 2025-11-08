/**
 * Main entry point that coordinates domAnalyzer, pageReader, and overlay
 * Uses dynamic imports for Manifest V3 compatibility
 */

let extractPageContent, pageReader, overlay, onContentMessage, MESSAGE_TYPES, READING_STATUS;
let modulesLoaded = false;

/**
 * Load all required modules dynamically
 */
async function loadModules() {
  if (modulesLoaded) return;
  
  try {
    // Use chrome.runtime.getURL to get the correct extension URL
    // chrome.runtime.getURL returns something like: chrome-extension://<id>/src/
    const basePath = chrome.runtime.getURL('src/');
    console.log('Loading modules from base path:', basePath);
    
    // Construct full paths - using URL constructor ensures proper path resolution
    const domAnalyzerPath = new URL('content/domAnalyzer.js', basePath).href;
    const pageReaderPath = new URL('content/pageReader.js', basePath).href;
    const overlayPath = new URL('content/overlay.js', basePath).href;
    const messagingPath = new URL('common/messaging.js', basePath).href;
    const constantsPath = new URL('common/constants.js', basePath).href;
    
    console.log('Loading modules:', {
      domAnalyzer: domAnalyzerPath,
      pageReader: pageReaderPath,
      overlay: overlayPath,
      messaging: messagingPath,
      constants: constantsPath
    });
    
    // Load modules - these will automatically resolve their own imports
    const [domAnalyzerModule, pageReaderModule, overlayModule, messagingModule, constantsModule] = await Promise.all([
      import(domAnalyzerPath),
      import(pageReaderPath),
      import(overlayPath),
      import(messagingPath),
      import(constantsPath)
    ]);
    
    extractPageContent = domAnalyzerModule.extractPageContent;
    pageReader = pageReaderModule.pageReader;
    overlay = overlayModule.overlay;
    onContentMessage = messagingModule.onContentMessage;
    MESSAGE_TYPES = constantsModule.MESSAGE_TYPES;
    READING_STATUS = constantsModule.READING_STATUS;
    
    modulesLoaded = true;
    console.log('All modules loaded successfully');
  } catch (error) {
    console.error('Error loading modules:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.error('Base path was:', chrome.runtime.getURL('src/'));
    throw error;
  }
}

/**
 * Initialize the content script
 */
async function init() {
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
    overlay.updateStatus(status);
    overlay.updateButtons(status);
  });

  // Set up message listener
  onContentMessage((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep channel open for async responses
  });
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
        await startReading();
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
          status: pageReader.getStatus(),
          isReading: pageReader.isReading(),
          isPaused: pageReader.isPaused()
        });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
}

/**
 * Start reading the page content
 */
async function startReading() {
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
    overlay.updateStatus(READING_STATUS.IDLE);
    overlay.updateButtons(READING_STATUS.IDLE);

    // Start reading
    await pageReader.startReading(content);
  } catch (error) {
    console.error('Error starting reading:', error);
    if (modulesLoaded && overlay && overlay.exists()) {
      overlay.updateStatus(READING_STATUS.ERROR);
      overlay.updateButtons(READING_STATUS.ERROR);
    }
    throw error;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init().catch(error => {
      console.error('Failed to initialize AURA content script:', error);
    });
  });
} else {
  init().catch(error => {
    console.error('Failed to initialize AURA content script:', error);
  });
}

