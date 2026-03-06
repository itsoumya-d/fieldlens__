# FieldLens Tech Stack

**Architecture, frameworks, AI pipeline, infrastructure, and scalability plan.**

---

## Stack Philosophy

FieldLens is built on the principle of **maximum leverage per engineer**. Every technology choice optimizes for three things: speed to market, real-time AI performance on mobile, and cost efficiency at scale. The stack is designed so a solo developer or small team (2-3 engineers) can ship a production-quality AI coaching app within 4-6 months.

---

## Architecture Overview

```
+------------------------------------------------------------------+
|                        CLIENT (Mobile)                           |
|  +------------------------------------------------------------+ |
|  |  React Native + Expo (iOS & Android)                        | |
|  |  +-----------+  +-------------+  +------------------------+| |
|  |  | Camera    |  | Voice I/O   |  | TensorFlow Lite        || |
|  |  | Module    |  | (Whisper +  |  | (On-device inference    || |
|  |  | (Expo     |  |  ElevenLabs)|  |  for quick detections)  || |
|  |  |  Camera)  |  +-------------+  +------------------------+| |
|  |  +-----------+                                              | |
|  +------------------------------------------------------------+ |
+------------------------------------------------------------------+
              |                    |                    |
              v                    v                    v
+------------------------------------------------------------------+
|                     EDGE / API LAYER                             |
|  +------------------------------------------------------------+ |
|  |  Supabase Edge Functions (Deno)                             | |
|  |  +------------------+  +------------------+                 | |
|  |  | Image Analysis   |  | Voice Processing |                 | |
|  |  | Pipeline         |  | Pipeline         |                 | |
|  |  | (GPT-4o Vision)  |  | (Whisper API)    |                 | |
|  |  +------------------+  +------------------+                 | |
|  |  +------------------+  +------------------+                 | |
|  |  | Task Engine      |  | Compliance       |                 | |
|  |  | (Step tracking,  |  | Engine (Code     |                 | |
|  |  |  guide logic)    |  |  lookups, rules) |                 | |
|  |  +------------------+  +------------------+                 | |
|  +------------------------------------------------------------+ |
+------------------------------------------------------------------+
              |                    |                    |
              v                    v                    v
+------------------------------------------------------------------+
|                     DATA / SERVICES LAYER                        |
|  +---------------+  +----------------+  +--------------------+  |
|  | Supabase      |  | Supabase       |  | Supabase           |  |
|  | PostgreSQL    |  | Storage        |  | Auth               |  |
|  | (Users, tasks,|  | (Photos, docs, |  | (Magic link,       |  |
|  |  progress,    |  |  task images,  |  |  Apple/Google SSO) |  |
|  |  guides)      |  |  voice clips)  |  |                    |  |
|  +---------------+  +----------------+  +--------------------+  |
|  +---------------+  +----------------+  +--------------------+  |
|  | RevenueCat    |  | Stripe         |  | PostHog            |  |
|  | (Subscription |  | (Payment       |  | (Analytics,        |  |
|  |  management)  |  |  processing)   |  |  feature flags)    |  |
|  +---------------+  +----------------+  +--------------------+  |
+------------------------------------------------------------------+
```

---

## Frontend

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|-----------------|
| **React Native** | 0.76+ | Cross-platform mobile framework | Single codebase for iOS + Android; 95% code sharing; massive ecosystem; trade workers use both platforms equally |
| **Expo** | SDK 52+ | Development platform & build service | Managed workflow eliminates native config complexity; EAS Build handles CI/CD; OTA updates for instant patches; camera/audio APIs work out of box |
| **TypeScript** | 5.5+ | Type-safe JavaScript | Catches AI response parsing errors at compile time; better IDE support; essential for complex state like camera pipelines |
| **Expo Router** | v4 | File-based navigation | Deep linking for task sharing; type-safe routes; matches mental model of screen-based app |
| **Zustand** | 5.x | State management | Lightweight (1.1kB); no boilerplate vs Redux; perfect for camera state, user session, task progress |
| **React Query (TanStack)** | 5.x | Server state management | Automatic caching of AI responses; optimistic updates for task progress; offline support via persistQueryClient |
| **Expo Camera** | Latest | Camera access & frame capture | Native performance; frame-by-frame capture for AI analysis; torch/zoom controls for job site conditions |
| **Expo AV** | Latest | Audio recording & playback | Voice command capture for Whisper; TTS audio playback from ElevenLabs; background audio support |
| **React Native Reanimated** | 3.x | Animations | 60fps native-thread animations for camera overlays, AR-style guidance indicators, progress animations |
| **NativeWind** | 4.x | Tailwind CSS for React Native | Rapid UI development; consistent spacing/sizing; dark mode support via class strategy |
| **React Native MMKV** | 3.x | Local key-value storage | 30x faster than AsyncStorage; stores user preferences, cached guides, offline task data |

