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
import { signInWithGoogle, signInWithMagicLink, signInWithEmail } from '@/lib/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';

const PRIMARY = '#EA580C';
const APP_NAME = 'FieldLens';

export default function LoginScreen() {
  const [tab, setTab] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState('');

  const logoAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
  }, []);

  useEffect(() => { if (magicSent) setResendCountdown(45); }, [magicSent]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

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

  const handleSignIn = async () => {
    setError('');
    if (!email) { showError('Please enter your email address.'); return; }
    if (!validateEmail(email)) { showError('Invalid email format.'); return; }
    if (!password) { showError('Please enter your password.'); return; }
    if (password.length < 8) { showError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    const { error: authError } = await signInWithEmail(email, password);
    setLoading(false);
    if (authError) {
      const msg = authError.message?.toLowerCase() ?? '';
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        showError('Incorrect password. Please try again.');
      } else if (msg.includes('user not found') || msg.includes('no user')) {
        showError('No account found with this email.');
      } else { showError(authError.message); }
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    }
  };

  const handleMagicLink = async () => {
    setError('');
    if (!email) { showError('Please enter your email address.'); return; }
    if (!validateEmail(email)) { showError('Invalid email format.'); return; }
    setLoading(true);
    const { error: authError } = await signInWithMagicLink(email);
    setLoading(false);
    if (authError) { showError(authError.message); } else { setMagicSent(true); }
  };

  const handleResendMagicLink = async () => {
    setLoading(true);
    const { error: authError } = await signInWithMagicLink(email);
    setLoading(false);
    if (authError) { showError(authError.message); } else {
      setResendCountdown(45);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleGoogle = async () => {
    setError(''); setSocialLoading('google');
    try {
      const { error: authError } = await signInWithGoogle();
      if (authError) throw authError;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { showError('Google sign-in failed.'); } finally { setSocialLoading(null); }
  };

  const handleApple = async () => {
    setError('');
    try {
      setSocialLoading('apple');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (credential.identityToken) {
        const { error: authError } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
        if (authError) throw authError;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') showError('Apple Sign-In failed.');
    } finally { setSocialLoading(null); }
  };

  const logoScale = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const logoOpacity = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Animated.View style={[styles.logo, { backgroundColor: PRIMARY, transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
              <Ionicons name="flash" size={32} color="#fff" />
            </Animated.View>
            <Text style={styles.title}>{APP_NAME}</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={[{ height: 48, marginBottom: 12 }, socialLoading !== null && { opacity: 0.7 }]}
              onPress={handleApple}
            />
          )}

          <TouchableOpacity accessibilityRole="button" style={[styles.googleBtn, socialLoading !== null && { opacity: 0.7 }]} onPress={handleGoogle} disabled={socialLoading !== null}>
            {socialLoading === 'google' ? <ActivityIndicator color={PRIMARY} /> : <Text style={styles.googleIcon}>G</Text>}
            <Text style={[styles.googleBtnText, { color: PRIMARY }]}>{socialLoading === 'google' ? 'Signing in...' : 'Continue with Google'}</Text>
          </TouchableOpacity>

          <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} /></View>

          <View style={styles.tabRow}>
            <TouchableOpacity accessibilityRole="button" style={[styles.tabBtn, tab === 'password' && { borderBottomColor: PRIMARY, borderBottomWidth: 2 }]} onPress={() => { setTab('password'); setError(''); }}>
              <Text style={[styles.tabText, tab === 'password' && { color: PRIMARY }]}>Password</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={[styles.tabBtn, tab === 'magic' && { borderBottomColor: PRIMARY, borderBottomWidth: 2 }]} onPress={() => { setTab('magic'); setError(''); }}>
              <Text style={[styles.tabText, tab === 'magic' && { color: PRIMARY }]}>Magic Link</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#9CA3AF" value={email} onChangeText={v => { setEmail(v); setError(''); }} keyboardType="email-address" autoCapitalize="none" />

          {tab === 'password' ? (
            <>
              <View style={styles.pwRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Password" placeholderTextColor="#9CA3AF" value={password} onChangeText={v => { setPassword(v); setError(''); }} secureTextEntry={!showPw} />
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={showPw ? "Hide password" : "Show password"} onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </Animated.View>
              <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/auth/forgot-password')} style={styles.forgotRow}>
                <Text style={[styles.forgotText, { color: PRIMARY }]}>Forgot password?</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={[styles.primaryBtn, { backgroundColor: PRIMARY }]} onPress={handleSignIn} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
              </TouchableOpacity>
            </>
          ) : magicSent ? (
            <View style={styles.magicSentBox}>
              <Ionicons name="mail" size={40} color={PRIMARY} />
              <Text style={styles.magicSentTitle}>Check your email</Text>
              <Text style={styles.magicSentText}>We sent a magic link to {email}</Text>
              <TouchableOpacity accessibilityRole="button" style={[styles.resendBtn, resendCountdown > 0 && { opacity: 0.5 }]} onPress={resendCountdown === 0 ? handleResendMagicLink : undefined} disabled={resendCountdown > 0 || loading}>
                <Text style={[styles.resendBtnText, { color: PRIMARY }]}>{resendCountdown > 0 ? `Resend link in ${resendCountdown}s` : 'Resend now'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </Animated.View>
              <TouchableOpacity accessibilityRole="button" style={[styles.primaryBtn, { backgroundColor: PRIMARY }]} onPress={handleMagicLink} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send Magic Link</Text>}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/auth/signup" asChild><TouchableOpacity><Text style={[styles.signupLink, { color: PRIMARY }]}>Sign Up</Text></TouchableOpacity></Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 24 },
  googleIcon: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontWeight: '600', fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#9CA3AF', fontSize: 13 },
  tabRow: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 12, backgroundColor: '#F9FAFB' },
  pwRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  eyeBtn: { padding: 14 },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 8, marginTop: 2 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 16 },
  forgotText: { fontSize: 13, fontWeight: '500' },
  primaryBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  magicSentBox: { alignItems: 'center', padding: 24, gap: 8 },
  magicSentTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  magicSentText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  resendBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 20 },
  resendBtnText: { fontSize: 14, fontWeight: '600' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  signupText: { color: '#6B7280', fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '600' },
});
