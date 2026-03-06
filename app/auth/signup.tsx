import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle, signInWithApple, signInWithMagicLink } from '@/lib/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleMagicLink = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setMagicLinkSent(true);
    }
  };

  const handleGoogle = async () => {
    setSocialLoading('google');
    const { error } = await signInWithGoogle();
    setSocialLoading(null);
    if (error) Alert.alert('Error', 'Failed to sign up with Google.');
  };

  const handleApple = async () => {
    setSocialLoading('apple');
    const { error } = await signInWithApple();
    setSocialLoading(null);
    if (error) Alert.alert('Error', 'Failed to sign up with Apple.');
  };

  if (magicLinkSent) {
    return (
      <View className="flex-1 bg-dark-bg items-center justify-center px-8">
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(45, 138, 78, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="mail" size={40} color="#2D8A4E" />
        </View>
        <Text style={{ fontSize: 24, color: '#FFFFFF', fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>
          Check Your Email
        </Text>
        <Text style={{ fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          We sent a magic link to{'\n'}
          <Text style={{ color: '#E8711A', fontWeight: '600' }}>{email}</Text>
          {'\n\n'}Tap the link in your email to create your account and start coaching.
        </Text>
        <TouchableOpacity
          onPress={() => setMagicLinkSent(false)}
          style={{
            borderWidth: 1,
            borderColor: '#3A3A3C',
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#8E8E93', fontSize: 15, fontWeight: '600' }}>Use Different Email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Logo */}
            <View className="items-center mb-10 mt-4">
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  backgroundColor: '#2C2C2E',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#E8711A',
                  marginBottom: 16,
                  shadowColor: '#E8711A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Ionicons name="eye" size={36} color="#E8711A" />
              </View>
              <Text style={{ fontSize: 28, color: '#FFFFFF', fontWeight: '800' }}>
                Field<Text style={{ color: '#E8711A' }}>Lens</Text>
              </Text>
            </View>

            {/* Heading */}
            <View className="mb-8">
              <Text style={{ fontSize: 26, color: '#FFFFFF', fontWeight: '700', marginBottom: 6 }}>
                Create your account
              </Text>
              <Text style={{ fontSize: 15, color: '#8E8E93' }}>
                Join thousands of tradespeople improving their craft.
              </Text>
            </View>

            {/* Value props */}
            <View
              style={{
                backgroundColor: 'rgba(232, 113, 26, 0.08)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: 'rgba(232, 113, 26, 0.2)',
                gap: 8,
              }}
            >
              {[
                { icon: 'camera', text: '3 free AI analyses per day' },
                { icon: 'library', text: 'Full task guide library' },
                { icon: 'trending-up', text: 'Progress tracking & streaks' },
              ].map((item) => (
                <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name={item.icon as any} size={16} color="#E8711A" />
                  <Text style={{ color: '#EBEBF5', fontSize: 14 }}>{item.text}</Text>
                </View>
              ))}
            </View>

            {/* Social Login Buttons */}
            <View style={{ gap: 12, marginBottom: 24 }}>
              {/* Apple */}
              <TouchableOpacity
                onPress={handleApple}
                disabled={socialLoading !== null}
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingVertical: 15,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  opacity: socialLoading === 'apple' ? 0.7 : 1,
                }}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Ionicons name="logo-apple" size={20} color="#000000" />
                )}
                <Text style={{ color: '#000000', fontSize: 16, fontWeight: '600' }}>
                  Sign up with Apple
                </Text>
              </TouchableOpacity>

              {/* Google */}
              <TouchableOpacity
                onPress={handleGoogle}
                disabled={socialLoading !== null}
                style={{
                  backgroundColor: 'transparent',
                  paddingVertical: 15,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  borderWidth: 1.5,
                  borderColor: '#3A3A3C',
                  opacity: socialLoading === 'google' ? 0.7 : 1,
                }}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                )}
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Sign up with Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#3A3A3C' }} />
              <Text style={{ color: '#636366', fontSize: 13, fontWeight: '500', marginHorizontal: 12 }}>
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#3A3A3C' }} />
            </View>

            {/* Email Magic Link */}
            <View style={{ gap: 12, marginBottom: 24 }}>
              <Text style={{ color: '#EBEBF5', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#636366"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: '#2C2C2E',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: email ? '#E8711A' : '#3A3A3C',
                }}
              />

              <TouchableOpacity
                onPress={handleMagicLink}
                disabled={loading || !email}
                style={{
                  backgroundColor: email ? '#E8711A' : '#2C2C2E',
                  paddingVertical: 15,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="mail" size={18} color={email ? '#FFFFFF' : '#636366'} />
                    <Text style={{ color: email ? '#FFFFFF' : '#636366', fontSize: 15, fontWeight: '700' }}>
                      Send Magic Link
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* TOS note */}
            <Text style={{ color: '#636366', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
              By continuing, you agree to our{' '}
              <Text style={{ color: '#8E8E93', textDecorationLine: 'underline' }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: '#8E8E93', textDecorationLine: 'underline' }}>Privacy Policy</Text>
            </Text>

            {/* Login link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#8E8E93', fontSize: 15 }}>Already have an account?</Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text style={{ color: '#E8711A', fontSize: 15, fontWeight: '600' }}>Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