### Frontend Architecture Pattern

```
src/
  app/                    # Expo Router screens
    (tabs)/               # Tab navigator
      index.tsx           # Home Dashboard
      camera.tsx          # AI Camera Coaching
      library.tsx         # Task Library
      progress.tsx        # Progress Dashboard
    onboarding/           # Onboarding flow
    task/[id].tsx         # Step-by-Step Guide
    docs/[id].tsx         # Photo Documentation
    settings.tsx          # Settings
  components/
    camera/               # Camera overlay, guidance indicators
    ui/                   # Buttons, cards, inputs (themed)
    task/                 # Task cards, step indicators
    voice/                # Voice command indicator, TTS controls
  hooks/
    useCamera.ts          # Camera capture & frame management
    useVoiceCommand.ts    # Whisper integration
    useAIAnalysis.ts      # GPT-4o Vision pipeline
    useTaskProgress.ts    # Progress tracking & persistence
    useSubscription.ts    # RevenueCat subscription state
  services/
    ai.ts                 # OpenAI API wrapper
    voice.ts              # Whisper + ElevenLabs wrapper
    supabase.ts           # Supabase client & helpers
    tflite.ts             # On-device inference wrapper
  stores/
    camera.ts             # Zustand camera state
    user.ts               # Zustand user/auth state
    task.ts               # Zustand active task state
  utils/
    image.ts              # Image compression, cropping
    compliance.ts         # Code lookup helpers
    analytics.ts          # PostHog event tracking
  constants/
    trades.ts             # Trade-specific constants
    codes.ts              # Building code references
    theme.ts              # Design tokens
```

---

## Backend

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|-----------------|
| **Supabase** | Latest | Backend-as-a-Service | PostgreSQL + Auth + Storage + Edge Functions + Realtime in one platform; generous free tier; row-level security eliminates custom auth middleware |
| **Supabase Auth** | Latest | Authentication | Magic link (no passwords for field workers with dirty hands); Apple Sign-In + Google SSO; JWT tokens for API auth |
| **Supabase PostgreSQL** | 15+ | Primary database | JSONB for flexible task/guide schemas; full-text search for task library; pg_cron for scheduled jobs; PostGIS for location-aware features |
| **Supabase Storage** | Latest | File storage | S3-compatible; CDN delivery for task images/videos; automatic image transformations; RLS on buckets |
| **Supabase Edge Functions** | Latest | Serverless compute (Deno) | Sub-50ms cold starts; runs close to users; handles AI API orchestration; no server management |
| **Supabase Realtime** | Latest | WebSocket subscriptions | Live progress sync across devices; real-time task collaboration (future feature) |

### Database Schema (Core Tables)

