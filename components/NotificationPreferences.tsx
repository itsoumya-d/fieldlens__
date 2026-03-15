import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  Switch, StyleSheet, TextInput, Platform, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNotificationPrefs, saveNotificationPrefs, type NotificationPrefs } from '@/lib/notificationPrefs';

const CATEGORIES = [
  { id: 'job_assignments', label: 'Job Assignments' },
  { id: 'schedule_changes', label: 'Schedule Changes' },
  { id: 'completion_alerts', label: 'Completion Alerts' },
  { id: 'product_updates', label: 'Product Updates' },
  { id: 'marketing', label: 'Promotions & Offers' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationPreferences({ visible, onClose }: Props) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    categories: {},
    quietHoursEnabled: false,
    quietFrom: '22:00',
    quietTo: '08:00',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      getNotificationPrefs().then(setPrefs);
    }
  }, [visible]);

  const toggleCategory = (id: string, value: boolean) => {
    setPrefs(p => ({ ...p, categories: { ...p.categories, [id]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    await saveNotificationPrefs(prefs);
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Notifications</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content}>
          {/* Categories */}
          <Text style={s.sectionLabel}>NOTIFICATION TYPES</Text>
          <View style={s.card}>
            {CATEGORIES.map((cat, i) => (
              <View key={cat.id} style={[s.row, i < CATEGORIES.length - 1 && s.rowBorder]}>
                <Text style={s.rowLabel}>{cat.label}</Text>
                <Switch
                  value={prefs.categories[cat.id] !== false}
                  onValueChange={(v) => toggleCategory(cat.id, v)}
                  trackColor={{ false: '#374151', true: '#4F46E5' }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>

          {/* Quiet Hours */}
          <Text style={[s.sectionLabel, { marginTop: 24 }]}>QUIET HOURS</Text>
          <View style={s.card}>
            <View style={[s.row, s.rowBorder]}>
              <Text style={s.rowLabel}>Enable Quiet Hours</Text>
              <Switch
                value={prefs.quietHoursEnabled}
                onValueChange={(v) => setPrefs(p => ({ ...p, quietHoursEnabled: v }))}
                trackColor={{ false: '#374151', true: '#4F46E5' }}
                thumbColor="#fff"
              />
            </View>
            {prefs.quietHoursEnabled && (
              <>
                <View style={[s.row, s.rowBorder]}>
                  <Text style={s.rowLabel}>From</Text>
                  <TextInput
                    value={prefs.quietFrom}
                    onChangeText={(v) => setPrefs(p => ({ ...p, quietFrom: v }))}
                    placeholder="22:00"
                    placeholderTextColor="#6B7280"
                    style={s.timeInput}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
                <View style={s.row}>
                  <Text style={s.rowLabel}>Until</Text>
                  <TextInput
                    value={prefs.quietTo}
                    onChangeText={(v) => setPrefs(p => ({ ...p, quietTo: v }))}
                    placeholder="08:00"
                    placeholderTextColor="#6B7280"
                    style={s.timeInput}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
              </>
            )}
            {prefs.quietHoursEnabled && (
              <View style={s.quietPreview}>
                <Ionicons name="moon-outline" size={14} color="#6B7280" />
                <Text style={s.quietPreviewText}>
                  No notifications between {prefs.quietFrom} and {prefs.quietTo}
                </Text>
              </View>
            )}
          </View>

          {/* Preview note */}
          <View style={s.previewNote}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={s.previewNoteText}>
              Critical alerts (security, safety) are always delivered regardless of quiet hours.
            </Text>
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={s.footer}>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 16 : 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  title: { fontSize: 18, fontWeight: '700', color: '#F9FAFB' },
  closeBtn: { padding: 4 },
  content: { padding: 20, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', letterSpacing: 1, marginBottom: 8 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#374151' },
  rowLabel: { fontSize: 15, color: '#E5E7EB', flex: 1 },
  timeInput: { backgroundColor: '#374151', color: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, fontSize: 14, minWidth: 80, textAlign: 'center' },
  quietPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 12 },
  quietPreviewText: { fontSize: 12, color: '#6B7280', flex: 1 },
  previewNote: { flexDirection: 'row', gap: 8, marginTop: 16, padding: 12, backgroundColor: '#1F2937', borderRadius: 10 },
  previewNoteText: { fontSize: 12, color: '#6B7280', flex: 1, lineHeight: 18 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#1F2937' },
  saveBtn: { backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
