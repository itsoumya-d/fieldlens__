import { create } from 'zustand';

interface TaskSession {
  id: string;
  taskId: string;
  taskTitle: string;
  trade?: string;
  currentStep: number;
  totalSteps: number;
  startedAt: Date;
}

interface TimerState {
  activeEntryId: string | null;
  isTimerRunning: boolean;
}

interface AppStore {
  activeSession: TaskSession | null;
  analysisCount: number;
  dailyLimit: number;
  timer: TimerState;
  setActiveSession: (session: TaskSession | null) => void;
  incrementAnalysis: () => void;
  resetDailyCount: () => void;
  setTimer: (timer: Partial<TimerState>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeSession: null,
  analysisCount: 0,
  dailyLimit: 3,
  timer: { activeEntryId: null, isTimerRunning: false },
  setActiveSession: (activeSession) => set({ activeSession }),
  incrementAnalysis: () => set((s) => ({ analysisCount: s.analysisCount + 1 })),
  resetDailyCount: () => set({ analysisCount: 0 }),
  setTimer: (partial) => set((s) => ({ timer: { ...s.timer, ...partial } })),
}));
