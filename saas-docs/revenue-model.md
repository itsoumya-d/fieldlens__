# FieldLens Revenue Model

**Pricing tiers, unit economics, growth timeline, acquisition channels, and expansion revenue.**

---

## Pricing Strategy

### Core Philosophy

FieldLens pricing is designed around one question: **What is it worth to a tradesperson to avoid one callback?**

The average callback (returning to fix a mistake) costs a plumber:
- 2-4 hours of unpaid labor
- $50-150 in wasted materials
- Damage to reputation and future referrals
- Stress and lost income from other scheduled jobs

A single avoided callback is worth $200-500 to a tradesperson. FieldLens at $29-49/month pays for itself with one prevented mistake per month. This is not a hard sell -- it is an obvious investment.

### Pricing Tiers

| Feature | Free | Pro ($29/mo) | Master ($49/mo) |
|---------|------|-------------|-----------------|
| **AI Camera Analysis** | 3 per day | Unlimited | Unlimited + Priority Queue |
| **Task Guides** | 15 basic plumbing | 50 plumbing guides | All trades (140+ guides) |
| **Voice Interaction** | Basic commands (next/previous/check) | Full natural language | Full + custom wake word |
| **Error Detection** | Basic (warnings only) | Full (all severities) | Full + detailed code refs |
| **Progress Tracking** | Last 5 sessions | Unlimited history | Unlimited + analytics |
| **Photo Documentation** | 50 photos total | 500 photos per month | Unlimited |
| **Code Reference Library** | None | Plumbing codes (IPC/UPC) | All trade codes (IPC, NEC, IMC) |
| **Offline Mode** | No | No | Yes (downloadable guides + basic AI) |
| **Certifications** | No | No | Yes (learning paths + digital badges) |
| **Export / Share** | No | Photo export + sharing | PDF reports + portfolio export |
| **AI Voice Selection** | Default male | Male or female | Male, female, or custom |
| **Support** | Community only | Email support (48h response) | Priority support (24h response) |

### Annual Pricing (Discount Incentive)

| Tier | Monthly | Annual | Annual Monthly Equivalent | Savings |
|------|---------|--------|--------------------------|---------|
| **Pro** | $29/mo | $249/yr | $20.75/mo | 28% |
| **Master** | $49/mo | $419/yr | $34.92/mo | 29% |

Annual plans reduce churn (users commit for 12 months) and improve LTV. The ~28-29% discount is aggressive enough to drive annual adoption while maintaining strong unit economics.

---

## Unit Economics

### Key Metrics

| Metric | Value | Explanation |
|--------|-------|-------------|
| **ARPU** (Average Revenue Per User) | $35/month | Blended across all paying users; weighted toward Pro ($29) with Master ($49) uplift |
| **Conversion Rate** (Free to Paid) | 8% | Industry benchmark for mobile B2C with clear value prop is 3-5%; FieldLens targets 8% due to high urgency use case |
| **Monthly Churn Rate** | 5% | Trade workers have consistent ongoing need; seasonal variation expected (lower churn in spring/summer) |
| **Annual Churn Rate** | 46% | (1 - 0.95^12); mitigated by annual plans and expanding features |
| **CAC** (Customer Acquisition Cost) | $25 | Blended across organic (TikTok, ASO, referral) and paid channels |
| **Average Customer Lifespan** | 1 / 0.05 = 20 months | Inverse of monthly churn rate |
| **LTV** (Lifetime Value) | $35 x 20 x 0.89 = $623 | ARPU x lifespan x gross margin (conservative) |
| **LTV** (simplified) | $35 x 12 = $420 | Conservative 12-month assumption |
| **LTV:CAC Ratio** | $420 / $25 = **16.8:1** | Excellent; benchmark is 3:1 minimum, 5:1+ is strong |
| **Payback Period** | $25 / $35 = **0.7 months** | CAC recovered in less than one month |
| **Gross Margin** | ~89-92% | Revenue minus AI API costs, infrastructure, and payment processing |

### ARPU Breakdown