```sql
-- Users and profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  trade TEXT NOT NULL CHECK (trade IN ('plumbing', 'electrical', 'hvac', 'carpentry', 'general')),
  experience_level TEXT CHECK (experience_level IN ('apprentice', 'journeyman', 'master')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'master')),
  revenucat_id TEXT,
  total_tasks_completed INTEGER DEFAULT 0,
  total_errors_caught INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task guides library
CREATE TABLE task_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER,
  steps JSONB NOT NULL, -- Array of step objects
  code_references JSONB, -- Applicable building codes
  common_errors JSONB, -- Known error patterns for AI detection
  tools_required TEXT[],
  is_premium BOOLEAN DEFAULT false,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User task sessions
CREATE TABLE task_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES task_guides(id),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_step INTEGER DEFAULT 1,
  ai_interactions INTEGER DEFAULT 0,
  errors_detected INTEGER DEFAULT 0,
  errors_corrected INTEGER DEFAULT 0,
  photos JSONB DEFAULT '[]', -- Array of photo URLs with metadata
  voice_notes JSONB DEFAULT '[]',
  ai_feedback_log JSONB DEFAULT '[]', -- Full AI conversation history
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Photo documentation
CREATE TABLE task_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES task_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  step_number INTEGER,
  ai_analysis JSONB, -- GPT-4o Vision analysis result
  annotations JSONB, -- User or AI annotations
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance code database
CREATE TABLE compliance_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade TEXT NOT NULL,
  jurisdiction TEXT NOT NULL, -- e.g., 'IPC_2021', 'NEC_2023', 'IMC_2021'
  code_section TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB,
  search_vector TSVECTOR,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## AI Pipeline

| Technology | Purpose | Latency Target | Cost per Request |
|------------|---------|----------------|-----------------|
| **OpenAI GPT-4o Vision** | Real-time image analysis, error detection, step guidance | < 3 seconds | ~$0.01-0.03 per analysis (compressed image + short prompt) |
| **OpenAI Whisper API** | Voice command transcription | < 1.5 seconds | $0.006/minute of audio |
| **ElevenLabs TTS** | Natural voice responses for hands-free coaching | < 1 second (streaming) | $0.18 per 1,000 characters (Scale plan) |
| **TensorFlow Lite** | On-device pre-screening (tool detection, scene classification) | < 200ms | Free (on-device) |

### AI Analysis Pipeline Flow

```
User Points Camera at Work
        |
        v
[1] TFLite On-Device Pre-Screen (< 200ms)
    - Is this a valid work scene? (vs. random object, face, etc.)
    - Basic tool/material classification
    - Scene lighting quality check
    - If invalid scene -> show helpful prompt, skip API call (saves cost)
        |
        v (valid scene)
[2] Image Optimization
    - Compress to 512x512 or 1024x1024 (depending on detail needed)
    - Auto-adjust brightness/contrast for job site lighting
    - Convert to WebP (60% smaller than JPEG)
    - Target: < 100KB per frame sent to API
        |
        v
[3] GPT-4o Vision Analysis (< 3 seconds)
    - System prompt includes: active task guide, current step, user trade/level
    - Structured JSON response: {assessment, errors[], suggestions[], nextStep, codeReferences[]}
    - Temperature: 0.3 (consistency over creativity)
    - Max tokens: 500 (concise, actionable responses)
        |
        v
[4] Response Processing
    - Parse structured response
    - Match errors against known patterns in task_guides.common_errors
    - Look up relevant compliance codes
    - Generate voice response text
        |
        v
[5] ElevenLabs TTS (streaming, < 1 second to first audio)
    - Convert text response to speech
    - Stream audio to user's phone speaker / bluetooth earpiece
    - Voice: Professional, calm, instructional tone
        |
        v
[6] UI Update
    - Display visual overlay on camera feed
    - Show error indicators (red) or success indicators (green)
    - Update step progress
    - Log interaction for analytics
```

### TensorFlow Lite Models (On-Device)

| Model | Size | Purpose | Training Data |
|-------|------|---------|---------------|
| **Scene Classifier** | ~5MB | Determine if camera is pointing at a valid work scene | 10,000+ job site images vs. random scenes |
| **Tool Detector** | ~8MB | Identify common tools in frame (pipe wrench, multimeter, etc.) | COCO-derived + custom tool dataset |
| **Safety Hazard Detector** | ~6MB | Flag obvious safety issues (no gloves near electrical, water near live circuits) | Custom safety violation dataset |
| **Quality Gate** | ~3MB | Assess image quality (blur, lighting, angle) before sending to API | Synthetic + real low-quality images |

Total on-device model size: ~22MB (acceptable for mobile app bundle)

### Prompt Engineering Strategy

```
SYSTEM PROMPT TEMPLATE (for GPT-4o Vision):

You are FieldLens, an expert {trade} coach. You are guiding a
{experience_level}-level {trade} worker through: "{task_title}".

Current step ({current_step}/{total_steps}): "{step_description}"

TASK CONTEXT:
{step_details_and_requirements}

APPLICABLE CODES:
{relevant_compliance_codes}

KNOWN ERROR PATTERNS FOR THIS STEP:
{common_errors_for_step}

INSTRUCTIONS:
1. Analyze the image to determine if the current step is being
   performed correctly
2. If you detect errors, clearly state what is wrong and how to fix it
3. Reference specific code requirements when relevant
4. If the step looks complete and correct, confirm and describe what
   the next step should be
