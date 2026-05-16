// Supabase Edge Function: ai-coaching
// Generates personalized daily AI coaching for field tradespeople

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { trade, streakDays, tasksCompletedToday, totalXp, level, recentErrors } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) return new Response(JSON.stringify({ error: 'OpenAI key not configured' }), { status: 500, headers: corsHeaders });

    const prompt = `You are a master tradesperson and personal AI coach for a ${trade ?? 'general'} worker.

Today's context:
- Current streak: ${streakDays ?? 0} days
- Tasks completed today: ${tasksCompletedToday ?? 0}
- Total XP: ${totalXp ?? 0} (Level ${level ?? 1})
- Recent skill areas needing work: ${recentErrors?.join(', ') || 'none noted'}

Generate a personalized daily briefing. Respond ONLY with this JSON:
{
  "greeting": "Brief motivational greeting (10-15 words, reference their streak or progress)",
  "focusTip": "One specific technical tip for ${trade ?? 'their trade'} they should focus on today (1-2 sentences)",
  "safetyReminder": "One critical safety reminder relevant to ${trade ?? 'construction'} (1 sentence)",
  "challengeOfDay": "A specific skill challenge they should try today (1 sentence)",
  "xpOpportunity": "How they can earn XP today (mention a specific task type)",
  "motivationalQuote": "A short inspiring quote from a master craftsperson"
}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!openaiRes.ok) {
      return new Response(JSON.stringify({ error: 'OpenAI error' }), { status: 502, headers: corsHeaders });
    }

    const data = await openaiRes.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        greeting: `Keep up the streak, ${trade ?? 'tradesperson'}!`,
        focusTip: 'Focus on precision and code compliance in every task today.',
        safetyReminder: 'Always wear appropriate PPE before starting any work.',
        challengeOfDay: 'Complete one task with zero AI flags for a quality bonus.',
        xpOpportunity: 'Earn double XP by completing 3 tasks before noon.',
        motivationalQuote: '"The expert in anything was once a beginner." — Helen Hayes',
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
