import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import PressableScale from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import { VoiceRecordButton, type VoiceRecordButtonHandle } from './VoiceRecordButton';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  style?: ViewStyle;
  voice?: boolean;
}

export function SearchInput({ onSearch, placeholder = 'Search...', debounceMs = 300, style, voice = false }: SearchInputProps) {
  const [value, setValue] = useState('');
  const voiceRef = useRef<VoiceRecordButtonHandle>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const handleChange = useCallback((text: string) => {
    voiceRef.current?.cancel();
    setValue(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(text), debounceMs);
  }, [onSearch, debounceMs]);
  const handleClear = useCallback(() => { voiceRef.current?.cancel(); setValue(''); if (timerRef.current) clearTimeout(timerRef.current); onSearch(''); }, [onSearch]);
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search" size={18} color="#9CA3AF" style={styles.icon} />
      <TextInput value={value} onChangeText={handleChange} placeholder={placeholder} placeholderTextColor="#9CA3AF" style={styles.input} returnKeyType="search" clearButtonMode="never" />
      {value.length > 0 && (
        <PressableScale haptic="light" accessibilityRole="button" accessibilityLabel="Clear search" onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </PressableScale>
      )}
      {voice && (
        <VoiceRecordButton ref={voiceRef} onTranscript={(text) => handleChange(text)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  icon: { flexShrink: 0 },
  input: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 0 },
});
