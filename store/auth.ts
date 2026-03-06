import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

interface AuthStore {
  session: Session | null;
  user: User | null;
  loading: boolean;
  trade: string | null;
  experienceLevel: string | null;
  onboardingComplete: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setTrade: (trade: string) => void;
  setExperienceLevel: (level: string) => void;
  setOnboardingComplete: (complete: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  loading: true,
  trade: null,
  experienceLevel: null,
  onboardingComplete: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setTrade: (trade) => set({ trade }),
  setExperienceLevel: (experienceLevel) => set({ experienceLevel }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
}));
