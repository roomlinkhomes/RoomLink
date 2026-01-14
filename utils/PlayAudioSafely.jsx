// utils/playAudioSafely.js
import { Audio } from 'expo-audio';

let soundObject = null;

export const playAudioSafely = async (uri) => {
  // 1. Kill any previous sound
  if (soundObject) {
    try { await soundObject.unloadAsync(); } catch {}
    soundObject = null;
  }

  // 2. Basic validation
  if (!uri || typeof uri !== 'string' || uri.length < 10) {
    console.log('Invalid audio URI:', uri);
    return;
  }

  // 3. Block known bad patterns (common in buggy Firebase uploads)
  if (
    uri.includes('.jpg') ||
    uri.includes('.jpeg') ||
    uri.includes('.png') ||
    uri.includes('.webp') ||
    uri.includes('.gif') ||
    uri.includes('placeholder') ||
    uri.includes('firebasestorage') && uri.endsWith('=') // broken token
  ) {
    console.log('Blocked bad audio URL:', uri);
    return;
  }

  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      null
    );
    soundObject = sound;

    sound.setOnPlaybackStatusUpdate(status => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        soundObject = null;
      }
    });

  } catch (error) {
    console.log('Audio playback failed (safe):', uri);
    // Silently fail — no spam in logs
  }
};