| Scenario | Users | Revenue | Contribution to ARPU |
|----------|-------|---------|---------------------|
| Free users | 74% | $0 | $0 |
| Pro Monthly ($29) | 16% | $29 | $4.64 |
| Pro Annual ($20.75 effective) | 4% | $20.75 | $0.83 |
| Master Monthly ($49) | 4% | $49 | $1.96 |
| Master Annual ($34.92 effective) | 2% | $34.92 | $0.70 |
| **Total (paying users only)** | **26%** | **Blended** | **ARPU = $35** |

**Note:** The 8% conversion rate applies to all users; the 26% figure above represents the tier distribution among paying users. Of all users, 8% are paying; of those paying users, the distribution favors Pro monthly.

### Per-User Cost Breakdown

| Cost Component | Monthly per Active User | Notes |
|---------------|------------------------|-------|
| OpenAI GPT-4o Vision | $1.80 | 60 analyses/mo x $0.006 x 0.6 (after TFLite filtering) x 50% (non-paying users use less) |
| OpenAI Whisper | $0.05 | 100 commands/mo x $0.0005 |
| ElevenLabs TTS | $0.50 | 80 responses/mo x 200 chars x $0.000198 / shared across users |
| Supabase (allocated) | $0.10 | $25-599/mo spread across user base |
| Sentry + PostHog | $0.05 | Minimal per-user cost |
| **Total per user (blended)** | **$2.50** | |
| **Total per paying user** | **$4.00** | Paying users are more active (more API calls) |

**Gross margin per paying user: $35 - $4 = $31 (88.6%)**

---

## $1M MRR Math

### The Path to $1M MRR

```
$1,000,000 MRR / $35 ARPU = 28,572 paying subscribers

28,572 paying / 8% conversion = 357,143 total registered users

357,143 total users / 18 months = 19,841 new users per month
                                = ~660 new users per day
```

### Is 660 New Users Per Day Realistic?

| Benchmark | Daily New Users | Context |
|-----------|----------------|---------|
| Duolingo (early growth) | 1,000-5,000/day | Language learning, massive TAM, viral loops |
| Headspace (Year 1-2) | 500-2,000/day | Meditation, strong content marketing + TikTok |
| Thumbtack (early mobile) | 300-1,000/day | Trade marketplace, similar target audience |
| **FieldLens target** | **660/day** | Niche but underserved; viral TikTok potential; zero direct competitors |

660 new users/day is ambitious but achievable for a well-executed mobile app with strong TikTok/social media presence targeting a large underserved market (11.5M US tradespeople).

### Monthly MRR Buildup

| Month | New Users | Total Users | Paying Users (8%) | MRR | Cumulative Revenue |
|-------|-----------|------------|-------------------|----|-------------------|
| **1** (Soft Launch) | 2,000 | 2,000 | 160 | $5,600 | $5,600 |
| **2** | 3,000 | 4,900 | 392 | $13,720 | $19,320 |
| **3** | 5,000 | 9,555 | 764 | $26,740 | $46,060 |
| **4** | 8,000 | 16,777 | 1,342 | $46,970 | $93,030 |
| **5** | 12,000 | 27,338 | 2,187 | $76,545 | $169,575 |
| **6** | 15,000 | 39,971 | 3,198 | $111,930 | $281,505 |
| **7** | 18,000 | 54,573 | 4,366 | $152,810 | $434,315 |
| **8** | 20,000 | 70,544 | 5,644 | $197,540 | $631,855 |
| **9** | 22,000 | 87,467 | 6,997 | $244,895 | $876,750 |
| **10** | 24,000 | 105,094 | 8,407 | $294,245 | $1,170,995 |
| **11** | 26,000 | 123,339 | 9,867 | $345,345 | $1,516,340 |
| **12** | 28,000 | 142,172 | 11,374 | $398,090 | $1,914,430 |
| **13** | 30,000 | 161,563 | 12,925 | $452,375 | $2,366,805 |
| **14** | 32,000 | 181,485 | 14,519 | $508,165 | $2,874,970 |
| **15** | 34,000 | 201,911 | 16,153 | $565,355 | $3,440,325 |
| **16** | 36,000 | 222,815 | 17,825 | $623,875 | $4,064,200 |
| **17** | 38,000 | 244,175 | 19,534 | $683,690 | $4,747,890 |
| **18** | 40,000 | 265,966 | 21,277 | $744,695 | $5,492,585 |

