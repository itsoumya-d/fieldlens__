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

// ── Time Tracking ──────────────────────────────────────────────

export async function startTimeEntry(userId: string, taskId?: string, jobId?: string) {
  return supabase.from('time_entries').insert({
    user_id: userId,
    task_id: taskId ?? null,
    job_id: jobId ?? null,
    started_at: new Date().toISOString(),
  }).select().single();
}

export async function stopTimeEntry(entryId: string) {
  return supabase
    .from('time_entries')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', entryId)
    .select()
    .single();
}

export async function getActiveTimeEntry(userId: string) {
  return supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function getWeeklyTimeEntries(userId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', weekAgo.toISOString())
    .order('started_at', { ascending: false });
}

export async function getTodayTotal(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('time_entries')
    .select('started_at, ended_at, break_minutes')
    .eq('user_id', userId)
    .gte('started_at', startOfDay.toISOString());

  if (error || !data) return 0;

  let totalSeconds = 0;
  const now = new Date();
  for (const entry of data) {
    const start = new Date(entry.started_at);
    const end = entry.ended_at ? new Date(entry.ended_at) : now;
    const breakSec = (entry.break_minutes ?? 0) * 60;
    totalSeconds += Math.max(0, (end.getTime() - start.getTime()) / 1000 - breakSec);
  }
  return Math.round((totalSeconds / 3600) * 10) / 10; // 1 decimal place
}