5. Keep responses under 3 sentences for voice readability
6. Use trade-appropriate terminology but explain complex concepts
7. If you cannot clearly see the work area, ask the user to adjust
   their camera angle

Respond in JSON format:
{
  "assessment": "correct" | "needs_attention" | "error" | "unclear",
  "confidence": 0.0-1.0,
  "message": "spoken feedback for the user",
  "errors": [{"type": "string", "severity": "warning|critical", "fix": "string"}],
  "code_references": [{"code": "string", "section": "string", "summary": "string"}],
  "next_action": "string",
  "camera_adjustment": "string or null"
}
```

---

## Payments

| Technology | Purpose | Pricing | Why This Choice |
|------------|---------|---------|-----------------|
| **RevenueCat** | Subscription management | Free up to $2,500 MRR; 1% over $2,500 MRR; enterprise custom | Handles Apple/Google IAP complexity; built-in paywall A/B testing; subscription analytics; webhooks for entitlement sync |
| **Stripe** | Payment processing (web signups, enterprise) | 2.9% + $0.30 per transaction | Industry standard; handles invoicing for future B2B; tax calculation; revenue recognition |

### Payment Architecture

```
Mobile (iOS/Android)               Web (Future)
    |                                   |
    v                                   v
[RevenueCat SDK]                   [Stripe Checkout]
    |                                   |
    v                                   v
[Apple IAP / Google Play Billing]  [Stripe Processing]
    |                                   |
    +-----------------------------------+
    |
    v
[RevenueCat Webhook -> Supabase Edge Function]
    |
    v
[Update profiles.subscription_tier]
    |
    v
[PostHog: track subscription event]
```

### Subscription Tiers (RevenueCat Products)

| Product ID | Platform | Price | Entitlements |
|-----------|----------|-------|-------------|
| `fieldlens_free` | Both | $0 | `basic_camera`, `limited_tasks` (3/day) |
| `fieldlens_pro_monthly` | Both | $29/mo | `unlimited_camera`, `all_plumbing_tasks`, `photo_docs`, `progress_tracking` |
| `fieldlens_pro_annual` | Both | $249/yr | Same as Pro monthly (28% savings) |
| `fieldlens_master_monthly` | Both | $49/mo | `all_trades`, `offline_mode`, `priority_ai`, `certifications`, `code_library` |
| `fieldlens_master_annual` | Both | $419/yr | Same as Master monthly (29% savings) |

---

## Infrastructure

| Technology | Purpose | Cost (Starting) | Why This Choice |
|------------|---------|-----------------|-----------------|
| **Expo EAS** | Build & submit to app stores | $0 (free tier: 30 builds/mo) | Managed builds eliminate Xcode/Android Studio CI setup; OTA updates for instant bug fixes; zero native build config |
| **Vercel** | Marketing website + API routes (if needed beyond Supabase) | $0 (Hobby) -> $20/mo (Pro) | Edge-first; instant deployments; perfect for landing page + blog + docs |
| **Sentry** | Error tracking & performance monitoring | $0 (free: 5K errors/mo) -> $26/mo | React Native SDK with source maps; crash reporting; performance tracing; real-time alerts |
| **PostHog** | Product analytics + feature flags | $0 (free: 1M events/mo) -> usage-based | Self-serve analytics; session replays; A/B testing; feature flags for staged rollouts; EU hosting option |
| **Expo Updates (OTA)** | Over-the-air JS bundle updates | Included with EAS | Push bug fixes without app store review; critical for fast iteration; rollback capability |
| **Cloudflare** | CDN + DNS + DDoS protection (for web assets) | $0 (free tier) | Global CDN for task guide images/videos; DNS management; SSL |
| **GitHub Actions** | CI/CD pipeline | $0 (2,000 min/mo free) | Lint + test on PR; trigger EAS builds; automated deployments |

### CI/CD Pipeline

```
Developer pushes to GitHub
        |
        v
[GitHub Actions: Lint + TypeScript Check + Unit Tests]
        |
        v (on merge to main)
[GitHub Actions: Integration Tests]
        |
        v
[EAS Build: iOS + Android builds]
        |
        v (on release tag)
[EAS Submit: App Store + Google Play]
        |
        v (for hotfixes)
