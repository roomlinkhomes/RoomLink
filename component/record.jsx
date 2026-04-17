// components/Record.jsx - Modern branded waveform recorder
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const NUM_BARS = 20;

const Record = ({ onRecordingComplete, isDisabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);

  const recordingRef = useRef(null);
  const durationInterval = useRef(null);
  const waveAnim = useRef([...Array(NUM_BARS)].map(() => new Animated.Value(5))).current;
  const waveInterval = useRef(null);

  const heavyVibrate = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

  const startRecording = async () => {
    if (isDisabled) return;

    try {
      heavyVibrate();
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      startWaveAnimation();
    } catch (err) {
      console.error('Recording start error:', err);
    }
  };

  const stopAndSend = async () => {
    if (!recordingRef.current) return;
    try {
      clearInterval(durationInterval.current);
      stopWaveAnimation();
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (uri && onRecordingComplete) {
        onRecordingComplete(uri, duration);
      }
      resetState();
    } catch (err) {
      console.error('Send error:', err);
      resetState();
    }
  };

  const deleteRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
    }
    resetState();
  };

  const resetState = () => {
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    recordingRef.current = null;
    if (durationInterval.current) clearInterval(durationInterval.current);
    stopWaveAnimation();
  };

  // Wave animation reacts to voice
  const startWaveAnimation = () => {
    waveInterval.current = setInterval(async () => {
      if (!recordingRef.current) return;

      try {
        const status = await recordingRef.current.getStatusAsync();
        if (!status.isRecording) return;

        let level = status.metering ?? -160;
        let baseHeight = Math.max(4, Math.min(38, (level + 160) * 0.28));

        waveAnim.forEach((val) => {
          const variation = Math.random() * 8 - 3;
          const finalHeight = baseHeight + variation;

          Animated.timing(val, {
            toValue: finalHeight,
            duration: 80,
            useNativeDriver: false,
          }).start();
        });
      } catch (e) {
        waveAnim.forEach((val) => {
          const gentle = 6 + Math.random() * 4;
          Animated.timing(val, {
            toValue: gentle,
            duration: 120,
            useNativeDriver: false,
          }).start();
        });
      }
    }, 90);
  };

  const stopWaveAnimation = () => {
    if (waveInterval.current) {
      clearInterval(waveInterval.current);
      waveInterval.current = null;
    }
    waveAnim.forEach(val => val.setValue(5));
  };

  useEffect(() => {
    return () => {
      clearInterval(durationInterval.current);
      stopWaveAnimation();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {(isRecording || isPaused) && (
        <View style={styles.recordRow}>

          {/* Delete */}
          <TouchableOpacity onPress={deleteRecording} style={styles.deleteBtn}>
            <Ionicons name="close-outline" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Waveform */}
          <View style={styles.waveContainer}>
            {waveAnim.map((val, i) => (
              <Animated.View
                key={i}
                style={[styles.waveBar, { height: val }]}
              />
            ))}
          </View>

          {/* Timer + live dot */}
          <View style={styles.timerWrap}>
            <View style={styles.liveDot} />
            <Text style={styles.duration}>
              {Math.floor(duration / 60).toString().padStart(2, '0')}:
              {(duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>

          {/* Send */}
          <TouchableOpacity onPress={stopAndSend} style={styles.sendBtn}>
            <Ionicons name="arrow-up-outline" size={22} color="#fff" />
          </TouchableOpacity>

        </View>
      )}

      {!isRecording && !isPaused && (
        <TouchableOpacity
          style={styles.micButton}
          onPress={startRecording}
          disabled={isDisabled}
        >
          <Ionicons name="mic-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },

  micButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 40,
    minWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },

  waveContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
    height: 42,
    marginHorizontal: 10,
  },

  waveBar: {
    width: 3,
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },

  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },

  duration: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    minWidth: 48,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Record;