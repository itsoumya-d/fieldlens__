import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';

export default function AuthCallback() {
  const { setSession, setUser } = useAuthStore();

  useEffect(() => {
    // Check if the user has been authenticated via the magic link / OAuth callback
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
        // Small delay for UX
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      } else {
        // Wait for the auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setSession(session);
            setUser(session.user);
            subscription.unsubscribe();
            setTimeout(() => {
              router.replace('/(tabs)');
            }, 1000);
          }
        });

        // Timeout fallback
        setTimeout(() => {
          subscription.unsubscribe();
          router.replace('/auth/login');
        }, 10000);
      }
    };

    checkAuth();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      {/* Logo */}
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
          shadowColor: '#E8711A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Ionicons name="eye" size={36} color="#E8711A" />
      </View>

      <ActivityIndicator color="#E8711A" size="large" />

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: '600' }}>Signing you in...</Text>
        <Text style={{ fontSize: 14, color: '#8E8E93' }}>Just a moment</Text>
      </View>
    </View>
  );
}
