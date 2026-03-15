import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StyleSheet, Animated,
} from 'react-native';
import { router, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { signUpWithEmail, signInWithGoogle, signInWithApple } from '@/lib/auth';
import { useTranslation } from 'react-i18next';

const PRIMARY = '#EA580C';
const APP_NAME = 'FieldLens';

export default function SignupScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');

  const logoAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const showError = (msg: string) => {
    setError(msg); triggerShake();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSignUp = async () => {
    setError('');
    if (!name || !email || !password) { showError('Please fill in all fields.'); return; }
    if (!validateEmail(email)) { showError('Invalid email format.'); return; }
    if (password.length < 8) { showError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { showError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: authError } = await signUpWithEmail(email, password, name);
    setLoading(false);
    if (authError) { showError(authError.message); } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/auth/login');
    }
  };

  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try {
      const { error: authError } = await signInWithGoogle();
      if (authError) throw authError;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { showError('Google sign-in failed.'); } finally { setGoogleLoading(false); }
  };

  const handleApple = async () => {
    setError(''); setAppleLoading(true);
    try {
      const { error: authError } = await signInWithApple();
      if (authError) throw authError;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { showError('Apple sign-in failed.'); } finally { setAppleLoading(false); }
  };

  const logoScale = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const logoOpacity = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const socialDisabled = googleLoading || appleLoading || loading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Animated.View style={[styles.logoBox, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
            <Ionicons name="flash" size={32} color="#fff" />
          </Animated.View>

          <Text style={styles.title}>{t('auth.signUp')}</Text>
          <Text style={styles.subtitle}>{t('auth.join', { app: APP_NAME })}</Text>

          <TouchableOpacity accessibilityRole="button" style={[styles.appleBtn, socialDisabled && { opacity: 0.7 }]} onPress={handleApple} disabled={socialDisabled}>
            {appleLoading ? <ActivityIndicator color="#000" /> : <Ionicons name="logo-apple" size={20} color="#000" />}
            <Text style={styles.appleBtnText}>{appleLoading ? t('auth.signingUp') : t('auth.signUpWithApple')}</Text>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" style={[styles.googleBtn, socialDisabled && { opacity: 0.7 }]} onPress={handleGoogle} disabled={socialDisabled}>
            {googleLoading ? <ActivityIndicator color={PRIMARY} /> : <Text style={styles.googleIcon}>G</Text>}
            <Text style={[styles.googleBtnText, { color: PRIMARY }]}>{googleLoading ? t('auth.signingUp') : t('auth.signUpWithGoogle')}</Text>
          </TouchableOpacity>

          <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>{t('auth.orSignUpWithEmail')}</Text><View style={styles.dividerLine} /></View>

          <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#9CA3AF" value={name} onChangeText={v => { setName(v); setError(''); }} autoCapitalize="words" />
          <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#9CA3AF" value={email} onChangeText={v => { setEmail(v); setError(''); }} keyboardType="email-address" autoCapitalize="none" />

          <View style={styles.pwRow}>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Password (min 8 chars)" placeholderTextColor="#9CA3AF" value={password} onChangeText={v => { setPassword(v); setError(''); }} secureTextEntry={!showPw} />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={showPw ? "Hide password" : "Show password"} onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Confirm password" placeholderTextColor="#9CA3AF" value={confirm} onChangeText={v => { setConfirm(v); setError(''); }} secureTextEntry />

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </Animated.View>

          <TouchableOpacity accessibilityRole="button" style={[styles.primaryBtn, { backgroundColor: PRIMARY }, loading && { opacity: 0.7 }]} onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t('auth.signUp')}</Text>}
          </TouchableOpacity>

          <Text style={styles.terms}>By creating an account you agree to our Terms of Service and Privacy Policy.</Text>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/auth/login" asChild><TouchableOpacity><Text style={[styles.loginLink, { color: PRIMARY }]}>Sign In</Text></TouchableOpacity></Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, paddingTop: 20 },
  backBtn: { marginBottom: 16 },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginBottom: 16, alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 28 },
  appleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#000', borderRadius: 12, padding: 14, marginBottom: 12 },
  appleBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 24 },
  googleIcon: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontWeight: '600', fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#9CA3AF', fontSize: 12 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 12, backgroundColor: '#F9FAFB' },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { padding: 14 },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 8, marginBottom: 4 },
  primaryBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16, marginBottom: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  terms: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#6B7280', fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '600' },
});