**Notes:**
- Total users factor in 3% monthly inactive/deletion rate
- Paying users = 8% of total active users
- MRR = paying users x $35 ARPU
- Growth acceleration assumes successful TikTok virality (months 4-6) and multi-trade expansion (months 5-9)

**Reaching $1M MRR requires approximately 28,572 paying users, achievable around month 20-21 at this growth trajectory, or earlier if conversion rate or ARPU improves.**

---

## Growth Timeline

### Q1 (Months 1-3): Build & Soft Launch

**Objective:** Ship MVP, validate with real tradespeople, achieve first 100 paying users.

| Activity | Target | Channel |
|----------|--------|---------|
| Ship MVP to App Store + Google Play | Month 3 | N/A |
| Beta test with 30 tradespeople | Months 2-3 | Personal network, trade school contacts |
| Launch TikTok content creation | Month 2 | TikTok, Instagram Reels |
| Collect 50 app store reviews | Month 3 | Beta users, early adopters |
| First 500 total users | Month 3 | Organic + beta invites |
| First 100 paying users | End of Q1 | Direct outreach + content |

**Key Metric:** Validate that 8% of users convert to paid within 7 days.

---

### Q2 (Months 4-6): Growth Engine

**Objective:** Hit $50K MRR; validate TikTok as primary acquisition channel; launch electrical vertical.

| Activity | Target | Channel |
|----------|--------|---------|
| TikTok content: 5 posts/week | 50K followers by Month 6 | TikTok |
| Launch electrical vertical (50 guides) | Month 6 | Product |
| Implement referral program | Month 4 | In-app |
| Trade school partnerships (3 schools) | Months 5-6 | Direct outreach |
| ASO optimization (keywords, screenshots) | Ongoing | App Store, Google Play |
| Hit 30K total users | Month 6 | All channels |
| Hit $50K MRR | Month 6 | Conversion optimization |

**Key Metric:** CAC < $25; Day-30 retention > 35%.

---

### Q3 (Months 7-9): Vertical Expansion

**Objective:** Hit $200K MRR; launch HVAC vertical; implement offline mode; build competitive moat.

| Activity | Target | Channel |
|----------|--------|---------|
| Launch HVAC vertical (40 guides) | Month 8 | Product |
| Launch offline mode (Master tier) | Month 9 | Product |
| Launch certifications/learning paths | Month 9 | Product |
| YouTube channel launch (long-form content) | Month 7 | YouTube |
| Trade show presence (2 regional shows) | Months 8-9 | Events |
| Hit 100K total users | Month 9 | All channels |
| Hit $200K MRR | Month 9 | Growth + expansion revenue |

**Key Metric:** Multi-trade users have 30% lower churn than single-trade users.

---

### Q4 (Months 10-12): Scale & Optimize

**Objective:** Hit $400K MRR; optimize unit economics; prepare for fundraise.

| Activity | Target | Channel |
|----------|--------|---------|
| A/B test pricing (test $39 Pro, $59 Master) | Months 10-11 | RevenueCat |
| Launch web signup (Stripe, bypass Apple 30%) | Month 10 | Web |
| Implement annual plan push (in-app campaign) | Month 11 | In-app |
| SEO: rank for "plumbing app", "electrical code app" | Ongoing | Content marketing |
| Hit 150K total users | Month 12 | All channels |
| Hit $400K MRR | Month 12 | Growth + optimization |
| Series A preparation | Month 12 | Fundraising |

**Key Metric:** ARPU increase from $35 to $38+ via annual plans and pricing optimization.

---

### Month 18: $1M MRR Target

