# FieldLens Skills

**Technical, domain, design, and business skills needed to build FieldLens.**

---

## Skills Overview

Building FieldLens requires a blend of mobile engineering, AI integration, domain expertise in the skilled trades, and growth marketing savvy. This document maps every skill needed, rates the required proficiency level, identifies which skills are unique to this project, and provides curated learning resources.

### Proficiency Scale

| Level | Definition |
|-------|-----------|
| **Basic** | Can implement with documentation reference; understands core concepts |
| **Intermediate** | Can build features independently; handles edge cases; optimizes for performance |
| **Advanced** | Deep architectural knowledge; can make complex trade-off decisions; teaches others |

---

## Technical Skills

### Mobile Development

| Skill | Required Level | Why It Matters for FieldLens |
|-------|---------------|------------------------------|
| **React Native** | Advanced | Core framework; must handle camera pipelines, real-time overlays, audio streaming, and offline data sync at production quality |
| **TypeScript** | Advanced | Type safety critical for AI response parsing, complex state management, and API contracts; reduces runtime errors in field conditions |
| **Expo** | Intermediate | Managed workflow for rapid iteration; EAS Build/Submit for CI/CD; OTA updates for instant bug fixes without app store review |
| **Expo Camera** | Intermediate | Frame capture, torch control, zoom, orientation handling; must work reliably in varied lighting and angles |
| **Expo AV** | Intermediate | Audio recording for voice commands; audio playback for TTS responses; background audio handling |
| **React Navigation / Expo Router** | Intermediate | File-based routing; deep linking; tab navigation; modal presentations; type-safe route params |
| **Zustand** | Intermediate | Lightweight state management for camera state, user session, active task, voice state |
| **TanStack Query (React Query)** | Intermediate | Server state caching; optimistic updates; offline persistence; automatic retry for flaky jobsite connections |
| **React Native Reanimated** | Intermediate | Native-thread animations for camera overlays, assessment indicators, progress bars; must maintain 60fps during camera operation |
| **NativeWind / Tailwind** | Basic | Utility-first styling; responsive design; dark mode class strategy; rapid UI development |

**Learning Resources:**

- React Native Official Docs: https://reactnative.dev/docs/getting-started
- Expo Documentation: https://docs.expo.dev/
- React Native by Example (William Candillon): https://www.youtube.com/@wcandillon
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- Expo Camera Documentation: https://docs.expo.dev/versions/latest/sdk/camera/
- Expo AV Documentation: https://docs.expo.dev/versions/latest/sdk/av/
- Zustand GitHub: https://github.com/pmndrs/zustand
- TanStack Query Docs: https://tanstack.com/query/latest/docs/framework/react/overview
- React Native Reanimated Docs: https://docs.swmansion.com/react-native-reanimated/
- NativeWind Docs: https://www.nativewind.dev/

---

### Backend & Database

| Skill | Required Level | Why It Matters for FieldLens |
|-------|---------------|------------------------------|
| **Supabase** | Intermediate | Full BaaS platform; must configure RLS policies, Edge Functions, Storage buckets, and Realtime subscriptions correctly |
| **PostgreSQL** | Intermediate | Schema design for task guides (JSONB), user progress, photo metadata; full-text search for task library; efficient queries for analytics |
| **Supabase Auth** | Intermediate | Magic link, Apple SSO, Google SSO; JWT handling; session management; RLS policy integration |
| **Supabase Edge Functions (Deno)** | Intermediate | Serverless compute for AI API orchestration; image processing pipeline; webhook handlers |
| **Supabase Storage** | Basic | S3-compatible file storage for task photos, guide images; CDN delivery; RLS on buckets |
| **SQL (Advanced Queries)** | Intermediate | Complex queries for analytics dashboards; aggregations for progress tracking; materialized views for performance |

**Learning Resources:**

- Supabase Official Docs: https://supabase.com/docs
- Supabase YouTube Channel: https://www.youtube.com/@Supabase
- PostgreSQL Tutorial: https://www.postgresqltutorial.com/
- Supabase Edge Functions Guide: https://supabase.com/docs/guides/functions
- Supabase Auth Guide: https://supabase.com/docs/guides/auth
- Row Level Security Deep Dive: https://supabase.com/docs/guides/auth/row-level-security
- Deno Manual: https://deno.land/manual

