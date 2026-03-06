import { create } from 'zustand';

interface TaskSession {
  id: string;
  taskId: string;
  taskTitle: string;
  currentStep: number;
  totalSteps: number;
  startedAt: Date;
}

interface AppStore {
  activeSession: TaskSession | null;
  analysisCount: number;
  dailyLimit: number;
  setActiveSession: (session: TaskSession | null) => void;
  incrementAnalysis: () => void;
  resetDailyCount: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeSession: null,
  analysisCount: 0,
  dailyLimit: 3,
  setActiveSession: (activeSession) => set({ activeSession }),
  incrementAnalysis: () => set((s) => ({ analysisCount: s.analysisCount + 1 })),
  resetDailyCount: () => set({ analysisCount: 0 }),
}));