| Metric | Target Value |
|--------|-------------|
| Total registered users | 350,000+ |
| Monthly active users | 250,000+ |
| Paying subscribers | 28,572+ |
| ARPU | $35+ |
| MRR | $1,000,000 |
| ARR | $12,000,000 |
| Monthly churn | < 5% |
| LTV:CAC | > 10:1 |
| Gross margin | > 88% |
| Team size | 8-12 people |

---

## Customer Acquisition Channels

### Channel 1: TikTok / Instagram Reels / YouTube Shorts (35% of users)

**Strategy:** Create authentic, trade-relevant content that showcases FieldLens in action on real job sites. The content must be genuinely useful or entertaining to tradespeople, not a product demo.

**Content Types:**
- "Watch FieldLens catch this mistake in real-time" (demo + education)
- Trade tips and tricks (educational, FieldLens mentioned naturally)
- "Day in the life" of a plumber/electrician using FieldLens
- Code compliance "did you know?" shorts
- Before/after job completion with FieldLens photo docs
- "Apprentice tries [task] with AI coaching" series

**Metrics:**
- Post frequency: 5 per week across platforms
- Target: 100K followers within 6 months
- Conversion: 2-3% of profile visitors download the app
- CAC via social: ~$5-10 (organic content, creator time only)

**Why TikTok Works for Trades:**
- Trade workers aged 22-35 are highly active on TikTok
- Trade content performs exceptionally well on TikTok (authenticity, blue-collar pride, satisfying visuals)
- Zero direct competitors creating AI + trades content
- Viral potential: one good video can drive 10,000+ downloads

---

### Channel 2: App Store Optimization (ASO) (25% of users)

**Strategy:** Rank for high-intent trade-related keywords in both app stores. Tradespeople actively search for apps to help with their work.

**Target Keywords:**
| Keyword | Monthly Search Volume (Est.) | Competition |
|---------|------------------------------|-------------|
| plumbing app | 5,000-10,000 | Low |
| electrician app | 3,000-7,000 | Low |
| hvac app | 2,000-5,000 | Low |
| plumbing code | 3,000-5,000 | Low |
| electrical code app | 2,000-4,000 | Low |
| trade apprentice app | 1,000-3,000 | Very Low |
| pipe sizing calculator | 1,000-2,000 | Low |
| construction AI | 500-1,000 | Very Low |

**ASO Optimization:**
- App title: "FieldLens - AI Trade Coach"
- Subtitle: "Plumbing, Electrical & HVAC"
- 5 screenshots showing: AI camera in action, error detection, task guide, voice interaction, progress tracking
- App preview video: 15-second demo of AI camera coaching
- Keyword field: maximize with trade-specific terms
- Localization: English US primary; future: Spanish (large trade workforce)

**CAC via ASO: ~$0** (organic discovery; only cost is time to optimize listing)

---

### Channel 3: Referral Program (20% of users)

**Strategy:** Tradespeople work alongside each other, share tools and tips at supply houses, and talk at trade counters. A referral program taps into this natural word-of-mouth.

**Referral Mechanics:**
- Referrer gets: 1 free month of Pro (or $10 credit toward Master)
- Referee gets: 7-day free Pro trial (vs. standard 3-day)
- Shareable link: fieldlens.app/ref/[username]
- Share via: text message, WhatsApp (primary), in-person QR code
- Referral tracked via Branch.io or custom deep links

**Why Referrals Work in Trades:**
- Tradespeople are in constant contact at supply houses (Ferguson, Home Depot Pro Desk)
- Apprentices copy what journeymen use -- strong top-down adoption
- Job site conversations: "What app is that?" is a natural trigger
- Trade-specific WhatsApp/iMessage groups are common
- Credibility: recommendation from a fellow tradesperson > any ad

**CAC via referral: ~$29** (cost of one free month for referrer)

---

### Channel 4: Trade School Partnerships (10% of users)

**Strategy:** Partner with trade schools and apprenticeship programs to offer FieldLens as a supplementary training tool. Students adopt FieldLens during training and continue using it in their careers.

**Partnership Model:**
- Free Master-tier access for enrolled students (duration of program)
- FieldLens branded as "recommended tool" in program materials
- Instructor dashboard (simplified) showing student progress
- Co-marketing: FieldLens logo on school website; school name in FieldLens case studies
- Revenue: Students convert to paid after graduation at higher rate (familiar with product)

