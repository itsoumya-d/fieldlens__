import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '@/lib/auth';
import { useTranslation } from 'react-i18next';

const PRIMARY = '#EA580C';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.includes('@')) { Alert.alert('Error', 'Enter a valid email.'); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else setSent(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        {sent ? (
          <View style={styles.center}>
            <Ionicons name="mail" size={56} color={PRIMARY} />
            <Text style={styles.title}>{t('auth.emailSent')}</Text>
            <Text style={styles.subtitle}>{t('auth.checkEmailReset', { email })}</Text>
            <TouchableOpacity accessibilityRole="button" style={[styles.btn, { backgroundColor: PRIMARY }]} onPress={() => router.replace('/auth/login')}>
              <Text style={styles.btnText}>{t('auth.backToSignIn')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.forgotPasswordSub')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity accessibilityRole="button" style={[styles.btn, { backgroundColor: PRIMARY }]} onPress={handleReset} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24 },
  backBtn: { marginBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24, lineHeight: 22 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB', marginBottom: 20 },
  btn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
