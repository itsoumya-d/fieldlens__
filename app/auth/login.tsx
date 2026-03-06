import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { router, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle, signInWithApple, signInWithMagicLink, signInWithEmail } from '@/lib/auth';

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

  const handleSignIn = async () => {
    if (!email || !password) { Alert.alert('Error', 'Enter email and password.'); return; }
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) Alert.alert('Sign In Failed', error.message);
    else router.replace('/(tabs)');
  };

  const handleMagicLink = async () => {
    if (!email.includes('@')) { Alert.alert('Error', 'Enter a valid email.'); return; }
    setLoading(true);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else setMagicSent(true);
  };

  const handleGoogle = async () => {
    setSocialLoading('google');
    const { error } = await signInWithGoogle();
    setSocialLoading(null);
    if (error) Alert.alert('Error', 'Google sign-in failed.');
  };

  const handleApple = async () => {
    setSocialLoading('apple');
    const { error } = await signInWithApple();
    setSocialLoading(null);
    if (error) Alert.alert('Error', 'Apple sign-in failed.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: PRIMARY }]}>
              <Ionicons name="flash" size={32} color="#fff" />
            </View>
            <Text style={styles.title}>{APP_NAME}</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <TouchableOpacity style={styles.appleBtn} onPress={handleApple} disabled={socialLoading !== null}>
            {socialLoading === 'apple'
              ? <ActivityIndicator color="#000" />
              : <><Ionicons name="logo-apple" size={20} color="#000" /><Text style={styles.appleBtnText}>Continue with Apple</Text></>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={socialLoading !== null}>
            {socialLoading === 'google'
              ? <ActivityIndicator color={PRIMARY} />
              : <><Text style={styles.googleIcon}>G</Text><Text style={[styles.googleBtnText, { color: PRIMARY }]}>Continue with Google</Text></>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'password' && { borderBottomColor: PRIMARY, borderBottomWidth: 2 }]}
              onPress={() => setTab('password')}
            >
              <Text style={[styles.tabText, tab === 'password' && { color: PRIMARY }]}>Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'magic' && { borderBottomColor: PRIMARY, borderBottomWidth: 2 }]}
              onPress={() => setTab('magic')}
            >
              <Text style={[styles.tabText, tab === 'magic' && { color: PRIMARY }]}>Magic Link</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {tab === 'password' ? (
            <>
              <View style={styles.pwRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} style={styles.forgotRow}>
                <Text style={[styles.forgotText, { color: PRIMARY }]}>Forgot password?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: PRIMARY }]}
                onPress={handleSignIn}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
              </TouchableOpacity>
            </>
          ) : magicSent ? (
            <View style={styles.magicSentBox}>
              <Ionicons name="mail" size={40} color={PRIMARY} />
              <Text style={styles.magicSentTitle}>Check your email</Text>
              <Text style={styles.magicSentText}>We sent a magic link to {email}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: PRIMARY }]}
              onPress={handleMagicLink}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send Magic Link</Text>}
            </TouchableOpacity>
          )}

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity><Text style={[styles.signupLink, { color: PRIMARY }]}>Sign Up</Text></TouchableOpacity>
            </Link>
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
  appleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#000', borderRadius: 12, padding: 14, marginBottom: 12 },
  appleBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
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
  pwRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eyeBtn: { padding: 14 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 16 },
  forgotText: { fontSize: 13, fontWeight: '500' },
  primaryBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  magicSentBox: { alignItems: 'center', padding: 24, gap: 8 },
  magicSentTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  magicSentText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  signupText: { color: '#6B7280', fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '600' },
});