**Target Partners:**
- Community college trade programs (1,200+ in the US)
- NCCER-accredited training centers
- Union apprenticeship programs (UA, IBEW, SMWIA)
- Private trade schools (e.g., Tulsa Welding School, Lincoln Tech)

**CAC via trade schools: ~$0-15** (no direct cost; some co-marketing expense; high LTV users)

---

### Channel 5: SEO & Content Marketing (10% of users)

**Strategy:** Create a content hub on fieldlens.app/blog covering trade topics, code references, and how-to guides. Rank for long-tail keywords that tradespeople search.

**Content Types:**
- "How to [trade task]" articles (500+ words, with diagrams)
- Code reference pages ("IPC 2021 Section 708: Cleanouts Explained")
- Tool and material guides ("PEX vs. Copper: Which to Use When")
- Career articles ("How Much Do Plumbers Make in [State]?")
- FieldLens product updates and feature announcements

**Target SEO Keywords:**
- "how to install a water heater" (50K+ monthly searches)
- "plumbing code requirements" (10K+ monthly searches)
- "NEC wire sizing chart" (15K+ monthly searches)
- "how to become a plumber" (30K+ monthly searches)
- "plumbing apprentice salary" (10K+ monthly searches)

**CAC via SEO: ~$5** (content creation cost, amortized over time)

---

## Target Customer Profile

### Primary: Independent Journeyman

| Attribute | Detail |
|-----------|--------|
| **Age** | 25-40 |
| **Trade** | Plumbing (initial), Electrical, HVAC |
| **Experience** | 3-8 years (journeyman level) |
| **Employment** | Independent (own small business or 1099 contractor) |
| **Income** | $50,000-$85,000/year |
| **Location** | Suburban/urban US |
| **Phone** | iPhone 12+ or Samsung Galaxy S21+ (2-3 year old phone) |
| **Pain Point** | Works alone; no mentor on-site; callbacks from mistakes cost $200-500 each; code compliance uncertainty |
| **Motivation** | Avoid callbacks, build confidence, work faster, grow business |
| **Price Sensitivity** | Low for tools that save time/money; already spends $100-300/month on tools and supplies |
| **Decision Driver** | "Will this pay for itself?" (Answer: yes, within one prevented callback) |

### Secondary: Apprentice

| Attribute | Detail |
|-----------|--------|
| **Age** | 18-28 |
| **Trade** | Any (often plumbing or electrical first) |
| **Experience** | 0-3 years (apprentice level) |
| **Employment** | Employed by a contractor; learning on the job |
| **Income** | $30,000-$50,000/year |
| **Phone** | Recent smartphone (Gen Z, tech-native) |
| **Pain Point** | Limited mentorship time; afraid to ask "dumb questions"; wants to learn faster |
| **Motivation** | Get better faster, impress employer, earn journeyman license sooner |
| **Price Sensitivity** | Moderate; $29/month is significant but employer may pay |
| **Decision Driver** | "Will this help me learn?" and "Do other tradespeople use this?" |

### Tertiary: Master / Business Owner

| Attribute | Detail |
|-----------|--------|
| **Age** | 35-55 |
| **Trade** | Plumbing, Electrical, or HVAC |
| **Experience** | 10+ years (master level) |
| **Employment** | Business owner with 2-10 employees |
| **Income** | $80,000-$150,000/year |
| **Phone** | iPhone (business owner demographic) |
| **Pain Point** | Training new hires takes too much time; inconsistent quality across crew; liability concerns |
| **Motivation** | Tool for crew training; reduce callbacks; maintain quality standards; documentation for inspections |
| **Price Sensitivity** | Very low; $49/seat/month is trivial compared to labor costs |
| **Decision Driver** | "Will this make my crew more independent?" (B2B expansion opportunity) |

---

## Conversion Funnel

