import { supabase } from './supabase';

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'fieldlens://auth/callback',
    },
  });
  return { data, error };
}

export async function signInWithApple() {
  try {
    // Apple authentication requires expo-apple-authentication
    // In a real build this would use AppleAuthentication.signInAsync
    // For now we use the supabase OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'fieldlens://auth/callback',
      },
    });
    return { data, error };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return { data: null, error: null };
    }
    return { data: null, error: e };
  }
}

export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'fieldlens://auth/callback' },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
