export type Trade = 'plumbing' | 'electrical' | 'hvac' | 'carpentry' | 'other';
export type ExperienceLevel = 'apprentice' | 'journeyman' | 'master';
export type AssessmentResult = 'correct' | 'warning' | 'error' | 'unclear';

export interface TaskGuide {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  stepCount: number;
  isPremium: boolean;
  thumbnailUrl?: string;
  trade: Trade;
}

export interface TaskStep {
  id: string;
  taskId: string;
  stepNumber: number;
  title: string;
  instructions: string;
  imageUrl?: string;
  tools: string[];
  estimatedMinutes: number;
  tips: string[];
  commonMistakes: string[];
  codeReference?: string;
}

export interface AIAssessment {
  result: AssessmentResult;
  message: string;
  details?: string[];
  codeReference?: string;
}

export interface UserProgress {
  tasksCompleted: number;
  errorsCaught: number;
  totalHours: number;
  currentStreak: number;
}
