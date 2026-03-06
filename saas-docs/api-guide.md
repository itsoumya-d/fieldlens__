# FieldLens API Guide

**All external APIs with pricing, setup, authentication, error handling, code snippets, and cost projections.**

---

## API Overview

FieldLens integrates with 8 external APIs/services. This guide covers each one comprehensively: what it does, what it costs, how to set it up, how to authenticate, how to handle errors, and code snippets for the most common operations.

| API | Purpose | Cost Model | Critical to MVP |
|-----|---------|-----------|----------------|
| **OpenAI GPT-4o Vision** | Image analysis, error detection, step guidance | Per-token | Yes |
| **OpenAI Whisper** | Voice command transcription | Per-minute | Yes |
| **ElevenLabs TTS** | Text-to-speech voice responses | Per-character | Yes |
| **Supabase** | Database, auth, storage, edge functions | Monthly plan | Yes |
| **RevenueCat** | Subscription management | % of MRR | Yes |
| **Stripe** | Payment processing (future web) | Per-transaction | No (post-MVP) |
| **Algolia** | Search (future scale) | Per-request | No (post-MVP) |
| **Sentry** | Error tracking | Monthly plan | Yes |
| **PostHog** | Product analytics | Per-event | Yes |

---

## 1. OpenAI GPT-4o Vision

### Purpose
Core AI engine for FieldLens. Analyzes camera images of trade work and returns structured assessments including correctness evaluation, error detection, code compliance, and next-step guidance.

### Pricing

| Component | Cost | Notes |
|-----------|------|-------|
| **Input tokens (text + image)** | $2.50 per 1M tokens | System prompt + image tokens + user message |
| **Output tokens** | $10.00 per 1M tokens | AI response (structured JSON) |
| **Image tokens** | ~765 tokens per 512x512 image (low detail) | Using `detail: "low"` reduces cost by 80%+ vs high detail |
| **Image tokens** | ~1,105 tokens per 512x512 tile (high detail) | More accurate but significantly more expensive |

**Cost per FieldLens analysis (optimized):**
- System prompt: ~500 tokens ($0.00125)
- Image (512x512, low detail): ~765 tokens ($0.0019)
- User context: ~100 tokens ($0.00025)
- Output (structured JSON, ~200 tokens): $0.002
- **Total per analysis: ~$0.006-0.01**
- With 40% pre-screening rejection by TFLite: **effective cost ~$0.004-0.006 per camera interaction**

### Setup

1. Create account at https://platform.openai.com/
2. Generate API key at https://platform.openai.com/api-keys
3. Set up billing and usage limits at https://platform.openai.com/account/billing
4. Request Tier 2+ access for higher rate limits (auto-granted after $50+ spend)

### Authentication
```typescript
// Header-based authentication
Authorization: Bearer OPENAI_API_KEY_PLACEHOLDER
```

### Code Snippet: Image Analysis

```typescript
// services/ai.ts
import { encode } from 'base64-arraybuffer';

interface AnalysisResult {
  assessment: 'correct' | 'needs_attention' | 'error' | 'unclear';
  confidence: number;
  message: string;
  errors: Array<{
    type: string;
    severity: 'warning' | 'critical' | 'safety';
    fix: string;
  }>;
  code_references: Array<{
    code: string;
    section: string;
    summary: string;
  }>;
  next_action: string;
  camera_adjustment: string | null;
}

export async function analyzeWorkImage(
  imageBase64: string,
  taskContext: {
    trade: string;
    experienceLevel: string;
    taskTitle: string;
    currentStep: number;
    totalSteps: number;
    stepDescription: string;
    stepDetails: string;
    relevantCodes: string;
    commonErrors: string;
  }
): Promise<AnalysisResult> {
  const systemPrompt = `You are FieldLens, an expert ${taskContext.trade} coach.
You are guiding a ${taskContext.experienceLevel}-level ${taskContext.trade} worker
through: "${taskContext.taskTitle}".

Current step (${taskContext.currentStep}/${taskContext.totalSteps}):
"${taskContext.stepDescription}"

