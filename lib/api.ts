import { supabase } from './supabase';

// ─── Trade-specific AI prompt builders ───────────────────────────────────────

const TRADE_PROMPTS: Record<string, string> = {
  plumbing: `You are a master plumber and licensed inspector with 20+ years of experience in residential and commercial plumbing.
Analyze this plumbing image for code compliance and quality.
Check: pipe sizing, proper slope (1/4" per foot for drains), solvent cement application, support hangers, trap arm lengths,
vent stack connections, water hammer arrestors, shut-off valve placement, backflow prevention, and proper materials per IPC/UPC.
Flag any violations of International Plumbing Code (IPC) or Uniform Plumbing Code (UPC).`,

  electrical: `You are a licensed master electrician and NEC code inspector with expertise in both residential and commercial work.
Analyze this electrical image for code compliance and safety.
Check: wire gauge vs. breaker ampacity, proper conduit bending, connector types, box fill calculations, grounding/bonding,
arc-fault/GFCI protection requirements, wire color coding, junction box covers, anti-oxidant compound on aluminum,
dedicated circuits for high-draw appliances, and proper labeling per NEC 2023.
Flag any National Electrical Code (NEC) violations with specific article references.`,

  hvac: `You are a certified HVAC engineer and NATE-certified technician with expertise in residential and light commercial systems.
Analyze this HVAC image for quality, efficiency, and code compliance.
Check: refrigerant line sizing and insulation, duct sizing and sealing (Mastic vs tape), static pressure,
equipment clearances, drain line slope and trap, electrical disconnect, filter access, combustion air requirements,
flue sizing and pitch, condensate management, and refrigerant charge indicators.
Flag ACCA Manual J/D/S violations and ASHRAE standard deviations.`,

  carpentry: `You are a master carpenter and building inspector with expertise in residential framing and finish work.
Analyze this carpentry image for structural integrity and building code compliance.
Check: stud spacing (16" or 24" o.c.), header sizing, joist spans, blocking requirements, connection hardware (Simpson),
fastener patterns, sheathing thickness and nailing, moisture barrier installation, squareness/plumb/level,
and proper flashing at penetrations.
Flag IRC (International Residential Code) violations.`,

  concrete: `You are a certified concrete and masonry inspector with expertise in structural and flatwork concrete.
Analyze this concrete image for proper installation and code compliance.
Check: form alignment and bracing, rebar sizing, spacing and cover (min 3" from edges),
consolidation/vibration signs, finish quality, control joint placement, curing membrane application,
slab thickness, vapor barrier installation, and aggregate exposure.
Flag ACI 318 and IBC concrete violations.`,

  general: `You are an expert construction inspector and AI coach with broad knowledge across all trades.
Analyze this work-in-progress image for quality and safety issues.
Check: general workmanship quality, safety hazards, material suitability, code compliance indicators,
tool and equipment usage, PPE compliance, and professional installation standards.`,
};

const BASE_RESPONSE_FORMAT = `
Respond ONLY with this JSON:
{
  "result": "correct" | "warning" | "error" | "unclear",
  "message": "One-line summary (max 10 words)",
  "details": ["Specific finding 1", "Specific finding 2", "Specific finding 3"],
  "codeReference": "Specific code section (e.g. NEC 210.8, IPC 712.3) or null",
  "recommendation": "Concrete next step for the tradesperson"
}`;

// GPT-4o Vision analysis via Supabase Edge Function
export async function analyzeImage(userId: string, imageBase64: string, trade: string = 'general') {
  const tradePrompt = TRADE_PROMPTS[trade] ?? TRADE_PROMPTS.general;
  const prompt = tradePrompt + BASE_RESPONSE_FORMAT;

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
  return supabase.from('tasks').select('*').eq('trade', trade).order('difficulty_order').limit(50);
}