---

### AI & Machine Learning

| Skill | Required Level | Why It Matters for FieldLens |
|-------|---------------|------------------------------|
| **OpenAI GPT-4o Vision API** | Intermediate | Core AI engine; must craft effective prompts, handle structured JSON responses, manage token costs, implement error handling and fallbacks |
| **Prompt Engineering** | Intermediate | Trade-specific prompts with context injection; structured output formatting; consistency at low temperature; iterative prompt refinement based on accuracy metrics |
| **OpenAI Whisper API** | Basic | Voice-to-text transcription; sending audio buffers; handling noisy environments (construction sites); parsing transcription results |
| **ElevenLabs TTS API** | Basic | Text-to-speech for hands-free feedback; streaming audio responses; voice selection and configuration |
| **TensorFlow Lite (React Native)** | Basic | On-device inference for image pre-screening; loading and running .tflite models; interpreting classification results |
| **Image Processing** | Basic | Compression (WebP), resizing, brightness/contrast adjustment for optimal AI analysis; understanding how image quality affects Vision API accuracy |
| **AI Cost Optimization** | Intermediate | Token counting, request batching, response caching, TFLite pre-screening to reduce API calls; understanding cost-per-analysis economics |

**Learning Resources:**

- OpenAI API Documentation: https://platform.openai.com/docs/
- OpenAI Vision Guide: https://platform.openai.com/docs/guides/vision
- OpenAI Whisper API: https://platform.openai.com/docs/guides/speech-to-text
- Prompt Engineering Guide (OpenAI): https://platform.openai.com/docs/guides/prompt-engineering
- ElevenLabs Documentation: https://elevenlabs.io/docs
- TensorFlow Lite Guide: https://www.tensorflow.org/lite/guide
- TFLite React Native: https://github.com/nichenqin/react-native-tflite
- Learn Prompting: https://learnprompting.org/
- AI Cost Calculator: https://openai.com/pricing

---

### Payments & Monetization

| Skill | Required Level | Why It Matters for FieldLens |
|-------|---------------|------------------------------|
| **RevenueCat** | Intermediate | Subscription management across iOS and Android; entitlement checking; paywall display; A/B testing pricing; webhooks for backend sync |
| **Apple In-App Purchase** | Basic | Understanding IAP rules, review guidelines, pricing tiers; RevenueCat abstracts most complexity |
| **Google Play Billing** | Basic | Understanding Play billing rules, subscription features; RevenueCat abstracts most complexity |
| **Stripe** | Basic | Future web payments, enterprise invoicing; basic Checkout Session creation; webhook handling |

**Learning Resources:**

- RevenueCat Documentation: https://www.revenuecat.com/docs/
- RevenueCat Getting Started (React Native): https://www.revenuecat.com/docs/getting-started/installation/reactnative
- Apple IAP Guide: https://developer.apple.com/in-app-purchase/
- Google Play Billing: https://developer.android.com/google/play/billing
- Stripe Documentation: https://docs.stripe.com/
- RevenueCat Blog (Subscription Best Practices): https://www.revenuecat.com/blog/

---

### Infrastructure & DevOps

| Skill | Required Level | Why It Matters for FieldLens |
|-------|---------------|------------------------------|
| **Expo EAS Build** | Intermediate | Managed native builds; build profiles (development, preview, production); OTA updates; app store submission |
| **Git / GitHub** | Intermediate | Version control; branching strategy; PR reviews; GitHub Actions for CI/CD |
| **GitHub Actions** | Basic | CI pipeline: lint, type-check, test on PR; trigger EAS builds; automated deployments |
| **Sentry** | Basic | React Native crash reporting; source map uploads; performance monitoring; error alerting |
| **PostHog** | Basic | Event tracking; funnel analysis; feature flags; session replays; A/B testing |
| **Vercel** | Basic | Marketing website deployment; edge functions if needed; domain management |

