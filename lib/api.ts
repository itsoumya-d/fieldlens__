import { supabase } from './supabase';

// GPT-4o Vision analysis via Supabase Edge Function
export async function analyzeImage(userId: string, imageBase64: string, trade: string = 'general') {
  const prompt = `You are an expert ${trade} trade inspector and AI coach. Analyze this image of work in progress.
Respond ONLY with a JSON object in this exact format:
{
  "result": "correct" | "warning" | "error" | "unclear",
  "message": "One-line summary (max 10 words)",
  "details": ["Detail 1", "Detail 2", "Detail 3"],
  "codeReference": "Relevant code reference or null",
  "recommendation": "Next step recommendation"
}`;

  const { data, error } = await supabase.functions.invoke('analyze-image', {
    body: { imageBase64, prompt, userId, context: `fieldlens-${trade}` },
  });

  if (error) throw error;
  return data as {
    result: 'correct' | 'warning' | 'error' | 'unclear';
    message: string;
    details: string[];
    codeReference: string | null;
    recommendation: string;
  };
}

export async function getAnalysisHistory(userId: string) {
  return supabase
    .from('ai_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
}

export async function getTasks(trade: string) {
  return supabase.from('tasks').select('*').eq('trade', trade).order('difficulty_order');
}

export async function getUserProgress(userId: string) {
  return supabase.from('progress_entries').select('*, tasks(name, trade)').eq('user_id', userId).order('completed_at', { ascending: false });
}

export async function markTaskComplete(taskId: string, userId: string) {
  return supabase.from('progress_entries').insert({ task_id: taskId, user_id: userId, completed_at: new Date().toISOString() });
}

export async function getRecommendedTasks(trade: string, userId: string) {
  return supabase
    .from('tasks')
    .select('*')
    .eq('trade', trade)
    .not('id', 'in', `(select task_id from progress_entries where user_id = '${userId}')`)
    .order('difficulty_order')
    .limit(5);
}

export async function getCertifications(userId: string) {
  return supabase.from('certifications').select('*').eq('user_id', userId).order('earned_at', { ascending: false });
}
