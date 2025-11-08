/**
 * Create and manage floating overlay UI with status display and controls
 */

import { OVERLAY_IDS, READING_STATUS } from '../common/constants.js';

class Overlay {
  constructor() {
    this.overlay = null;
    this.statusElement = null;
    this.pauseButton = null;
    this.resumeButton = null;
    this.stopButton = null;
    this.summaryElement = null;
    this.onPause = null;
    this.onResume = null;
    this.onStop = null;
  }

  /**
   * Create the overlay DOM structure
   */
  create() {
    // Remove existing overlay if present
    this.remove();

    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = OVERLAY_IDS.CONTAINER;
    this.overlay.setAttribute('role', 'region');
    this.overlay.setAttribute('aria-label', 'AURA Reading Controls');

    // Create status element
    this.statusElement = document.createElement('div');
    this.statusElement.id = OVERLAY_IDS.STATUS;
    this.statusElement.setAttribute('aria-live', 'polite');
    this.statusElement.setAttribute('aria-atomic', 'true');
    this.statusElement.textContent = 'Ready';

    // Create summary container
    this.summaryElement = document.createElement('div');
    this.summaryElement.id = 'aura-summary';
    this.summaryElement.setAttribute('role', 'document');
    this.summaryElement.setAttribute('aria-live', 'polite');
    this.summaryElement.hidden = true;
    this.overlay.appendChild(this.summaryElement);

    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'aura-controls';
    controls.setAttribute('role', 'toolbar');
    controls.setAttribute('aria-label', 'Reading controls');

    // Create pause button
    this.pauseButton = document.createElement('button');
    this.pauseButton.id = OVERLAY_IDS.PAUSE_BUTTON;
    this.pauseButton.className = 'aura-button';
    this.pauseButton.textContent = 'Pause';
    this.pauseButton.setAttribute('aria-label', 'Pause reading');
    this.pauseButton.addEventListener('click', () => {
      if (this.onPause) this.onPause();
    });
    this.pauseButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.onPause) this.onPause();
      }
    });

    // Create resume button
    this.resumeButton = document.createElement('button');
    this.resumeButton.id = OVERLAY_IDS.RESUME_BUTTON;
    this.resumeButton.className = 'aura-button';
    this.resumeButton.textContent = 'Resume';
    this.resumeButton.setAttribute('aria-label', 'Resume reading');
    this.resumeButton.style.display = 'none'; // Hidden initially
    this.resumeButton.addEventListener('click', () => {
      if (this.onResume) this.onResume();
    });
    this.resumeButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.onResume) this.onResume();
      }
    });

    // Create stop button
    this.stopButton = document.createElement('button');
    this.stopButton.id = OVERLAY_IDS.STOP_BUTTON;
    this.stopButton.className = 'aura-button';
    this.stopButton.textContent = 'Stop';
    this.stopButton.setAttribute('aria-label', 'Stop reading');
    this.stopButton.addEventListener('click', () => {
      if (this.onStop) this.onStop();
    });
    this.stopButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.onStop) this.onStop();
      }
    });

    // Assemble overlay
    controls.appendChild(this.pauseButton);
    controls.appendChild(this.resumeButton);
    controls.appendChild(this.stopButton);
    this.overlay.appendChild(this.statusElement);
    this.overlay.appendChild(controls);

    // Inject CSS if not already present
    this.injectCSS();

    // Append to body
    document.body.appendChild(this.overlay);
  }

  /**
   * Inject overlay CSS if not already present
   */
  injectCSS() {
    if (document.getElementById('aura-overlay-styles')) {
      return; // Already injected
    }

    const link = document.createElement('link');
    link.id = 'aura-overlay-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/content/overlay.css');
    document.head.appendChild(link);
  }

  /**
   * Update status display
   * @param {string} status - Status from READING_STATUS
   */
  updateStatus(status) {
    if (!this.statusElement) return;

    const statusMessages = {
      [READING_STATUS.IDLE]: 'Ready',
      [READING_STATUS.SUMMARIZING]: 'Summarizing…',
      [READING_STATUS.READING]: 'Reading…',
      [READING_STATUS.PAUSED]: 'Paused',
      [READING_STATUS.STOPPED]: 'Stopped',
      [READING_STATUS.COMPLETE]: 'Complete',
      [READING_STATUS.ERROR]: 'Error'
    };

    this.statusElement.textContent = statusMessages[status] || 'Ready';
  }

  /**
   * Update button visibility based on status
   * @param {string} status - Current reading status
   */
  updateButtons(status) {
    if (!this.pauseButton || !this.resumeButton || !this.stopButton) return;

    switch (status) {
      case READING_STATUS.READING:
        this.pauseButton.style.display = 'block';
        this.resumeButton.style.display = 'none';
        this.pauseButton.disabled = false;
        this.resumeButton.disabled = true;
        this.stopButton.disabled = false;
        break;

      case READING_STATUS.SUMMARIZING:
        this.pauseButton.style.display = 'block';
        this.resumeButton.style.display = 'none';
        this.pauseButton.disabled = true;
        this.resumeButton.disabled = true;
        this.stopButton.disabled = true;
        break;

      case READING_STATUS.PAUSED:
        this.pauseButton.style.display = 'none';
        this.resumeButton.style.display = 'block';
        this.pauseButton.disabled = true;
        this.resumeButton.disabled = false;
        this.stopButton.disabled = false;
        break;

      case READING_STATUS.COMPLETE:
      case READING_STATUS.STOPPED:
      case READING_STATUS.ERROR:
        this.pauseButton.style.display = 'block';
        this.resumeButton.style.display = 'none';
        this.pauseButton.disabled = true;
        this.resumeButton.disabled = true;
        this.stopButton.disabled = true;
        break;

      default:
        this.pauseButton.style.display = 'block';
        this.resumeButton.style.display = 'none';
        this.pauseButton.disabled = true;
        this.resumeButton.disabled = true;
        this.stopButton.disabled = true;
    }
  }

  /**
   * Set callbacks for button actions
   * @param {Object} callbacks - Object with onPause, onResume, onStop functions
   */
  setCallbacks(callbacks) {
    this.onPause = callbacks.onPause;
    this.onResume = callbacks.onResume;
    this.onStop = callbacks.onStop;
  }

  /**
   * Show the overlay
   */
  show() {
    if (this.overlay) {
      this.overlay.classList.remove('hidden');
    }
  }

  /**
   * Hide the overlay
   */
  hide() {
    if (this.overlay) {
      this.overlay.classList.add('hidden');
    }
  }

  /**
   * Remove the overlay from DOM
   */
  remove() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.statusElement = null;
    this.pauseButton = null;
    this.resumeButton = null;
    this.stopButton = null;
    this.summaryElement = null;
  }

  /**
   * Check if overlay exists
   * @returns {boolean} True if overlay is created
   */
  exists() {
    return this.overlay !== null;
  }

  /**
   * Update the summary display text
   * @param {string} text - Summary text
   */
  updateSummary(text) {
    if (!this.summaryElement) return;

    if (text && text.trim()) {
      this.summaryElement.textContent = text.trim();
      this.summaryElement.hidden = false;
    } else {
      this.summaryElement.textContent = '';
      this.summaryElement.hidden = true;
    }
  }
}

// Export singleton instance
export const overlay = new Overlay();
