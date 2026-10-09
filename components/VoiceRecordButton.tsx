import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, ActivityIndicator, Alert, Platform, Text, View } from 'react-native';
import PressableScale from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import { WEB_VOICE_UNAVAILABLE_MESSAGE, useVoiceRecording } from '@/lib/useVoiceRecording';

interface VoiceRecordButtonProps {
  onTranscript: (text: string) => void;
  color?: string;
}

export interface VoiceRecordButtonHandle { cancel: () => void }

export const VoiceRecordButton = forwardRef<VoiceRecordButtonHandle, VoiceRecordButtonProps>(function VoiceRecordButton({ onTranscript, color = '#9CA3AF' }, ref) {
  const [errorText, setErrorText] = useState<string | null>(null);
  const { recording, busy: processing, blocked, start: startRecording, stop: stopRecording, cancel } = useVoiceRecording({
    onTranscript,
    onError: (error) => {
      const message = error === 'permission' ? 'Microphone access is needed for voice input.' :
        error === 'unavailable' ? WEB_VOICE_UNAVAILABLE_MESSAGE :
        error === 'start' ? 'Could not start recording. You can type instead.' : 'Could not transcribe audio. Please try again.';
      if (Platform.OS === 'web') setErrorText(message);
      else if (error === 'permission') Alert.alert('Permission required', 'Microphone access is needed for voice input.');
      else if (error === 'unavailable') Alert.alert('Voice input unavailable', WEB_VOICE_UNAVAILABLE_MESSAGE);
      else Alert.alert('Error', error === 'start' ? 'Could not start recording.' : 'Could not transcribe audio.');
    },
  });
  useImperativeHandle(ref, () => ({ cancel }), [cancel]);
  useFocusEffect(useCallback(() => () => cancel(), [cancel]));


  if (blocked) {
    // Alert.alert is a no-op on web; keep availability visibly explained.
    return (
      <View style={styles.warning}>
        <Ionicons name="warning-outline" size={18} color="#EF4444" />
        <Text accessibilityRole="alert" style={styles.warningText}>{WEB_VOICE_UNAVAILABLE_MESSAGE}</Text>
      </View>
    );
  }

  return (
    <View style={styles.controls}>
      <View style={styles.row}>
        {processing ? <ActivityIndicator size="small" color={color} style={styles.btn} /> : (
          <PressableScale
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Stop recording' : 'Start voice input'}
            onPress={recording ? stopRecording : () => { setErrorText(null); void startRecording(); }}
            style={[styles.btn, recording && styles.btnActive]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={recording ? 'stop-circle' : 'mic-outline'} size={18} color={recording ? '#EF4444' : color} />
          </PressableScale>
        )}
        {(recording || processing) && (
          <PressableScale haptic="light" accessibilityRole="button" accessibilityLabel="Cancel voice input" onPress={cancel} style={styles.btn}>
            <Ionicons name="close-circle-outline" size={20} color={color} />
          </PressableScale>
        )}
      </View>
      {errorText && <Text accessibilityRole="alert" style={styles.warningText}>{errorText}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  controls: { maxWidth: 240 },
  row: { flexDirection: 'row', alignItems: 'center' },
  warning: { maxWidth: 240, padding: 4, gap: 4 },
  warningText: { color: '#EF4444', fontSize: 12 },
  btn: { padding: 4 },
  btnActive: { opacity: 0.9 },
});