[EAS Update: OTA JavaScript bundle update]
```

---

## Monitoring & Observability

| Layer | Tool | What It Tracks |
|-------|------|---------------|
| **Crashes** | Sentry | JavaScript errors, native crashes, ANRs |
| **Performance** | Sentry Performance | Screen load times, API latency, camera frame rates |
| **AI Quality** | Custom (Supabase + PostHog) | GPT-4o response accuracy, user corrections, confidence scores |
| **User Behavior** | PostHog | Feature adoption, funnel analysis, retention curves |
| **Subscriptions** | RevenueCat Dashboard | MRR, churn, trial conversion, cohort analysis |
| **Infrastructure** | Supabase Dashboard | Database size, Edge Function invocations, storage usage |
| **Uptime** | BetterStack (free tier) | API endpoint monitoring, alerting |

---

## Future-Proofing Strategy

### Technology Migration Paths

| Current | Future Trigger | Migration Target | Effort |
|---------|---------------|-----------------|--------|
| Supabase Edge Functions | > 50M invocations/mo or need GPU compute | AWS Lambda + API Gateway or Fly.io | Medium (2-3 weeks) |
| Supabase PostgreSQL | > 500GB or need advanced scaling | AWS RDS or PlanetScale | Medium (1-2 weeks with pgdump) |
| Supabase Storage | > 100TB or need video processing | AWS S3 + CloudFront | Low (S3-compatible API) |
| OpenAI GPT-4o | Cost optimization or latency needs | Claude Vision, Gemini, or fine-tuned open-source (LLaMA) | Medium (swap API layer) |
| ElevenLabs TTS | Cost at scale | OpenAI TTS, or on-device TTS (lower quality) | Low (swap TTS service layer) |
| TensorFlow Lite | Need more complex on-device models | CoreML (iOS) + NNAPI (Android) via ONNX | High (platform-specific) |
| RevenueCat | > $100K MRR (1% fee becomes significant) | Custom subscription management with Stripe Billing | High (3-4 weeks) |
| Expo Managed | Need custom native modules not supported by Expo | Expo Bare Workflow or pure React Native CLI | Medium (2-3 weeks) |

### AI Model Strategy

**Short-term (Months 1-12):**
- GPT-4o Vision for all image analysis
- Conservative prompting with structured JSON responses
- On-device TFLite for pre-screening only

**Medium-term (Months 12-24):**
- Fine-tune GPT-4o on accumulated trade-specific data (thousands of labeled job photos)
- Expand TFLite models with custom-trained error detection
- Evaluate multimodal models from Anthropic (Claude) and Google (Gemini) for cost/quality

**Long-term (Months 24-36):**
- Train proprietary vision models on FieldLens dataset (competitive moat)
- On-device models handle 60%+ of analysis (massive cost reduction)
- Cloud AI reserved for complex/ambiguous cases only

---

## Scalability Plan

### 10x Scale (30K -> 300K users)

| Component | Current | Scaled | Action Required |
|-----------|---------|--------|-----------------|
| Supabase DB | Free/Pro ($25/mo) | Pro ($25/mo) -> Team ($599/mo) | Upgrade plan; add read replicas; optimize indexes |
| Supabase Edge Functions | Standard concurrency | Higher concurrency limits | Upgrade plan; implement request queuing |
| OpenAI API | Tier 2 rate limits | Tier 4 rate limits | Request limit increase; implement request batching |
| ElevenLabs | Scale ($99/mo) | Enterprise (custom) | Negotiate enterprise pricing; implement TTS caching |
| RevenueCat | 1% fee | 1% fee (negotiate at volume) | Evaluate cost vs. building custom |
| CDN / Storage | Supabase Storage | Supabase Storage + Cloudflare CDN | Add CDN layer for static assets |

**Estimated monthly infrastructure cost at 300K users: $15,000-25,000**

### 100x Scale (30K -> 3M users)

| Component | Action Required |
|-----------|-----------------|
| Database | Migrate to managed PostgreSQL (AWS RDS or Neon) with read replicas; implement connection pooling (PgBouncer) |
| Compute | Move AI orchestration to dedicated serverless (AWS Lambda or Fly.io) with auto-scaling |
| AI | Negotiate enterprise contracts with OpenAI; deploy fine-tuned models on dedicated instances; shift 40%+ analysis to on-device |
| Storage | AWS S3 with CloudFront CDN; implement image lifecycle policies |
| Search | Algolia or Typesense for task library search at scale |
| Caching | Redis (Upstash) for AI response caching, session data, rate limiting |
| Observability | DataDog or Grafana Cloud for full-stack monitoring |

**Estimated monthly infrastructure cost at 3M users: $80,000-150,000**

### 1000x Scale (30K -> 30M users)

| Component | Action Required |
|-----------|-----------------|
| Architecture | Microservices decomposition; separate AI pipeline, user service, content service |
| Database | Distributed PostgreSQL (CockroachDB or Citus); per-region deployments |
| AI | Proprietary models on dedicated GPU clusters (AWS SageMaker or Modal); on-device handles 70%+ of analysis |
| Global | Multi-region deployment; edge computing for latency-sensitive camera analysis |
| Team | Dedicated infrastructure team (3-5 engineers); SRE practices |
| Compliance | SOC 2 Type II; per-region data residency; enterprise security audit |

**Estimated monthly infrastructure cost at 30M users: $500,000-1,000,000**

---

## Why This Is the Most Profitable Stack

### 1. Near-Zero Infrastructure Cost at Launch
- Supabase free tier: $0
- Expo free tier: $0 (30 builds/month)
- Sentry free tier: $0
- PostHog free tier: $0
- RevenueCat free tier: $0 (up to $2,500 MRR)
- **Total fixed infrastructure cost at launch: $0/month**
- Variable cost: Only AI API calls (pay-per-use, scales with revenue)

### 2. Revenue Before Cost
- Users pay $29-49/month
- Average AI cost per user per month: $3-5 (with TFLite pre-screening reducing API calls by 40%)
- **Gross margin: 85-90%** from day one

### 3. Single Developer Velocity
- React Native + Expo: Ship to both platforms from one codebase
- Supabase: No backend code for auth, database, storage, or real-time
- TypeScript end-to-end: Same language, same types, client to server
- **One developer can ship MVP in 3-4 months**

### 4. No Vendor Lock-In at Critical Layers
- Supabase is open-source PostgreSQL underneath (can self-host or migrate)
- OpenAI API can be swapped for any vision model (Anthropic, Google, open-source)
- RevenueCat abstracts Apple/Google IAP (can replace with Stripe Billing for web)
- React Native can eject to bare workflow if needed

### 5. AI Cost Optimization Built-In
- TFLite pre-screening eliminates 30-40% of unnecessary API calls
- Image compression reduces token costs by 50-60%
- Response caching for repeated task steps saves 20-30% of API calls
- **Effective AI cost per analysis: $0.005-0.015** (vs. raw $0.01-0.03)

---

## Development Environment Setup

### Prerequisites
```bash
node >= 20.0.0
npm >= 10.0.0
# or
bun >= 1.1.0 (recommended for speed)
```

### Quick Start
```bash
# Clone and install
git clone https://github.com/fieldlens/fieldlens-app.git
cd fieldlens-app
bun install

