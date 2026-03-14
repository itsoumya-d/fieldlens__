// Supabase Edge Function: send-notifications
// Sends push notifications to FieldLens users via Expo Push API
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface NotificationPayload {
  userId: string;
  type: 'job-assigned' | 'report-ready' | 'safety-alert' | 'photo-sync' | 'work-order-update' | 'crew-checkin';
  data?: Record<string, string>;
}

const NOTIFICATION_TEMPLATES: Record<NotificationPayload['type'], (data?: Record<string, string>) => { title: string; body: string }> = {
  'job-assigned': (d) => ({
    title: '📋 New Job Assigned',
    body: d?.jobTitle ? `You've been assigned: ${d.jobTitle}` : 'A new job has been assigned to you.',
  }),
  'report-ready': (d) => ({
    title: '📊 Report Ready',
    body: d?.reportName ? `${d.reportName} is ready to view` : 'Your field report is ready.',
  }),
  'safety-alert': (d) => ({
    title: '⚠️ Safety Alert',
    body: d?.message ?? 'A safety issue has been flagged on your job site.',
  }),
  'photo-sync': (_d) => ({
    title: '📸 Photos Synced',
    body: 'Your offline photos have been synced successfully.',
  }),
  'work-order-update': (d) => ({
    title: '🔧 Work Order Updated',
    body: d?.status ? `Work order status: ${d.status}` : 'A work order has been updated.',
  }),
  'crew-checkin': (d) => ({
    title: '👷 Crew Check-In',
    body: d?.workerName ? `${d.workerName} has checked in on site` : 'A crew member has checked in.',
  }),
};

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload: NotificationPayload = await req.json();
    const { userId, type, data } = payload;

    // Get push token
    const { data: profile } = await supabase
      .from('profiles')
      .select('expo_push_token, push_notifications_enabled')
      .eq('id', userId)
      .single();

    if (!profile?.expo_push_token || !profile.push_notifications_enabled) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const template = NOTIFICATION_TEMPLATES[type](data);

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.expo_push_token,
        title: template.title,
        body: template.body,
        data: { screen: getScreenForType(type), ...data },
        sound: 'default',
        badge: 1,
      }),
    });

    const result = await response.json();
    const status = result.data?.status === 'ok' ? 'sent' : 'failed';

    await supabase.from('push_notifications_log').insert({
      user_id: userId,
      notification_type: type,
      title: template.title,
      body: template.body,
      data: data ?? {},
      status,
    });

    return new Response(JSON.stringify({ success: true, status }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});

function getScreenForType(type: NotificationPayload['type']): string {
  const screens: Record<NotificationPayload['type'], string> = {
    'job-assigned': '/(tabs)/',
    'report-ready': '/(tabs)/reports',
    'safety-alert': '/(tabs)/',
    'photo-sync': '/(tabs)/photos',
    'work-order-update': '/(tabs)/',
    'crew-checkin': '/(tabs)/',
  };
  return screens[type];
}
