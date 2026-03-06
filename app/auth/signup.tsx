import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { router, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signUpWithEmail, signInWithGoogle, signInWithApple } from '@/lib/auth';

const PRIMARY = '#EA580C';
const APP_NAME = 'FieldLens';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleSignUp = async () => {
    if (!name || !email || !password) { Alert.alert('Error', 'Fill in all fields.'); return; }
    if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters.'); return; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await signUpWithEmail(email, password, name);
    setLoading(false);
    if (error) Alert.alert('Sign Up Failed', error.message);
    else Alert.alert(
      'Verify your email',
      'We sent a confirmation link to ' + email,
      [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
    );
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join {APP_NAME} today</Text>

          <TouchableOpacity style={styles.appleBtn} onPress={handleApple} disabled={socialLoading !== null}>
            {socialLoading === 'apple'
              ? <ActivityIndicator color="#000" />
              : <><Ionicons name="logo-apple" size={20} color="#000" /><Text style={styles.appleBtnText}>Sign up with Apple</Text></>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={socialLoading !== null}>
            {socialLoading === 'google'
              ? <ActivityIndicator color={PRIMARY} />
              : <><Text style={styles.googleIcon}>G</Text><Text style={[styles.googleBtnText, { color: PRIMARY }]}>Sign up with Google</Text></>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with email</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} autoCapitalize="words" />
          <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <View style={styles.pwRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Password (min 8 chars)"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Confirm password" placeholderTextColor="#9CA3AF" value={confirm} onChangeText={setConfirm} secureTextEntry />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: PRIMARY }]} onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <Text style={styles.terms}>By creating an account you agree to our Terms of Service and Privacy Policy.</Text>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity><Text style={[styles.loginLink, { color: PRIMARY }]}>Sign In</Text></TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, paddingTop: 20 },
  backBtn: { marginBottom: 24 },
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
  primaryBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  terms: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#6B7280', fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '600' },
});