```
App Store Impression
      | (30% tap rate -- strong screenshots and reviews)
      v
App Store Page
      | (40% download rate -- clear value prop, good ratings)
      v
Download & Install
      | (70% open rate -- immediate need, high intent)
      v
Onboarding (Trade + Level)
      | (85% completion -- only 3 screens, 60 seconds)
      v
First AI Camera Use
      | (60% of onboarded users try camera on day 1)
      v
"Aha Moment": AI catches an error or confirms correct work
      | (Target: 80% of first-use users get a meaningful result)
      v
Second Session (Day 2-3)
      | (50% return for second session)
      v
Hit Free Limit (Day 3-7)
      | (User sees value, wants more)
      v
Paywall Shown
      | (8% conversion -- compelling upgrade, clear ROI)
      v
Paying Subscriber
```

### Paywall Timing Strategy

| Trigger | When | Conversion Rate |
|---------|------|----------------|
| **Soft paywall** | After 3rd analysis/day (free limit) | 5-6% |
| **Feature gate** | Tapping a premium guide | 3-4% |
| **End-of-task prompt** | After completing first task with AI | 8-10% (highest) |
| **Weekly summary** | "You caught 5 errors this week. Upgrade for unlimited." | 4-5% |
| **Streak milestone** | "7-day streak! Unlock unlimited with Pro." | 6-7% |

**Best timing: Show primary paywall after the user completes their first AI-assisted task** and sees the completion summary with errors caught. This is peak perceived value.

---

## Churn Analysis & Mitigation

### Expected Churn Patterns

| Churn Reason | Expected % of Churners | Mitigation |
|-------------|----------------------|-----------|
| **Seasonal slowdown** (winter for some trades) | 25% | Annual plans lock in revenue; push maintenance/indoor tasks in winter |
| **Perceived value decline** ("learned enough") | 20% | New guides monthly; expand trades; certifications create ongoing engagement |
| **Price sensitivity** | 15% | Annual discount (28-29%); demonstrate ROI in app ("You saved $X this month") |
| **Technical issues** | 10% | Sentry monitoring; fast bug fixes via OTA updates; responsive support |
| **Switched trades** | 10% | Multi-trade support; Master tier covers all trades |
| **Left the industry** | 10% | Cannot mitigate; natural churn |
| **Found alternative** | 10% | Stay ahead with features; community moat; content moat |

### Churn Reduction Tactics

| Tactic | Expected Impact | Implementation |
|--------|----------------|---------------|
| Annual plan push (reduce monthly churn to 0% for annual users) | -15% overall churn | RevenueCat paywall A/B test; in-app campaign at month 3 |
| Monthly "Value Report" push notification | -5% churn | "This month: 12 tasks, 8 errors caught, est. $1,200 saved" |
| New guide content every 2 weeks | -10% churn | Continuous content creation; user-requested guides |
| Streak + gamification | -8% churn | Streak recovery, achievements, leaderboards |
| Win-back campaign (email at Day 3, 7, 14 post-churn) | 10-15% reactivation | "We miss you. Here is 50% off your first month back." |

---

## Expansion Revenue Opportunities

### Near-Term (Months 6-18)

| Opportunity | Revenue Impact | Effort |
|------------|---------------|--------|
| **Price increase (Pro $29 to $35, Master $49 to $59)** | +15% ARPU | Low (RevenueCat A/B test) |
| **Annual plan adoption (target 40% of paid users)** | -20% churn, +10% LTV | Low (marketing campaign) |
| **Electrical vertical** (50 guides) | +30% addressable market | Medium (content creation) |
| **HVAC vertical** (40 guides) | +25% addressable market | Medium (content creation) |

### Medium-Term (Months 12-24)

| Opportunity | Revenue Impact | Effort |
|------------|---------------|--------|
| **B2B / Employer seats** ($15-25/seat/month) | +$500K-1M ARR | High (web dashboard, multi-tenant) |
| **Trade school licensing** ($5K-15K/school/year) | +$200K-500K ARR | Medium (custom plans, instructor tools) |
| **Web subscriptions (bypass Apple 30% cut)** | +8-10% margin improvement | Medium (Stripe Checkout, web app) |
| **Carpentry vertical** (40 guides) | +20% addressable market | Medium (content creation) |