**Learning Resources:**

- Expo EAS Documentation: https://docs.expo.dev/build/introduction/
- Expo EAS Update: https://docs.expo.dev/eas-update/introduction/
- GitHub Actions Docs: https://docs.github.com/en/actions
- Sentry React Native Guide: https://docs.sentry.io/platforms/react-native/
- PostHog Documentation: https://posthog.com/docs
- Vercel Documentation: https://vercel.com/docs

---

## Domain Skills (Skilled Trades)

These are the non-technical skills that differentiate FieldLens from a generic AI app. Understanding the trades industry is as important as the code.

### Trade Technical Knowledge

| Skill | Required Level | Why It Matters for FieldLens |
|-------|---------------|------------------------------|
| **Residential Plumbing Fundamentals** | Intermediate | Must understand DWV systems, supply systems, fixture installation, pipe materials, joining methods to write accurate task guides and validate AI output |
| **Electrical Fundamentals** | Basic (growing to Intermediate) | Residential wiring, panel work, circuit types, NEC basics; needed for electrical vertical expansion |
| **HVAC Fundamentals** | Basic (growing to Intermediate) | Furnace/AC systems, ductwork, gas piping, refrigerant basics; needed for HVAC vertical expansion |
| **Building Codes (IPC, UPC, NEC, IMC)** | Intermediate | Must understand code structure, how to look up requirements, common violations; this is the compliance backbone of FieldLens |
| **Tool Identification** | Basic | Must know common tools by sight for TFLite training data labeling and guide accuracy |
| **Safety Standards (OSHA)** | Basic | OSHA construction standards, PPE requirements, common safety violations; critical for safety-related AI alerts |

**How to Acquire Trade Knowledge:**

The founder/developer does not need to be a tradesperson but must invest significant time learning the domain. This is not optional -- domain expertise is the moat.

**Methods:**
1. **Ride-alongs with tradespeople** (most effective): Spend 5-10 days shadowing plumbers, electricians, and HVAC techs on real jobs. Observe their workflow, questions, mistakes, and pain points. Offer to pay for their time ($200-300/day).
2. **Trade school audit courses**: Many community colleges allow auditing introductory plumbing/electrical courses for $200-500. Take at least one per trade.
3. **YouTube channels**: Watch tradespeople work and teach (see resources below).
4. **Code books**: Purchase and study the International Plumbing Code (IPC), National Electrical Code (NEC), and International Mechanical Code (IMC).
5. **Trade forums**: Lurk and participate in forums like Plumbing Zone, Electrician Talk, and HVAC-Talk to understand real-world questions and problems.
6. **Advisory board**: Recruit 3-5 working tradespeople (one per trade) as paid advisors ($100-200/month) for content review and AI output validation.

**Learning Resources:**

- International Plumbing Code (IPC): https://codes.iccsafe.org/codes/international-plumbing-code
- National Electrical Code (NEC): https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70
- OSHA Construction Standards: https://www.osha.gov/construction
- Plumbing Zone Forum: https://www.plumbingzone.com/
- Electrician Talk Forum: https://www.electriciantalk.com/
- HVAC-Talk Forum: https://hvac-talk.com/
- Roger Wakefield (Plumbing YouTube): https://www.youtube.com/@RogerWakefield
- Electrician U (Electrical YouTube): https://www.youtube.com/@ElectricianU
- HVAC School (HVAC YouTube): https://www.youtube.com/@HVACSchool
- This Old House (General Trades): https://www.youtube.com/@ThisOldHouse
- International Code Council: https://www.iccsafe.org/

---

### Apprenticeship & Training System

| Skill | Required Level | Why It Matters for FieldLens |
|-------|---------------|------------------------------|
| **Apprenticeship Structure** | Basic | Understanding how trade training works (4-5 year programs, journeyman/master progression) to design appropriate learning paths and certifications |
| **Trade School Landscape** | Basic | Knowing the key trade schools, their curricula, and what they lack helps position FieldLens as a complement |
| **Union vs. Non-Union** | Basic | Understanding the different career paths, requirements, and cultures helps with marketing and feature design |
| **Licensing Requirements** | Basic | Each state has different licensing requirements for each trade; FieldLens must not claim to replace formal licensing |

