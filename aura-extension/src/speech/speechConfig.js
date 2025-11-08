/**
 * Functions to read/write TTS settings (rate, pitch, voice) from storage
 */

import { getStorage, setStorage } from '../common/storage.js';
import { STORAGE_KEYS, DEFAULT_SPEECH_SETTINGS } from '../common/constants.js';

/**
 * Get speech settings from storage, with defaults
 * @returns {Promise<Object>} Promise that resolves with speech settings
 */
export async function getSpeechSettings() {
  try {
    const stored = await getStorage([
      STORAGE_KEYS.SPEECH_RATE,
      STORAGE_KEYS.SPEECH_PITCH,
      STORAGE_KEYS.SPEECH_VOICE,
      STORAGE_KEYS.SPEECH_VOLUME
    ]);

    return {
      rate: stored[STORAGE_KEYS.SPEECH_RATE] ?? DEFAULT_SPEECH_SETTINGS.rate,
      pitch: stored[STORAGE_KEYS.SPEECH_PITCH] ?? DEFAULT_SPEECH_SETTINGS.pitch,
      volume: stored[STORAGE_KEYS.SPEECH_VOLUME] ?? DEFAULT_SPEECH_SETTINGS.volume,
      voice: stored[STORAGE_KEYS.SPEECH_VOICE] ?? DEFAULT_SPEECH_SETTINGS.voice
    };
  } catch (error) {
    console.error('Error getting speech settings:', error);
    return DEFAULT_SPEECH_SETTINGS;
  }
}

/**
 * Save speech settings to storage
 * @param {Object} settings - Speech settings object with rate, pitch, volume, voice
 * @returns {Promise} Promise that resolves when settings are saved
 */
export async function saveSpeechSettings(settings) {
  try {
    const toStore = {};
    
    if (settings.rate !== undefined) {
      toStore[STORAGE_KEYS.SPEECH_RATE] = settings.rate;
    }
    if (settings.pitch !== undefined) {
      toStore[STORAGE_KEYS.SPEECH_PITCH] = settings.pitch;
    }
    if (settings.volume !== undefined) {
      toStore[STORAGE_KEYS.SPEECH_VOLUME] = settings.volume;
    }
    if (settings.voice !== undefined) {
      toStore[STORAGE_KEYS.SPEECH_VOICE] = settings.voice;
    }

    await setStorage(toStore);
  } catch (error) {
    console.error('Error saving speech settings:', error);
    throw error;
  }
}

/**
 * Get available voices from the browser
 * @returns {Promise<SpeechSynthesisVoice[]>} Promise that resolves with array of voices
 */
export function getAvailableVoices() {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      // Voices may not be loaded yet, wait for voiceschanged event
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
    }
  });
}

/**
 * Find a voice by name or URI
 * @param {string} voiceIdentifier - Voice name or URI
 * @returns {Promise<SpeechSynthesisVoice|null>} Promise that resolves with the voice or null
 */
export async function findVoice(voiceIdentifier) {
  if (!voiceIdentifier) return null;
  
  const voices = await getAvailableVoices();
  return voices.find(voice => 
    voice.name === voiceIdentifier || voice.voiceURI === voiceIdentifier
  ) || null;
}