# Environment variables
cp .env.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY,
#          ELEVENLABS_API_KEY, REVENUCAT_API_KEY, SENTRY_DSN,
#          POSTHOG_KEY

# Start development
bun expo start

# Run on iOS simulator
bun expo run:ios

# Run on Android emulator
bun expo run:android
```

### Key Development Tools
| Tool | Purpose |
|------|---------|
| **Expo Go** | Quick iteration on physical device |
| **React Native Debugger** | Inspect state, network, layout |
| **Supabase CLI** | Local development, migrations, seeding |
| **Supabase Studio** | Visual database management |
| **Postman / Insomnia** | API testing (OpenAI, ElevenLabs) |
| **Flipper** | Advanced React Native debugging |

---

## Architecture Decision Records

### ADR-001: Mobile Framework — React Native + Expo
- **Context:** Need cross-platform mobile app for iOS and Android with camera APIs for real-time AI coaching on job sites
- **Decision:** React Native with Expo managed workflow (SDK 52+)
- **Consequences:** 95%+ code sharing across platforms, native camera/biometric APIs out of the box, OTA updates via EAS for instant bug fixes, single codebase for a solo developer to maintain
- **Alternatives Considered:** Flutter (smaller ecosystem for camera/TFLite plugins), Native iOS + Android (2x development cost, 2x maintenance burden), Ionic/Capacitor (WebView performance insufficient for real-time camera overlays)

### ADR-002: Database & Backend — Supabase
- **Context:** Need a full backend with auth, database, storage, real-time subscriptions, and serverless functions without dedicating months to backend infrastructure
- **Decision:** Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)
- **Consequences:** Zero custom backend code for auth/storage/DB; Row Level Security enforces data isolation at the database level; Edge Functions (Deno) handle AI orchestration; generous free tier ($0 at launch); open-source PostgreSQL underneath avoids vendor lock-in
- **Alternatives Considered:** Firebase (no relational DB, Firestore pricing unpredictable at scale), AWS Amplify (complex setup, higher DevOps burden), custom Node.js API (months of additional development time)

### ADR-003: AI Model — OpenAI GPT-4o Vision
- **Context:** Need multimodal AI that can analyze job site photos in real-time, detect errors, reference building codes, and provide actionable coaching in under 3 seconds
- **Decision:** GPT-4o Vision API for cloud analysis, with TensorFlow Lite for on-device pre-screening
- **Consequences:** High-quality structured JSON responses; ~$0.01-0.03 per analysis; streaming support for real-time feedback; TFLite pre-screening eliminates 30-40% of unnecessary API calls; combined effective cost ~$0.005-0.015 per analysis
- **Alternatives Considered:** Claude Vision (comparable quality but smaller ecosystem for structured output at time of evaluation), Google Gemini (less mature vision API), open-source LLaVA (self-hosting complexity, higher latency)

### ADR-004: Object Storage — Cloudflare R2 + Supabase Storage
- **Context:** Need cost-effective storage for task photos, documentation images, voice clips, and AI-generated overlays with CDN delivery
- **Decision:** Supabase Storage as primary (S3-compatible, integrated with RLS), Cloudflare CDN for static task guide assets
- **Consequences:** Supabase Storage integrates with Row Level Security for per-user access control; automatic image transformations; Cloudflare CDN provides zero-egress-fee delivery for static content; seamless migration path to standalone S3 if needed
- **Alternatives Considered:** AWS S3 + CloudFront (higher cost, more complex setup), Firebase Storage (no RLS integration), Cloudflare R2 standalone (would need separate auth layer)

### ADR-005: Authentication — Supabase Auth
- **Context:** Field workers need frictionless login (often wearing gloves, in dirty environments); must support both Apple and Google SSO for app store compliance
- **Decision:** Supabase Auth with Magic Link (primary), Apple Sign-In, and Google SSO
- **Consequences:** Magic Link eliminates passwords entirely (critical for trade workers on job sites); Apple/Google SSO satisfies app store requirements; JWT tokens integrate seamlessly with Edge Functions and RLS; biometric unlock via expo-local-authentication for returning sessions
- **Alternatives Considered:** Auth0 (expensive at scale, $23/1K MAU), Clerk (newer, less proven with React Native), Firebase Auth (would fragment backend across providers)

### ADR-006: State Management — Zustand
- **Context:** Need lightweight state management for camera pipeline state, user session, active task progress, and voice command state without Redux boilerplate
- **Decision:** Zustand for client state, React Query (TanStack) for server state
- **Consequences:** Zustand at 1.1kB adds negligible bundle size; no boilerplate (unlike Redux); TypeScript-first with excellent DX; React Query handles caching of AI responses, optimistic updates for task progress, and offline support via persistQueryClient
- **Alternatives Considered:** Redux Toolkit (excessive boilerplate for this app size), Jotai (atomic model less intuitive for camera pipeline state), MobX (larger bundle, less community adoption in RN ecosystem)

### ADR-007: Styling/UI — NativeWind (Tailwind CSS for React Native)
- **Context:** Need rapid UI development with consistent spacing, sizing, and dark mode support for a trade worker-focused app used in variable lighting conditions
- **Decision:** NativeWind 4.x (Tailwind CSS compiled to React Native StyleSheet)
- **Consequences:** Utility-first styling enables rapid iteration; consistent design tokens across all screens; dark mode via class strategy (critical for bright outdoor and dim indoor job sites); familiar Tailwind syntax reduces onboarding time for contributors
- **Alternatives Considered:** Tamagui (powerful but steeper learning curve), Styled Components (runtime overhead in RN), Unistyles (newer, smaller community), React Native Paper (Material Design, wrong aesthetic for trade workers)

---

## Performance Budgets

| Metric | Target | Tool |
|--------|--------|------|
| Time to Interactive (TTI) | < 3s on 4G | Flashlight |
| App Bundle Size (iOS) | < 60MB | EAS Build (includes ~22MB TFLite models) |
| App Bundle Size (Android) | < 40MB | EAS Build (includes ~22MB TFLite models) |
| JS Bundle Size | < 15MB | Metro bundler |
| Frame Rate | 60fps (no drops below 45fps during camera overlay) | React Native Perf Monitor |
| Cold Start | < 2s | Native profiler |
| API Response (p95) | < 500ms (Edge Functions) | Supabase Dashboard |
| GPT-4o Vision Analysis | < 3s per image | Custom timing |
| TFLite On-Device Inference | < 200ms | Custom timing (Scene Classifier + Quality Gate) |
| Image Upload | < 3s on 4G for 5MB image | Custom timing |
| Voice Command (Whisper) | < 1.5s transcription | Custom timing |
| ElevenLabs TTS | < 1s to first audio (streaming) | Custom timing |
| Offline Sync | < 5s for 100 queued task progress items | Custom timing |
| Memory Usage | < 300MB peak (camera + TFLite active) | Xcode Instruments / Android Profiler |

---

## Environment Variables

| Variable | Description | Required | Example | Where to Get |
|----------|-------------|----------|---------|--------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | `https://xxx.supabase.co` | Supabase Dashboard > Settings > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJhbG...` | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Edge Functions only) | Yes (server) | `eyJhbG...` | Supabase Dashboard > Settings > API |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o Vision + Whisper | Yes | `sk-...` | OpenAI Platform > API Keys |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for TTS voice responses | Yes | `xi-...` | ElevenLabs Dashboard > API Keys |
| `EXPO_PUBLIC_REVENUCAT_API_KEY_IOS` | RevenueCat iOS public API key | Yes | `appl_...` | RevenueCat Dashboard > Project > API Keys |
| `EXPO_PUBLIC_REVENUCAT_API_KEY_ANDROID` | RevenueCat Android public API key | Yes | `goog_...` | RevenueCat Dashboard > Project > API Keys |
| `SENTRY_DSN` | Sentry error tracking DSN | Yes | `https://...@sentry.io/...` | Sentry Dashboard > Project Settings > DSN |
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog analytics project key | Yes | `phc_...` | PostHog Dashboard > Project Settings |
| `EXPO_PUBLIC_POSTHOG_HOST` | PostHog instance host URL | No | `https://app.posthog.com` | PostHog Dashboard (defaults to cloud) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID for CDN/R2 | No | `abc123...` | Cloudflare Dashboard > Account |
| `EAS_PROJECT_ID` | Expo EAS project identifier | Yes | `uuid-string` | Expo Dashboard > Project Settings |