**Learning Resources:**

- Bureau of Labor Statistics - Plumbers: https://www.bls.gov/ooh/construction-and-extraction/plumbers-pipefitters-and-steamfitters.htm
- Bureau of Labor Statistics - Electricians: https://www.bls.gov/ooh/construction-and-extraction/electricians.htm
- National Center for Construction Education and Research (NCCER): https://www.nccer.org/
- Associated Builders and Contractors (ABC): https://www.abc.org/

---

## Design Skills

| Skill | Required Level | Why It Matters for FieldLens |
|-------|---------------|------------------------------|
| **Mobile UX Design** | Intermediate | Must design for one-handed use, dirty/wet/gloved hands, outdoor lighting, distracted users; standard mobile UX does not apply -- this is industrial UX |
| **Figma** | Intermediate | Design system creation, component libraries, prototyping, developer handoff; Figma is the standard for mobile app design |
| **Design Systems** | Basic | Creating and maintaining a consistent component library (buttons, cards, inputs) that enforces the "Rugged Professional" brand |
| **Camera UI / AR Overlays** | Basic | Designing overlays that are informative without obstructing the camera view; understanding how AR-style indicators work on mobile |
| **Accessibility (WCAG AA)** | Intermediate | Tradespeople include users with hearing loss (power tool exposure), color vision deficiency, and varying literacy levels; accessibility is not optional |
| **Dark Mode Design** | Basic | Dark mode as default (reduces glare in bright outdoor conditions); designing for both modes while maintaining brand consistency |
| **Iconography** | Basic | Selecting and customizing icons that are instantly recognizable at small sizes and in peripheral vision (while working) |
| **Motion Design** | Basic | Subtle animations that communicate state (analyzing, success, error) without being distracting during work; haptic feedback design |

### Design Principles for FieldLens

1. **Glanceability over density**: A user mid-task should understand the screen in < 1 second
2. **Touch targets for wet/gloved hands**: Minimum 48px, prefer 56px+ for primary actions
3. **Contrast for all conditions**: Must be readable in direct sunlight and dim crawlspaces
4. **Voice-first, touch-second**: Every critical action must be possible without touching the screen
5. **No cognitive load during work**: Minimize choices, decisions, and reading during active tasks
6. **Industrial durability in design language**: The design should feel tough and professional, not sleek and consumer-y

**Learning Resources:**

- Figma Learn: https://help.figma.com/hc/en-us
- Laws of UX: https://lawsofux.com/
- Apple Human Interface Guidelines (iOS): https://developer.apple.com/design/human-interface-guidelines/
- Material Design 3 (Android): https://m3.material.io/
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Refactoring UI (Book): https://www.refactoringui.com/
- Designing for Accessibility (Apple): https://developer.apple.com/accessibility/
- Phosphor Icons: https://phosphoricons.com/
- AR UX Design Patterns: https://aruxdesign.com/

---

## Business Skills

| Skill | Required Level | Why It Matters for FieldLens |
|-------|---------------|------------------------------|
| **TikTok Content Creation** | Intermediate | Primary growth channel; must create authentic, trade-relevant content that resonates with tradespeople aged 22-35; short-form video showing AI camera in action |
| **Trade Community Engagement** | Intermediate | Building trust in an industry skeptical of tech; must speak the language, attend trade shows, participate in forums without being perceived as an outsider |
| **App Store Optimization (ASO)** | Intermediate | Critical for organic discovery; keyword research for trade-related searches; screenshot optimization; A/B testing app store listings |
| **Content Marketing** | Basic | Blog posts, YouTube videos, social proof case studies targeting tradespeople; SEO for "plumbing app", "electrical code app", etc. |
| **Subscription Pricing Strategy** | Intermediate | Understanding willingness-to-pay for tradespeople; pricing psychology; trial optimization; churn reduction tactics |
| **B2C Growth Metrics** | Intermediate | Understanding and optimizing: CAC, LTV, churn, conversion rate, ARPU, MRR, retention curves; making data-driven decisions |
| **User Research (Field Research)** | Intermediate | Interviewing tradespeople on job sites; observing workflow; collecting feedback; iterating based on real-world usage patterns |
| **Trade Show / Event Marketing** | Basic | Attending trade conferences (WPC, IEC); setting up demo booths; networking with trade school instructors |
| **Referral Program Design** | Basic | Designing a referral program that works for tradespeople (who talk to each other constantly on job sites, at supply houses, etc.) |
| **Partnership Development** | Basic | Relationships with trade schools, supply houses (Ferguson, Grainger), trade unions, tool manufacturers |