TASK CONTEXT:
${taskContext.stepDetails}

APPLICABLE CODES:
${taskContext.relevantCodes}

KNOWN ERROR PATTERNS:
${taskContext.commonErrors}

Respond ONLY in JSON format:
{
  "assessment": "correct" | "needs_attention" | "error" | "unclear",
  "confidence": 0.0-1.0,
  "message": "spoken feedback (under 3 sentences)",
  "errors": [{"type": "string", "severity": "warning|critical|safety", "fix": "string"}],
  "code_references": [{"code": "string", "section": "string", "summary": "string"}],
  "next_action": "string",
  "camera_adjustment": "string or null"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/webp;base64,${imageBase64}`,
                detail: 'low', // Cost optimization: low detail for most analyses
              },
            },
            {
              type: 'text',
              text: 'Analyze this image of my current work.',
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new OpenAIError(response.status, error);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as AnalysisResult;
}
```

### Error Handling

| Error Code | Cause | FieldLens Response |
|-----------|-------|-------------------|
| 400 | Invalid request (bad image format) | Re-compress image and retry once; if still fails, show "Image could not be processed" |
| 401 | Invalid API key | Log critical error to Sentry; show "Service temporarily unavailable" |
| 429 | Rate limit exceeded | Exponential backoff (1s, 2s, 4s); show "High demand, retrying..." |
| 500 | OpenAI server error | Retry up to 3 times with 2s delay; show "AI temporarily unavailable" |
| 503 | Service overloaded | Retry up to 3 times; if fails, offer text-only guidance from task guide |
| Timeout (> 10s) | Slow response | Cancel and retry once; if still slow, show "Connection too slow for AI analysis" |

### Rate Limits (by Tier)

| Tier | RPM (Requests/min) | TPM (Tokens/min) | Requirement |
|------|--------------------|--------------------|-------------|
| Tier 1 | 500 | 30,000 | Default (new accounts) |
| Tier 2 | 5,000 | 450,000 | $50+ spend |
| Tier 3 | 5,000 | 800,000 | $100+ spend |
| Tier 4 | 10,000 | 2,000,000 | $250+ spend, 30+ days |

### Alternatives
- **Anthropic Claude Vision** (claude-3.5-sonnet): Comparable quality, potentially better instruction following, $3/$15 per 1M tokens
- **Google Gemini 1.5 Pro**: Lower cost ($1.25/$5 per 1M tokens), strong vision capabilities, generous free tier
- **Open-source (LLaVA, CogVLM)**: Free inference on own hardware, but requires GPU infrastructure and lower accuracy

---

## 2. OpenAI Whisper API

### Purpose
Transcribes voice commands from the user. Converts spoken audio (captured via phone microphone) into text that is then parsed into app actions or natural language questions.

### Pricing

| Component | Cost |
|-----------|------|
| **Speech-to-text** | $0.006 per minute of audio |

**Cost per FieldLens voice command:**
- Average command duration: 2-5 seconds
- Cost per command: $0.0002-0.0005
- Negligible cost compared to Vision API

### Setup
Same OpenAI account and API key as GPT-4o Vision. No additional setup required.

### Code Snippet: Voice Transcription

```typescript
// services/voice.ts

export async function transcribeAudio(
  audioUri: string
): Promise<string> {
  const formData = new FormData();

  // React Native file object
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'voice-command.m4a',
  } as any);

  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  formData.append('prompt', 'FieldLens plumbing electrical HVAC pipe wrench PEX copper');
  // Prompt hint helps with trade-specific vocabulary

  const response = await fetch(
    'https://api.openai.com/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new WhisperError(response.status, await response.json());
  }

  const data = await response.json();
  return data.text;
}

// Parse transcribed text into app commands
export function parseVoiceCommand(text: string): {
  type: 'command' | 'question';
  action?: string;
  query?: string;
} {
  const normalized = text.toLowerCase().trim();

  const commands: Record<string, string> = {
    'check this': 'analyze',
    'analyze': 'analyze',
    'next step': 'next_step',
    'previous step': 'previous_step',
    'go back': 'previous_step',
    'what step am i on': 'current_step',
    'what tools do i need': 'tools',
    'read the code': 'code_reference',
    'take a photo': 'capture_photo',
    'i\'m done': 'complete_task',
    'finish': 'complete_task',
    'help': 'help',
  };

  for (const [trigger, action] of Object.entries(commands)) {
    if (normalized.includes(trigger)) {
      return { type: 'command', action };
    }
  }

  // If no command matched, treat as a natural language question
  return { type: 'question', query: text };
}
```

### Error Handling

| Error Code | Cause | FieldLens Response |
|-----------|-------|-------------------|
| 400 | Invalid audio format or empty audio | Show "Didn't catch that. Try again." |
| 413 | Audio file too large (> 25MB) | Trim audio to last 30 seconds and retry |
| 429 | Rate limit | Retry after 1 second |
| Transcription is empty/gibberish | Too much background noise | Show "Too noisy. Try speaking closer to the phone." |

### Alternatives
- **Deepgram**: Lower latency (real-time streaming), $0.0043/min, better for continuous listening
- **AssemblyAI**: $0.00025/second, good noise handling, real-time streaming
- **On-device (Expo Speech)**: Free, no latency, but lower accuracy for trade vocabulary

---

## 3. ElevenLabs TTS

### Purpose
Converts AI text responses into natural-sounding speech for hands-free delivery. The user hears FieldLens speaking through their phone speaker or Bluetooth earpiece while keeping their hands on the work.

### Pricing

| Plan | Monthly Cost | Characters/Month | Per-character Cost | Best For |
|------|-------------|-----------------|-------------------|----------|
| **Free** | $0 | 10,000 | N/A | Testing only |
| **Starter** | $5 | 30,000 | $0.000167 | Early development |
| **Creator** | $22 | 100,000 | $0.000220 | Beta testing |
| **Scale** | $99 | 500,000 | $0.000198 | Production (up to ~5K users) |
| **Business** | $330 | 2,000,000 | $0.000165 | Production (up to ~20K users) |
| **Enterprise** | Custom | Custom | Negotiated | 20K+ users |

**Cost per FieldLens response:**
- Average response: 150-250 characters
- Cost per response (Scale plan): $0.03-0.05
- Average 5 TTS responses per session: $0.15-0.25 per session

### Setup

1. Create account at https://elevenlabs.io/
2. Generate API key at https://elevenlabs.io/app/settings/api-keys
3. Select or clone a voice at https://elevenlabs.io/app/voice-lab
4. Note the voice_id for your selected voices

### Authentication
```
xi-api-key: your_api_key_here
```

### Code Snippet: Text-to-Speech (Streaming)

```typescript
// services/tts.ts
import { Audio } from 'expo-av';

const VOICE_IDS = {
  professional_male: 'pNInz6obpgDQGcFmaJgB',   // "Adam" or custom clone
  professional_female: 'EXAVITQu4vr4xnSDxMaL',  // "Bella" or custom clone
};

export async function speakResponse(
  text: string,
  voicePreference: 'professional_male' | 'professional_female' = 'professional_male'
): Promise<void> {
  const voiceId = VOICE_IDS[voicePreference];

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Lowest latency model
        voice_settings: {
          stability: 0.75,        // Higher = more consistent
          similarity_boost: 0.75, // Higher = more like original voice
          style: 0.0,             // 0 = neutral (no emotional styling)
          use_speaker_boost: true,
        },
        output_format: 'mp3_22050_32', // Good quality, small size
      }),
    }
  );

  if (!response.ok) {
    throw new ElevenLabsError(response.status, await response.json());
  }

  // Convert streaming response to playable audio
  const audioBlob = await response.blob();
  const audioUri = URL.createObjectURL(audioBlob);

  const { sound } = await Audio.Sound.createAsync(
    { uri: audioUri },
    { shouldPlay: true, volume: 1.0 }
  );

  // Clean up after playback
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
    }
  });
}
```

### Error Handling

| Error Code | Cause | FieldLens Response |
|-----------|-------|-------------------|
| 401 | Invalid API key | Fall back to device TTS (lower quality but functional) |
| 422 | Invalid voice_id or text | Fall back to device TTS; log error |
| 429 | Rate limit or quota exceeded | Fall back to device TTS; alert user if persistent |
| Latency > 3s | Slow response | Cancel and use device TTS instead |

### Alternatives
- **OpenAI TTS** (tts-1): $15/1M characters, simpler setup, good quality, lower latency, same API key as Vision/Whisper
- **Google Cloud TTS**: $4/1M characters (standard), $16/1M (WaveNet), excellent quality
- **Amazon Polly**: $4/1M characters, good for high volume
- **On-device TTS (Expo Speech)**: Free, zero latency, but robotic voice quality

---

## 4. Supabase

### Purpose
Full backend-as-a-service: PostgreSQL database, authentication, file storage, edge functions (serverless compute), and realtime subscriptions. Replaces building a custom backend.

### Pricing

| Plan | Monthly Cost | Database | Storage | Edge Functions | Auth MAUs | Best For |
|------|-------------|----------|---------|---------------|-----------|----------|
| **Free** | $0 | 500MB, 2 projects | 1GB | 500K invocations | 50K | Development + early launch |
| **Pro** | $25 | 8GB, unlimited projects | 100GB | 2M invocations | 100K | Up to ~10K users |
| **Team** | $599 | 8GB + add-ons | 100GB + add-ons | 2M + add-ons | 100K | 10K-100K users |
| **Enterprise** | Custom | Custom | Custom | Custom | Custom | 100K+ users |

**Add-on costs (Pro/Team):**
- Additional database compute: $0.01344/hour
- Additional storage: $0.021/GB
- Additional egress: $0.09/GB

### Setup

1. Create project at https://supabase.com/dashboard
2. Note project URL and anon key from Settings > API
3. Install CLI: `npm install -g supabase`
4. Initialize: `supabase init`
5. Link to project: `supabase link --project-ref your-project-ref`

### Authentication
```typescript
// Client-side (anon key - safe to expose)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

// Edge Functions (service role key - server-side only, never expose)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Code Snippet: Core Operations

```typescript
// services/supabase.ts

// --- Authentication ---
export async function signInWithApple(idToken: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: idToken,
  });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

