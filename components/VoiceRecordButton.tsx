import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, Alert } from 'react-native';
import PressableScale from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { supabase } from '@/lib/supabase';

interface VoiceRecordButtonProps {
  onTranscript: (text: string) => void;
  color?: string;
}

export function VoiceRecordButton({ onTranscript, color = '#9CA3AF' }: VoiceRecordButtonProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Microphone access is needed for voice input.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecording(true);
    } catch {
      Alert.alert('Error', 'Could not start recording.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      setRecording(false);
      setProcessing(true);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) { setProcessing(false); return; }
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioBase64: base64, mimeType: 'audio/m4a' },
      });
      if (!error && data?.text) onTranscript(data.text);
      else Alert.alert('Error', 'Could not transcribe audio.');
    } catch {
      Alert.alert('Error', 'Transcription failed.');
    } finally {
      setProcessing(false);
    }
  }, [onTranscript]);

  if (processing) {
    return <ActivityIndicator size="small" color={color} style={styles.btn} />;
  }

  return (
    <PressableScale
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Stop recording' : 'Start voice input'}
      onPress={recording ? stopRecording : startRecording}
      style={[styles.btn, recording && styles.btnActive]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name={recording ? 'stop-circle' : 'mic-outline'} size={18} color={recording ? '#EF4444' : color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
  btnActive: { opacity: 0.9 },
});