### Growth Strategy Priorities (First 18 Months)

| Priority | Channel | Expected Contribution to $1M MRR |
|----------|---------|----------------------------------|
| 1 | TikTok / Instagram Reels / YouTube Shorts | 35% of new users |
| 2 | ASO (App Store / Google Play organic) | 25% of new users |
| 3 | Referral program (word of mouth) | 20% of new users |
| 4 | Trade school partnerships | 10% of new users |
| 5 | SEO / Content marketing | 10% of new users |

**Learning Resources:**

- TikTok for Business: https://www.tiktok.com/business/en
- App Store Optimization (ASO) Guide by Phiture: https://phiture.com/mobilegrowthstack/aso-guide/
- Reforge (Growth Strategy): https://www.reforge.com/
- Lenny's Newsletter (Product/Growth): https://www.lennysnewsletter.com/
- How to Build a Trade School Partnership (SkillsUSA): https://www.skillsusa.org/
- Subscription Pricing (ProfitWell/Paddle): https://www.paddle.com/resources/saas-pricing
- Mobile App Growth (Branch): https://www.branch.io/resources/
- RevenueCat Blog on Pricing: https://www.revenuecat.com/blog/growth/
- Y Combinator Startup School: https://www.startupschool.org/

---

## Skills Unique to FieldLens

These skills are specifically required because of what FieldLens is -- they would not be needed for a typical SaaS or mobile app.

### 1. Real-Time Camera + AI Pipeline Engineering
**What it is:** Designing a pipeline that captures camera frames, pre-processes them on-device, sends them to a cloud AI API, receives structured responses, and displays visual overlays on the camera feed -- all within 3 seconds, on a phone, potentially in a crawlspace with spotty signal.

**Why it is unique:** Most mobile apps do not process live camera feeds with cloud AI in real-time. This requires understanding frame capture timing, image compression trade-offs, API latency budgets, and how to degrade gracefully when conditions are poor.

**Key challenges:**
- Balancing image quality (AI accuracy needs high-res) vs. upload speed (field workers have spotty connectivity)
- Managing API rate limits and costs when users are actively working (potentially analyzing every few seconds)
- Maintaining smooth camera UI (60fps) while processing AI responses
- Handling the transition between on-device TFLite and cloud GPT-4o seamlessly

### 2. Trade-Specific AI Prompt Engineering
**What it is:** Writing and maintaining system prompts that make GPT-4o Vision behave like a knowledgeable trade instructor who can assess physical work through a camera image.

**Why it is unique:** Generic prompt engineering is not sufficient. FieldLens prompts must encode:
- Trade terminology and procedures (a "trap arm" means something specific in plumbing)
- Building code requirements that vary by jurisdiction
- Common error patterns for each specific task step
- The right level of detail for the user's experience level
- Safety-critical warnings that must never be missed

**Key challenges:**
- Accuracy: AI must not tell a plumber something is correct when it violates code
- Liability: Careful phrasing to position as "coaching" not "certification"
- Consistency: Same prompt + similar image should produce similar assessment across calls
- Conciseness: Responses must be short enough for voice delivery while being complete

### 3. Industrial UX Design for Physical Labor
**What it is:** Designing a mobile interface that works during active physical labor -- dirty hands, wet gloves, kneeling positions, dim lighting, peripheral attention only.