### Long-Term (Months 24-36)

| Opportunity | Revenue Impact | Effort |
|------------|---------------|--------|
| **International expansion** (UK, Canada, Australia first) | +100% TAM | High (code localization, regulations) |
| **Hardware partnerships** (smart glasses, IoT sensors) | +$1-5M ARR | High (partnerships, SDK development) |
| **Insurance partnerships** (reduced premiums for FieldLens users) | +$500K-2M ARR | High (data, partnerships, compliance) |
| **Marketplace** (connect tradespeople with homeowners) | +$2-5M ARR | Very High (two-sided marketplace) |
| **Certification marketplace** (industry-recognized credentials) | +$1-3M ARR | High (partnerships with trade orgs) |

---

## Financial Projections Summary

### Year 1 (Months 1-12)

| Metric | Value |
|--------|-------|
| Total registered users | 150,000 |
| Paying subscribers (end of year) | 11,374 |
| MRR (end of year) | $398,090 |
| ARR (end of year) | $4,777,080 |
| Total revenue (Year 1) | $1,914,430 |
| Total costs (infrastructure + AI) | ~$230,000 |
| Gross profit | ~$1,684,430 |
| Gross margin | ~88% |

### Year 2 (Months 13-24)

| Metric | Value |
|--------|-------|
| Total registered users | 500,000+ |
| Paying subscribers (end of year) | 40,000+ |
| MRR (end of year) | $1,400,000+ |
| ARR (end of year) | $16,800,000+ |
| Total revenue (Year 2) | $12,000,000+ |
| B2B revenue (incremental) | $500,000+ |
| Gross margin | ~90% (improving with scale) |

### Valuation Trajectory

| Milestone | Timing | Revenue Multiple | Implied Valuation |
|-----------|--------|-----------------|-------------------|
| Seed / Pre-seed | Month 0-3 | N/A | $2-5M (idea + team + market) |
| Post-launch traction | Month 6 | 40-60x ARR | $20-40M |
| $1M MRR | Month 18-21 | 30-40x ARR | $360-480M |
| $5M MRR | Month 30 | 25-35x ARR | $1.5-2.1B |
| $10M MRR | Month 36 | 20-30x ARR | $2.4-3.6B |

**Revenue multiples based on:** High-growth B2C SaaS / consumer AI benchmarks; strong gross margins (>88%); low churn (< 5%/mo); large TAM ($50B+); expanding vertical AI market.

---

## Key Assumptions & Risks

### Assumptions

| Assumption | Confidence | If Wrong |
|-----------|-----------|---------|
| 8% free-to-paid conversion | Medium-High | 5% conversion extends timeline by 40% |
| 5% monthly churn | Medium | 7% churn reduces LTV by 30% |
| GPT-4o Vision accuracy sufficient for trade work | High | May need fine-tuning ($50-100K investment) |
| TikTok is effective for trade audience | High | Shift budget to YouTube, trade publications |
| Tradespeople will pay $29-49/month | High | Price sensitivity data from beta will validate |
| $25 blended CAC achievable | Medium | Higher CAC extends payback period |

### Risks

| Risk | Severity | Mitigation |
|------|---------|-----------|
| AI gives incorrect guidance (liability) | High | Disclaimer: "coaching tool, not a substitute for professional judgment"; insurance; structured prompts with conservative defaults |
| Apple increases IAP commission (30%) | Medium | Accelerate web subscriptions via Stripe (2.9% + 0.30) |
| OpenAI raises prices significantly | Medium | Swap to Anthropic Claude, Google Gemini, or fine-tuned open-source model |
| Direct competitor with trade expertise | Medium | Content moat (guides), data moat (labeled images), community moat (first mover) |
| Slow adoption by older tradespeople | Low | Focus on 22-35 age demographic first; older workers adopt via employer push |
| Regulatory issues (unlicensed guidance claims) | Medium | Legal review of all copy; position as "coaching" not "certification"; partner with licensed professionals for content review |
