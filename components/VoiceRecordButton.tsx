import React from 'react';
import { StyleSheet, ActivityIndicator, Alert, Text, View } from 'react-native';
import PressableScale from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import { WEB_VOICE_UNAVAILABLE_MESSAGE, useVoiceRecording } from '@/lib/useVoiceRecording';

interface VoiceRecordButtonProps {
  onTranscript: (text: string) => void;
  color?: string;
}

export function VoiceRecordButton({ onTranscript, color = '#9CA3AF' }: VoiceRecordButtonProps) {
  const { recording, busy: processing, blocked, start: startRecording, stop: stopRecording } = useVoiceRecording({
    onTranscript,
    onError: (error) => {
      if (error === 'permission') {
        Alert.alert('Permission required', 'Microphone access is needed for voice input.');
      } else if (error === 'unavailable') {
        Alert.alert('Voice input unavailable', WEB_VOICE_UNAVAILABLE_MESSAGE);
      } else {
        Alert.alert('Error', error === 'start' ? 'Could not start recording.' : 'Could not transcribe audio.');
      }
    },
  });

  if (blocked) {
    // Alert.alert is a no-op on web; keep availability visibly explained.
    return (
      <View style={styles.warning}>
        <Ionicons name="warning-outline" size={18} color="#EF4444" />
        <Text accessibilityRole="alert" style={styles.warningText}>{WEB_VOICE_UNAVAILABLE_MESSAGE}</Text>
      </View>
    );
  }

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
  warning: { maxWidth: 240, padding: 4, gap: 4 },
  warningText: { color: '#EF4444', fontSize: 12 },
  btn: { padding: 4 },
  btnActive: { opacity: 0.9 },
});