**Why it is unique:** Standard mobile UX assumes: clean dry hands, full visual attention, comfortable environment. FieldLens assumes the opposite. Every screen must be designed for:
- One-handed use with a dirty or gloved thumb
- Glanceable information (1-second comprehension)
- Voice-first interaction (primary input method)
- Extreme lighting conditions (direct sunlight to dark crawlspace)
- Propped-up phone (landscape on a shelf or leaning against a wall)

### 4. Building Code Database Management
**What it is:** Structuring, storing, and querying building codes (IPC, NEC, IMC) so that relevant code sections can be surfaced during AI analysis and task guidance.

**Why it is unique:** Building codes are:
- Dense legal documents that must be interpreted correctly
- Updated on a 3-year cycle (must track editions)
- Jurisdiction-dependent (some cities adopt modifications)
- Critical for user trust (if FieldLens cites the wrong code, credibility is destroyed)

### 5. Voice Interaction in Noisy Environments
**What it is:** Building a voice command system that works reliably on a construction site with power tools, HVAC equipment, other workers talking, and ambient noise.

**Why it is unique:** Most voice interfaces assume quiet environments. FieldLens must handle:
- Background noise from power tools (90+ dB)
- Echo in enclosed spaces (basements, mechanical rooms)
- Worker speaking while physically exerting (heavy breathing, grunting)
- Construction-specific vocabulary ("PEX crimp", "wire nut", "mini-split")
- Whisper API generally handles noise well, but prompt tuning and post-processing help

---

## Skill Acquisition Priority

### Phase 1: Pre-Development (2-4 weeks)

| Priority | Skill | Action |
|----------|-------|--------|
| 1 | Trade domain knowledge | Schedule 3-5 ride-alongs with local plumbers; audit one trade school course |
| 2 | React Native + Expo setup | Complete Expo tutorial; build a basic camera app |
| 3 | Supabase fundamentals | Complete Supabase quickstart; set up auth + database |
| 4 | OpenAI Vision API | Experiment with GPT-4o Vision; test trade image analysis; iterate prompts |
| 5 | Figma + Design System | Create component library based on theme.md; design 3 core screens |

### Phase 2: MVP Development (Months 1-4)

| Priority | Skill | Action |
|----------|-------|--------|
| 1 | Camera + AI pipeline | Build and optimize the core camera-to-analysis pipeline |
| 2 | Voice interaction | Integrate Whisper + ElevenLabs; test in noisy conditions |
| 3 | TFLite integration | Train and deploy on-device scene classifier |
| 4 | RevenueCat | Implement subscription products and paywall |
| 5 | Content creation (trade guides) | Write 50 plumbing guides with code references |

### Phase 3: Launch & Growth (Months 4-8)

| Priority | Skill | Action |
|----------|-------|--------|
| 1 | TikTok content | Start posting 3-5 trade-relevant videos per week |
| 2 | ASO | Optimize app store listing; A/B test screenshots |
| 3 | User research | Interview 20+ beta users; iterate based on feedback |
| 4 | Subscription optimization | A/B test pricing, paywall timing, trial length |
| 5 | Community engagement | Join trade forums; attend local trade events |

---

## Skill Gap Assessment Template

Use this template to assess your current skill levels and plan learning:

| Skill | Required Level | My Current Level | Gap | Priority | Plan to Close Gap |
|-------|---------------|-----------------|-----|----------|-------------------|
| React Native | Advanced | ? | ? | High | ? |
| TypeScript | Advanced | ? | ? | High | ? |
| Supabase | Intermediate | ? | ? | High | ? |
| OpenAI Vision | Intermediate | ? | ? | High | ? |
| TFLite | Basic | ? | ? | Medium | ? |
| Plumbing knowledge | Intermediate | ? | ? | High | ? |
| Building codes | Intermediate | ? | ? | High | ? |
| Mobile UX | Intermediate | ? | ? | Medium | ? |
| Figma | Intermediate | ? | ? | Medium | ? |
| TikTok content | Intermediate | ? | ? | Medium | ? |
| ASO | Intermediate | ? | ? | Medium | ? |
| RevenueCat | Intermediate | ? | ? | Medium | ? |
| Prompt engineering | Intermediate | ? | ? | High | ? |
