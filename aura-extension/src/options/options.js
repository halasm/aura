/**
 * Options page functionality
 */

import { getSpeechSettings, saveSpeechSettings, getAvailableVoices } from '../speech/speechConfig.js';
import { DEFAULT_SPEECH_SETTINGS, STORAGE_KEYS } from '../common/constants.js';
import { getStorage, setStorage } from '../common/storage.js';

// Get DOM elements
const rateSlider = document.getElementById('speech-rate');
const pitchSlider = document.getElementById('speech-pitch');
const volumeSlider = document.getElementById('speech-volume');
const voiceSelect = document.getElementById('speech-voice');
const rateValue = document.getElementById('rate-value');
const pitchValue = document.getElementById('pitch-value');
const volumeValue = document.getElementById('volume-value');
const saveButton = document.getElementById('save-button');
const resetButton = document.getElementById('reset-button');
const statusElement = document.getElementById('status');
const apiKeyInput = document.getElementById('ai-api-key');
const modelInput = document.getElementById('ai-model');
const baseUrlInput = document.getElementById('ai-base-url');

/**
 * Load current settings
 */
async function loadSettings() {
  try {
    const settings = await getSpeechSettings();
    
    rateSlider.value = settings.rate;
    pitchSlider.value = settings.pitch;
    volumeSlider.value = settings.volume;
    
    updateValueDisplay('rate', settings.rate);
    updateValueDisplay('pitch', settings.pitch);
    updateValueDisplay('volume', settings.volume);
    
    // Load voices
    await loadVoices(settings.voice);

    // Load AI settings
    await loadAiSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

async function loadAiSettings() {
  try {
    const stored = await getStorage([
      STORAGE_KEYS.AI_API_KEY,
      STORAGE_KEYS.AI_MODEL,
      STORAGE_KEYS.AI_BASE_URL
    ]);

    apiKeyInput.value = stored[STORAGE_KEYS.AI_API_KEY] || '';
    modelInput.value = stored[STORAGE_KEYS.AI_MODEL] || 'gpt-4o-mini';
    baseUrlInput.value = stored[STORAGE_KEYS.AI_BASE_URL] || 'https://api.openai.com/v1';
  } catch (error) {
    console.error('Error loading AI settings:', error);
  }
}

/**
 * Load available voices into select
 */
async function loadVoices(selectedVoice) {
  try {
    const voices = await getAvailableVoices();
    
    // Clear existing options except default
    while (voiceSelect.children.length > 1) {
      voiceSelect.removeChild(voiceSelect.lastChild);
    }
    
    // Add voices
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = `${voice.name}${voice.lang ? ` (${voice.lang})` : ''}`;
      if (selectedVoice && (voice.name === selectedVoice || voice.voiceURI === selectedVoice)) {
        option.selected = true;
      }
      voiceSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading voices:', error);
  }
}

/**
 * Update value display for sliders
 */
function updateValueDisplay(type, value) {
  const element = document.getElementById(`${type}-value`);
  if (element) {
    element.textContent = parseFloat(value).toFixed(1);
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  try {
    const settings = {
      rate: parseFloat(rateSlider.value),
      pitch: parseFloat(pitchSlider.value),
      volume: parseFloat(volumeSlider.value),
      voice: voiceSelect.value || null
    };
    
    await saveSpeechSettings(settings);
    await saveAiSettings();
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

async function saveAiSettings() {
  const items = {
    [STORAGE_KEYS.AI_API_KEY]: apiKeyInput.value.trim(),
    [STORAGE_KEYS.AI_MODEL]: modelInput.value.trim() || 'gpt-4o-mini',
    [STORAGE_KEYS.AI_BASE_URL]: baseUrlInput.value.trim() || 'https://api.openai.com/v1'
  };

  try {
    await setStorage(items);
  } catch (error) {
    console.error('Error saving AI settings:', error);
    throw error;
  }
}

/**
 * Reset to defaults
 */
async function resetToDefaults() {
  rateSlider.value = DEFAULT_SPEECH_SETTINGS.rate;
  pitchSlider.value = DEFAULT_SPEECH_SETTINGS.pitch;
  volumeSlider.value = DEFAULT_SPEECH_SETTINGS.volume;
  voiceSelect.value = '';
  
  updateValueDisplay('rate', DEFAULT_SPEECH_SETTINGS.rate);
  updateValueDisplay('pitch', DEFAULT_SPEECH_SETTINGS.pitch);
  updateValueDisplay('volume', DEFAULT_SPEECH_SETTINGS.volume);
  
  await saveSettings();
}

/**
 * Show status message
 */
function showStatus(message, type = '') {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  
  if (message) {
    setTimeout(() => {
      statusElement.textContent = '';
      statusElement.className = 'status';
    }, 3000);
  }
}

// Set up event listeners
rateSlider.addEventListener('input', () => {
  updateValueDisplay('rate', rateSlider.value);
});

pitchSlider.addEventListener('input', () => {
  updateValueDisplay('pitch', pitchSlider.value);
});

volumeSlider.addEventListener('input', () => {
  updateValueDisplay('volume', volumeSlider.value);
});

saveButton.addEventListener('click', saveSettings);
resetButton.addEventListener('click', resetToDefaults);

// Load settings on page load
loadSettings();
