/**
 * Constants for AURA extension
 * Message types, command names, storage keys, etc.
 */

// Message types for chrome.runtime messaging
export const MESSAGE_TYPES = {
  START_READING: 'START_READING',
  PAUSE_READING: 'PAUSE_READING',
  RESUME_READING: 'RESUME_READING',
  STOP_READING: 'STOP_READING',
  GET_STATUS: 'GET_STATUS',
  REQUEST_SUMMARY: 'REQUEST_SUMMARY',
  SUMMARY_READY: 'SUMMARY_READY',
  SUMMARY_ERROR: 'SUMMARY_ERROR',
  REQUEST_MIC_PERMISSION: 'REQUEST_MIC_PERMISSION',
  OPEN_WEBSITE: 'OPEN_WEBSITE',
  STATUS_UPDATE: 'STATUS_UPDATE',
  CONTENT_EXTRACTED: 'CONTENT_EXTRACTED',
  READING_COMPLETE: 'READING_COMPLETE',
  READING_ERROR: 'READING_ERROR'
};

// Storage keys for user preferences
export const STORAGE_KEYS = {
  SPEECH_RATE: 'speechRate',
  SPEECH_PITCH: 'speechPitch',
  SPEECH_VOICE: 'speechVoice',
  SPEECH_VOLUME: 'speechVolume',
  AI_API_KEY: 'aiApiKey',
  AI_MODEL: 'aiModel',
  AI_BASE_URL: 'aiBaseUrl',
  READING_MODE: 'readingMode'
};

// Default speech settings
export const DEFAULT_SPEECH_SETTINGS = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  voice: null // Will use browser default
};

// Command names
export const COMMANDS = {
  READ_PAGE: 'read-page'
};

// Overlay element IDs
export const OVERLAY_IDS = {
  CONTAINER: 'aura-overlay',
  STATUS: 'aura-status',
  PAUSE_BUTTON: 'aura-pause-btn',
  RESUME_BUTTON: 'aura-resume-btn',
  STOP_BUTTON: 'aura-stop-btn',
  EXIT_BUTTON: 'aura-exit-btn'
};

// Reading status
export const READING_STATUS = {
  IDLE: 'idle',
  SUMMARIZING: 'summarizing',
  READING: 'reading',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  COMPLETE: 'complete',
  ERROR: 'error'
};

export const READING_MODES = {
  SUMMARY: 'summary',
  FULL: 'full'
};
