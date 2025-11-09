const MESSAGE_SOURCE = 'AURA_MIC_PERMISSION';

function notifyParent(status, error = '') {
  try {
    window.parent?.postMessage({
      source: MESSAGE_SOURCE,
      status,
      error
    }, '*');
  } catch (postError) {
    console.error('[AURA] Failed to notify parent about mic permission result:', postError);
  }
}

async function requestPermission() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    notifyParent('unsupported', 'Microphone access is not supported in this browser.');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    notifyParent('granted');
  } catch (error) {
    console.error('[AURA] Microphone permission request failed:', error);
    notifyParent('denied', error?.name || 'unknown');
  }
}

requestPermission();
