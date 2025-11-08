/**
 * Wrapper around speechSynthesis API with pause/resume/stop controls
 */

import { getSpeechSettings, findVoice } from '../speech/speechConfig.js';
import { READING_STATUS } from '../common/constants.js';

class PageReader {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.utterance = null;
    this.status = READING_STATUS.IDLE;
    this.onStatusChange = null;
    this.currentText = '';
    this.currentCharIndex = 0;
  }

  /**
   * Set callback for status changes
   * @param {Function} callback - Function(status) called when status changes
   */
  setStatusCallback(callback) {
    this.onStatusChange = callback;
  }

  /**
   * Update status and notify callback
   * @param {string} newStatus - New status from READING_STATUS
   */
  updateStatus(newStatus) {
    this.status = newStatus;
    if (this.onStatusChange) {
      this.onStatusChange(newStatus);
    }
  }

  /**
   * Create and configure a speech utterance
   * @param {string} text - Text to speak
   * @param {Object} settings - Speech settings (rate, pitch, volume, voice)
   * @returns {SpeechSynthesisUtterance} Configured utterance
   */
  createUtterance(text, settings) {
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = settings.rate || 1.0;
    utterance.pitch = settings.pitch || 1.0;
    utterance.volume = settings.volume || 1.0;
    
    if (settings.voice) {
      utterance.voice = settings.voice;
    }

    // Set up event handlers
    utterance.onstart = () => {
      this.updateStatus(READING_STATUS.READING);
    };

    utterance.onend = () => {
      this.updateStatus(READING_STATUS.COMPLETE);
      this.utterance = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.updateStatus(READING_STATUS.ERROR);
      this.utterance = null;
    };

    utterance.onpause = () => {
      this.updateStatus(READING_STATUS.PAUSED);
    };

    utterance.onresume = () => {
      this.updateStatus(READING_STATUS.READING);
    };

    return utterance;
  }

  /**
   * Start reading text
   * @param {string} text - Text to read
   * @returns {Promise} Promise that resolves when reading starts
   */
  async startReading(text) {
    // Stop any current reading
    this.stopReading();

    if (!text || text.trim().length === 0) {
      this.updateStatus(READING_STATUS.ERROR);
      throw new Error('No text to read');
    }

    this.currentText = text;
    this.currentCharIndex = 0;

    try {
      const settings = await getSpeechSettings();
      
      // If a voice identifier is stored, find the actual voice object
      if (settings.voice) {
        settings.voice = await findVoice(settings.voice);
      }

      this.utterance = this.createUtterance(text, settings);
      this.synthesis.speak(this.utterance);
    } catch (error) {
      console.error('Error starting reading:', error);
      this.updateStatus(READING_STATUS.ERROR);
      throw error;
    }
  }

  /**
   * Pause reading
   */
  pauseReading() {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume reading
   */
  resumeReading() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Stop reading
   */
  stopReading() {
    if (this.synthesis.speaking || this.synthesis.paused) {
      this.synthesis.cancel();
    }
    this.utterance = null;
    this.updateStatus(READING_STATUS.STOPPED);
  }

  /**
   * Get current reading status
   * @returns {string} Current status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Check if currently reading
   * @returns {boolean} True if reading
   */
  isReading() {
    return this.status === READING_STATUS.READING;
  }

  /**
   * Check if paused
   * @returns {boolean} True if paused
   */
  isPaused() {
    return this.status === READING_STATUS.PAUSED;
  }
}

// Export singleton instance
export const pageReader = new PageReader();