// --- Task Guides ---
export async function searchTaskGuides(
  query: string,
  filters: { trade?: string; category?: string; difficulty?: string }
) {
  let request = supabase
    .from('task_guides')
    .select('id, title, description, trade, category, difficulty, estimated_minutes, steps, is_premium')
    .order('title');

  if (query) {
    request = request.textSearch('search_vector', query, { type: 'websearch' });
  }
  if (filters.trade) {
    request = request.eq('trade', filters.trade);
  }
  if (filters.category) {
    request = request.eq('category', filters.category);
  }
  if (filters.difficulty) {
    request = request.eq('difficulty', filters.difficulty);
  }

  const { data, error } = await request;
  if (error) throw error;
  return data;
}

// --- Task Sessions ---
export async function createTaskSession(guideId: string) {
  const { data, error } = await supabase
    .from('task_sessions')
    .insert({
      guide_id: guideId,
      status: 'in_progress',
      current_step: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskProgress(
  sessionId: string,
  updates: { current_step?: number; ai_interactions?: number; errors_detected?: number }
) {
  const { error } = await supabase
    .from('task_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) throw error;
}

// --- Photo Storage ---
export async function uploadTaskPhoto(
  sessionId: string,
  photoUri: string,
  stepNumber: number
): Promise<string> {
  const fileName = `${sessionId}/${stepNumber}_${Date.now()}.webp`;

  const response = await fetch(photoUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('task-photos')
    .upload(fileName, blob, { contentType: 'image/webp' });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('task-photos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
```

### Error Handling

| Error | Cause | FieldLens Response |
|-------|-------|-------------------|
| PGRST116 | No rows returned | Handle as empty state (normal for new users) |
| 23505 | Unique constraint violation | Show "Already exists" message |
| 42501 | RLS policy violation | Re-authenticate user; if persists, log to Sentry |
| 23503 | Foreign key violation | Data integrity issue; log to Sentry |
| Connection refused | Supabase down | Show cached data; banner: "Offline mode" |
| JWT expired | Token expired | Auto-refresh via Supabase client; if fails, re-auth |

### Alternatives
- **Firebase**: More mature, but vendor lock-in to Google; Firestore is not SQL
- **Appwrite**: Open-source alternative, self-hosted option
- **PocketBase**: Single-binary backend, great for prototyping, limited at scale
- **Custom (Express + PostgreSQL)**: Full control, but 10x more code and infrastructure management

---

## 5. RevenueCat

### Purpose
Manages in-app subscriptions across iOS and Android. Handles the complexity of Apple IAP and Google Play Billing, provides unified subscription state, paywall testing, and analytics.

### Pricing

| Tier | Monthly Cost | Condition |
|------|-------------|-----------|
| **Free** | $0 | Up to $2,500 MRR |
| **Standard** | 1% of tracked revenue | $2,500-$100K MRR |
| **Enterprise** | Custom (< 1%) | $100K+ MRR, negotiated |

**At $1M MRR: ~$10,000/month (1%) or lower with enterprise negotiation**

### Setup

1. Create account at https://app.revenuecat.com/
2. Create a project
3. Configure iOS App Store Connect API key
4. Configure Google Play Service Account
5. Create products and entitlements
6. Install SDK: `npm install react-native-purchases`

### Code Snippet: Subscription Management

```typescript
// services/subscription.ts
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// Initialize RevenueCat
export async function initializeRevenueCat() {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Remove in production

  if (Platform.OS === 'ios') {
    await Purchases.configure({
      apiKey: process.env.EXPO_PUBLIC_REVENUCAT_IOS_KEY!,
    });
  } else {
    await Purchases.configure({
      apiKey: process.env.EXPO_PUBLIC_REVENUCAT_ANDROID_KEY!,
    });
  }
}

// Check subscription status
export async function getSubscriptionStatus(): Promise<{
  tier: 'free' | 'pro' | 'master';
  isActive: boolean;
  expirationDate: string | null;
}> {
  const customerInfo = await Purchases.getCustomerInfo();

  if (customerInfo.entitlements.active['master_access']) {
    return {
      tier: 'master',
      isActive: true,
      expirationDate: customerInfo.entitlements.active['master_access'].expirationDate,
    };
  }

  if (customerInfo.entitlements.active['pro_access']) {
    return {
      tier: 'pro',
      isActive: true,
      expirationDate: customerInfo.entitlements.active['pro_access'].expirationDate,
    };
  }

  return { tier: 'free', isActive: false, expirationDate: null };
}

// Get available packages for paywall
export async function getOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();

  if (!offerings.current) {
    throw new Error('No offerings configured');
  }

  return offerings.current.availablePackages;
}

// Purchase a subscription
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

// Restore purchases (required by Apple)
export async function restorePurchases(): Promise<CustomerInfo> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
}
```

### Error Handling

| Error Code | Cause | FieldLens Response |
|-----------|-------|-------------------|
| 1 | Purchase cancelled by user | No action needed; user chose to cancel |
| 2 | Purchase pending (awaiting approval) | Show "Purchase pending" status |
| 3 | Product not available | Show "Subscription temporarily unavailable" |
| 6 | Receipt already in use | Show "This subscription is already active on another account" |
| 10 | Network error | Retry; purchases are queued by the SDK |
| StoreProblem | App Store/Play Store issue | Show "Store temporarily unavailable. Try again later." |

### Alternatives
- **Adapty**: Similar feature set, 5% fee tier available at lower volumes
- **Qonversion**: Smaller, $0-$99/month plans
- **Custom (Stripe Billing + native IAP)**: No revenue share, but massive engineering effort to handle Apple/Google billing correctly

---

## 6. Stripe

### Purpose
Payment processing for future web-based subscriptions, enterprise invoicing, and one-time purchases. Not needed for MVP (RevenueCat handles mobile payments via native IAP), but planned for web signups and B2B expansion.

### Pricing

| Component | Cost |
|-----------|------|
| **Card payments** | 2.9% + $0.30 per transaction |
| **Invoicing** | 0.4% per paid invoice (first 25 free/month) |
| **Stripe Tax** | 0.5% per transaction |
| **Stripe Billing (subscriptions)** | 0.5% per recurring transaction |

**Example: $29/month Pro subscription via web:**
- Stripe fee: $29 x 2.9% + $0.30 = $1.14
- Billing fee: $29 x 0.5% = $0.15
- **Total Stripe cost: $1.29 per transaction (4.4%)**
- Compare to Apple's 15-30% cut via IAP

### Setup

1. Create account at https://dashboard.stripe.com/
2. Get API keys from Developers > API keys
3. Install: `npm install stripe` (server-side) and `@stripe/stripe-react-native` (mobile)
4. Set up webhook endpoint for subscription events

### Code Snippet: Create Checkout Session (Edge Function)

```typescript
// supabase/functions/create-checkout/index.ts
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { priceId, userId, email } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'https://fieldlens.app/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://fieldlens.app/pricing',
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Alternatives
- **Paddle**: Merchant of record (handles sales tax globally), 5% + $0.50 per transaction
- **Lemon Squeezy**: Merchant of record, 5% + $0.50, simpler than Stripe
- **PayPal**: 2.9% + $0.30, broader consumer reach but less developer-friendly

---

## 7. Algolia

### Purpose
High-performance search for the task guide library at scale. Not needed at MVP (Supabase full-text search is sufficient for 50-200 guides), but becomes important when the library grows to 500+ guides across multiple trades.

### Pricing

| Plan | Monthly Cost | Records | Search Requests | Best For |
|------|-------------|---------|----------------|----------|
| **Free** | $0 | 10,000 | 10,000/month | Development |
| **Build** | $0 | 1,000,000 | 10,000/month | Early production |
| **Grow** | From $0 (usage-based) | Unlimited | $0.50/1,000 requests | Scale |
| **Premium** | Custom | Unlimited | Custom | Enterprise |

**FieldLens at scale (100K users, ~500K searches/month): ~$250/month**

### Setup
1. Create account at https://www.algolia.com/
2. Get Application ID and API keys from Settings > API Keys
3. Install: `npm install algoliasearch`

### Code Snippet: Search Integration

```typescript
// services/search.ts
import algoliasearch from 'algoliasearch';

const client = algoliasearch(
  process.env.EXPO_PUBLIC_ALGOLIA_APP_ID!,
  process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY! // Search-only key (safe for client)
);

const guidesIndex = client.initIndex('task_guides');

export async function searchGuides(query: string, filters?: {
  trade?: string;
  difficulty?: string;
  category?: string;
}) {
  const filterParts: string[] = [];
  if (filters?.trade) filterParts.push(`trade:${filters.trade}`);
  if (filters?.difficulty) filterParts.push(`difficulty:${filters.difficulty}`);
  if (filters?.category) filterParts.push(`category:${filters.category}`);

  const { hits } = await guidesIndex.search(query, {
    filters: filterParts.join(' AND '),
    hitsPerPage: 20,
    attributesToRetrieve: [
      'title', 'description', 'trade', 'category',
      'difficulty', 'estimated_minutes', 'step_count', 'is_premium',
    ],
  });

  return hits;
}
```

### Alternatives
- **Typesense**: Open-source, self-hosted option, similar features, lower cost
- **Meilisearch**: Open-source, excellent developer experience, generous cloud free tier
- **Supabase Full-Text Search**: Already included, no additional cost, sufficient for < 500 records

---

## 8. Sentry

### Purpose
Error tracking, crash reporting, and performance monitoring for the React Native app. Captures JavaScript errors, native crashes, and performance data to identify and fix issues before they affect users.

### Pricing

| Plan | Monthly Cost | Errors/Month | Performance Events | Best For |
|------|-------------|-------------|-------------------|----------|
| **Developer** | $0 | 5,000 | 10,000 | Solo dev, early launch |
| **Team** | $26 | 50,000 | 100,000 | Growing app |
| **Business** | $80 | 100,000 | 250,000 | Production at scale |

### Setup
1. Create account at https://sentry.io/
2. Create a React Native project
3. Install: `npx expo install @sentry/react-native`
4. Configure in app.config.ts with DSN

### Code Snippet: Initialization

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
  enableAutoSessionTracking: true,
  attachScreenshot: true,
  beforeSend(event) {
    // Scrub sensitive data
    if (event.user) {
      delete event.user.email;
    }
    return event;
  },
});

// Wrap root component
export default Sentry.wrap(RootLayout);
```

### Alternatives
- **BugSnag**: React Native support, $59/month starting, simpler UI
- **Datadog**: Full observability platform, higher cost but more comprehensive
- **Instabug**: Mobile-focused, includes user feedback, $249/month starting

---

## 9. PostHog

### Purpose
Product analytics, feature flags, A/B testing, and session replays. Tracks user behavior to understand feature adoption, conversion funnels, and retention. Feature flags enable staged rollouts of new features.

### Pricing

| Plan | Monthly Cost | Events/Month | Best For |
|------|-------------|-------------|----------|
| **Free** | $0 | 1,000,000 | Early stage (sufficient for 10K+ MAU) |
| **Pay-as-you-go** | Usage-based | $0.00031/event after 1M | Scale |

**FieldLens at 30K users (~50 events/user/month = 1.5M events): ~$155/month**

### Setup
1. Create account at https://posthog.com/
2. Get project API key from Settings
3. Install: `npm install posthog-react-native`

### Code Snippet: Event Tracking

```typescript
// utils/analytics.ts
import PostHog from 'posthog-react-native';

const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
  host: 'https://us.i.posthog.com', // or eu.i.posthog.com
});

// Track key events
export const analytics = {
  // Camera analysis
  trackAnalysis(result: {
    assessment: string;
    trade: string;
    taskId?: string;
    stepNumber?: number;
    latencyMs: number;
  }) {
    posthog.capture('ai_analysis_completed', result);
  },

  // Voice command
  trackVoiceCommand(command: string, recognized: boolean) {
    posthog.capture('voice_command', { command, recognized });
  },

  // Task events
  trackTaskStarted(taskId: string, trade: string) {
    posthog.capture('task_started', { taskId, trade });
  },

  trackTaskCompleted(taskId: string, durationMinutes: number, errorsFound: number) {
    posthog.capture('task_completed', { taskId, durationMinutes, errorsFound });
  },

  // Subscription events
  trackPaywallViewed(trigger: string) {
    posthog.capture('paywall_viewed', { trigger });
  },

  trackSubscriptionStarted(tier: string, price: number) {
    posthog.capture('subscription_started', { tier, price });
  },

  // Feature flags
  async isFeatureEnabled(flag: string): Promise<boolean> {
    return posthog.isFeatureEnabled(flag) ?? false;
  },

  // Identify user
  identifyUser(userId: string, properties: Record<string, any>) {
    posthog.identify(userId, properties);
  },
};
```

### Alternatives
- **Mixpanel**: More powerful analytics, $20/month starting, steeper learning curve
- **Amplitude**: Enterprise-grade analytics, free tier available, complex setup
- **June**: Simple B2C analytics, auto-generated reports, $0 (free for < 1K users)

---

## Cost Projection Table

### Monthly Infrastructure Cost by User Count

| Service | 1K Users | 10K Users | 100K Users |
|---------|----------|-----------|------------|
| **OpenAI GPT-4o Vision** | $180 | $1,800 | $14,400 |
| **OpenAI Whisper** | $5 | $50 | $400 |
| **ElevenLabs TTS** | $99 | $330 | $2,500 (enterprise) |
| **Supabase** | $0 (free) | $25 (pro) | $599 (team) |
| **RevenueCat** | $0 (< $2.5K MRR) | $350 (1% of ~$35K MRR) | $10,000 (1% of $1M MRR) |
| **Stripe** | $0 (not yet used) | $0 (not yet used) | $500 (web subs) |
| **Algolia** | $0 (not needed) | $0 (free tier) | $250 |
| **Sentry** | $0 (free) | $26 (team) | $80 (business) |
| **PostHog** | $0 (free) | $0 (free, < 1M events) | $155 |
| **Expo EAS** | $0 (free) | $0 (free) | $99 (production) |
| **Vercel** | $0 (hobby) | $20 (pro) | $20 (pro) |
| **Cloudflare** | $0 (free) | $0 (free) | $20 (pro) |
| **TOTAL** | **$284** | **$2,601** | **$29,023** |

### Assumptions

- **AI analyses per user per month:** 60 (3 per day, 20 active days)
- **Voice commands per user per month:** 100 (5 per day, 20 active days)
- **TTS responses per user per month:** 80 (4 per day, 20 active days, ~200 chars each)
- **TFLite pre-screening reduces API calls by 40%:** Only 60% of camera interactions hit OpenAI
- **ARPU:** $35/month (blended across free, Pro, Master)
- **Conversion rate:** 8% of total users are paying

### Revenue vs. Cost

| Users | Monthly Revenue | Monthly Cost | Gross Margin | Profit |
|-------|----------------|-------------|-------------|--------|
| 1,000 | $2,800 (80 paying) | $284 | 89.9% | $2,516 |
| 10,000 | $28,000 (800 paying) | $2,601 | 90.7% | $25,399 |
| 100,000 | $280,000 (8,000 paying) | $29,023 | 89.6% | $250,977 |
| 285,714 | $1,000,000 (28,572 paying) | ~$75,000 | 92.5% | ~$925,000 |

**Key insight:** FieldLens maintains 89-93% gross margins at every scale point. The AI API costs (the largest variable cost) scale linearly with usage, but the per-user revenue significantly exceeds per-user cost. The TFLite pre-screening is critical for maintaining these margins by eliminating 40% of unnecessary API calls.

---

## API Key Management

### Environment Variables

```bash
# .env.local (never commit to git)

# OpenAI
OPENAI_API_KEY=OPENAI_API_KEY_PLACEHOLDER

# ElevenLabs
ELEVENLABS_API_KEY=xi_xxxxxxxxxxxxxxxxxxxx

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# RevenueCat
EXPO_PUBLIC_REVENUCAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUCAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=STRIPE_LIVE_SECRET_PLACEHOLDER
STRIPE_PUBLISHABLE_KEY=STRIPE_LIVE_PUBLIC_PLACEHOLDER
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# Algolia
EXPO_PUBLIC_ALGOLIA_APP_ID=XXXXXXXXXX
EXPO_PUBLIC_ALGOLIA_SEARCH_KEY=xxxxxxxxxxxxxxxxxxxx  # Search-only key
ALGOLIA_ADMIN_KEY=xxxxxxxxxxxxxxxxxxxx                # Admin key (server only)

# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://xxxx@o1234.ingest.sentry.io/5678

# PostHog
EXPO_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
```

### Security Rules

1. **Never expose server-side keys in the client bundle:** `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `ALGOLIA_ADMIN_KEY` must only be used in Supabase Edge Functions or server-side code
2. **Use `EXPO_PUBLIC_` prefix** for client-safe keys (Supabase anon key, RevenueCat public keys, Algolia search key, Sentry DSN, PostHog key)
3. **Rotate keys** immediately if suspected compromise
4. **Set spending limits** on OpenAI ($100/day initial cap) and monitor daily
5. **Use Supabase RLS** so the anon key cannot access other users' data even if exposed
6. **Add `.env.local` to `.gitignore`** -- enforce via pre-commit hook
