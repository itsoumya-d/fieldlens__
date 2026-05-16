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
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      return { data: null, error: null };
    }
    return { data: null, error: e as Error };
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

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'fieldlens://auth/reset-password',
  });
}

export async function deleteAccount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Delete all user profile data (cascade handles related tables)
  await supabase.from('profiles').delete().eq('id', user.id);

  // Sign out — full auth.users deletion is handled by a Supabase Edge Function
  const { error } = await supabase.auth.signOut();
  return { error };
}