export async function getUserProgress(userId: string) {
  return supabase.from('progress_entries').select('*, tasks(name, trade)').eq('user_id', userId).order('completed_at', { ascending: false }).limit(50);
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
  return supabase.from('certifications').select('*').eq('user_id', userId).order('earned_at', { ascending: false }).limit(50);
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
    .order('started_at', { ascending: false }).limit(50);
}

export async function getTodayTimeEntries(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return supabase
    .from('time_entries')
    .select('*, tasks(name, trade)')
    .eq('user_id', userId)
    .gte('started_at', today.toISOString())
    .order('started_at', { ascending: true }).limit(50);
}

// ── XP, Achievements & Streaks ────────────────────────────────

export interface UserXP {
  user_id: string;
  total_xp: number;
  level: number;
  streak_days: number;
  longest_streak: number;
  last_active_date: string | null;
}

export interface AchievementRow {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  xp_reward: number;
  threshold: number;
}

export interface UserAchievementRow {
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}

export async function getUserXP(userId: string) {
  return supabase.from('user_xp').select('*').eq('user_id', userId).maybeSingle();
}

export async function getAllAchievements() {
  return supabase.from('achievements').select('*').order('xp_reward').limit(50);
}

export async function getUserUnlockedAchievements(userId: string) {
  return supabase.from('user_achievements').select('achievement_key, unlocked_at').eq('user_id', userId);
}

export async function recordDailyActivity(userId: string) {
  return supabase.rpc('record_daily_activity', { p_user_id: userId });
}

export async function addUserXP(userId: string, xp: number) {
  return supabase.rpc('add_user_xp', { p_user_id: userId, p_xp: xp });
}

export async function unlockAchievement(userId: string, achievementKey: string) {
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('achievement_key')
    .eq('user_id', userId)
    .eq('achievement_key', achievementKey)
    .maybeSingle();
  if (existing) return { data: null, error: null }; // already unlocked
  return supabase.from('user_achievements').insert({ user_id: userId, achievement_key: achievementKey });
}

// ── Task Guides & Bookmarks ────────────────────────────────────

export interface TaskGuideRow {
  id: string;
  title: string;
  description: string;
  trade: string;
  category: string;
  difficulty: string;
  estimated_minutes: number;
  step_count: number;
  is_premium: boolean;
  steps: Array<{ order: number; title: string; description: string; tip?: string; warning?: string }>;
  tools_required: string[];
  materials: string[];
  code_reference: string | null;
}

export async function getGuides(category?: string, trade?: string, from = 0, to = 19) {
  let query = supabase.from('task_guides').select('*').order('difficulty', { ascending: true }).range(from, to);
  if (category && category !== 'All') query = query.eq('category', category);
  if (trade) query = query.eq('trade', trade);
  return query;
}

export async function searchGuides(query: string, category?: string, from = 0, to = 19) {
  let q = supabase
    .from('task_guides')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('difficulty', { ascending: true }).range(from, to);
  if (category && category !== 'All') q = q.eq('category', category);
  return q;
}

export async function getUserBookmarkedGuides(userId: string) {
  return supabase
    .from('guide_bookmarks')
    .select('guide_id')
    .eq('user_id', userId);
}

export async function toggleGuideBookmark(userId: string, guideId: string, isCurrentlyBookmarked: boolean) {
  if (isCurrentlyBookmarked) {
    return supabase.from('guide_bookmarks').delete().eq('user_id', userId).eq('guide_id', guideId);
  }
  return supabase.from('guide_bookmarks').insert({ user_id: userId, guide_id: guideId });
}

// ── Time Tracking ──────────────────────────────────────────────

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

// ── AI Daily Briefing / Coaching ──────────────────────────────

export interface AIDailyBriefing {
  greeting: string;
  focusTip: string;
  safetyReminder: string;
  challengeOfDay: string;
  xpOpportunity: string;
  motivationalQuote: string;
}

export async function getAIDailyBriefing(params: {
  trade: string;
  streakDays: number;
  tasksCompletedToday: number;
  totalXp: number;
  level: number;
  recentErrors?: string[];
}): Promise<AIDailyBriefing | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-coaching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