---

## Local Development Setup

### Prerequisites
- Node.js 20+ (LTS)
- bun 1.1+ (recommended) or npm 10+
- Expo CLI (`npx expo`)
- iOS Simulator (Xcode 16+) or Android Emulator (Android Studio Ladybug+)
- Supabase CLI (`brew install supabase/tap/supabase`)
- OpenAI API key (for AI analysis testing)
- ElevenLabs API key (for TTS testing, optional for initial dev)

### Steps
1. Clone repository: `git clone https://github.com/fieldlens/fieldlens-app.git`
2. Install dependencies: `bun install`
3. Copy environment file: `cp .env.example .env.local`
4. Fill in environment variables (see Environment Variables table above)
5. Start Supabase locally: `npx supabase start`
6. Run database migrations: `npx supabase db push`
7. Seed task guides and compliance codes: `npx supabase db seed`
8. Start development server: `bun expo start`
9. Run on iOS simulator: `bun expo run:ios`
10. Run on Android emulator: `bun expo run:android`

### Local Supabase Services
After `npx supabase start`, the following local services are available:
| Service | URL |
|---------|-----|
| Supabase Studio | `http://localhost:54323` |
| API Gateway | `http://localhost:54321` |
| Database (PostgreSQL) | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Edge Functions | `http://localhost:54321/functions/v1/` |
| Storage | `http://localhost:54321/storage/v1/` |

### Running Tests
```bash
bun test                    # Unit tests (Zustand stores, utils, hooks)
bun test:e2e                # Detox E2E tests (iOS simulator)
bun lint                    # ESLint + TypeScript check
bun typecheck               # TypeScript strict mode check
```
