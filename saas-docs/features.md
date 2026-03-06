# FieldLens Features

**MVP features, post-MVP roadmap, priority matrix, and month-by-month timeline.**

---

## Feature Philosophy

Every feature in FieldLens must pass the **Jobsite Test**: Would a plumber with wet hands, kneeling under a sink, in a dim crawlspace, actually use this? If a feature requires fine motor control, extensive reading, or calm focus, it does not belong in the MVP. FieldLens is a tool used during physical labor, not after it.

---

## MVP Features (Months 1-4)

### F1: AI Camera Analysis (Core Feature)

**What it does:** User points phone camera at their work. FieldLens analyzes the image in real-time using GPT-4o Vision and provides spoken + visual feedback about correctness, errors, and next steps.

**User Story:**
> As a journeyman plumber working solo on a residential water heater installation, I want to point my phone at my work and get instant expert feedback so I can catch mistakes before they become callbacks.

**Acceptance Criteria:**
- [ ] Camera opens in < 1 second from tap
- [ ] On-device TFLite pre-screening filters non-work images in < 200ms
- [ ] GPT-4o Vision analysis returns results in < 3 seconds on 4G connection
- [ ] Response is spoken aloud via ElevenLabs TTS (hands-free)
- [ ] Visual overlay shows green (correct), yellow (attention), or red (error) indicator
- [ ] Camera works in low-light conditions (auto torch suggestion)
- [ ] Camera works in landscape and portrait orientations
- [ ] Analysis works without active task guide (general assessment mode)
- [ ] Analysis is context-aware when a task guide is active (step-specific feedback)
- [ ] User can take a snapshot for documentation during analysis
- [ ] Rate limited to prevent excessive API costs (1 analysis per 5 seconds minimum)

**Technical Details:**
- Image captured at 1024x1024, compressed to WebP (< 100KB)
- TFLite scene classifier runs on every frame, triggers API call on valid scenes
- GPT-4o Vision prompt includes active task context, user trade, experience level
- Structured JSON response parsed and displayed as overlay + spoken audio
- Fallback to text-only display if TTS fails

#### Error Handling
| Condition | User Message | Retry | Fallback |
|-----------|-------------|-------|----------|
| Network timeout during analysis | "Connection lost. Your image is saved — analysis will resume when reconnected." | Auto-retry 3x with 2s backoff | Queue image for analysis on reconnect |
| GPT-4o Vision API rate limit | "High demand. Analysis queued — you're next." | Exponential backoff (2s/4s/8s) | On-device TFLite basic assessment |
| TFLite model load failure | "Restarting analysis engine..." | Auto-reload model 2x | Skip pre-screening, send directly to API |
| Camera permission denied | "Camera access is required for AI coaching. Tap to enable in Settings." | N/A | Deep link to device Settings |
| Low-light detection failure | "Too dark for accurate analysis. Try turning on your flashlight." | N/A | Auto-suggest torch toggle |
| Image compression failure | "Image processing error. Please try again." | Auto-retry 2x | Send uncompressed with size warning |
| TTS audio playback failure | "Voice feedback unavailable. Showing text results." | Auto-retry 1x | Display text-only overlay |
| API returns malformed JSON | "Analysis incomplete. Retrying..." | Auto-retry 2x with fresh request | Show partial results with disclaimer |

#### Data Validation
| Field | Type | Required | Min/Max | Pattern | Sanitization |
|-------|------|----------|---------|---------|-------------|
| image_data | binary (WebP) | yes | 10KB/100KB | WebP header magic bytes | Strip EXIF, resize to 1024x1024 |
| trade_type | enum | yes | N/A | plumbing\|electrical\|hvac | Validate against allowed enum |
| experience_level | enum | yes | N/A | apprentice\|journeyman\|master | Validate against allowed enum |
| task_context_id | UUID | no | 36/36 | UUID v4 | Trim whitespace, validate format |
| user_id | UUID | yes | 36/36 | UUID v4 | Trim whitespace, validate format |
| analysis_mode | enum | yes | N/A | general\|step_specific | Default to general if missing |
| device_lux_reading | float | no | 0/100000 | Numeric >= 0 | Clamp to valid range |

---

### F2: Plumbing Task Guide Library (50 Guides)

**What it does:** A searchable library of 50 step-by-step plumbing task guides covering the most common residential and light commercial plumbing tasks. Each guide includes steps, tools needed, materials, code references, and common error patterns.

**User Story:**
> As an apprentice plumber on my first solo service call, I want to look up "toilet rough-in" and get a step-by-step guide with pictures so I can complete the job without calling my journeyman.

**Acceptance Criteria:**
- [ ] Library loads in < 500ms
- [ ] Full-text search across task titles, descriptions, and tags
- [ ] Filter by category (rough-in, finish, repair, maintenance, emergency)
- [ ] Filter by difficulty (beginner, intermediate, advanced)
- [ ] Each guide shows: title, estimated time, difficulty, tools, materials, step count
- [ ] Tapping a guide opens Step-by-Step view (see F6)
- [ ] 15 guides available on free tier; 50 on Pro/Master
- [ ] Guides include applicable IPC/UPC code references
- [ ] Recently viewed guides section on library screen
- [ ] Bookmarking/favoriting guides for quick access

**MVP Plumbing Guide Categories (50 Total):**

| Category | Count | Examples |
|----------|-------|---------|
| **Rough-In** | 10 | Toilet rough-in, shower valve rough-in, kitchen sink rough-in, water heater rough-in, washing machine box, laundry drain, bathtub drain, basement bathroom rough-in, hose bib installation, gas line rough-in |
| **Fixture Installation** | 10 | Toilet install, faucet install (kitchen), faucet install (bathroom), garbage disposal, dishwasher connection, water heater install (tank), water heater install (tankless), shower head/arm, bathtub spout, ice maker line |
| **Repair** | 12 | Leaky faucet (compression), leaky faucet (cartridge), running toilet, clogged drain (snake), clogged drain (chemical-free), pipe leak repair (copper), pipe leak repair (PEX), pipe leak repair (PVC), water pressure issues, sump pump replacement, PRV replacement, toilet flange repair |
| **Maintenance** | 8 | Water heater flush, drain cleaning maintenance, PRV testing, shut-off valve exercise, pipe insulation, winterization, sump pump testing, water softener maintenance |
| **Emergency** | 5 | Main shut-off location, burst pipe temporary fix, sewer backup response, gas leak response, water heater relief valve discharge |
| **Code & Inspection** | 5 | DWV system overview, venting requirements, fixture unit calculations, minimum pipe sizing, inspection preparation checklist |

#### Error Handling
| Condition | User Message | Retry | Fallback |
|-----------|-------------|-------|----------|
| Guide content fails to load | "Couldn't load this guide. Checking your connection..." | Auto-retry 3x | Show cached version if available |
| Search index unavailable | "Search is temporarily unavailable. Browse by category instead." | Background retry every 30s | Category-only navigation |
| Guide images fail to load | "Images loading slowly. Text instructions are ready." | Lazy retry on scroll | Text-only step display |
| Bookmark sync failure | "Bookmark saved locally. Will sync when connected." | Auto-sync on reconnect | Local-only bookmark storage |
| Database query timeout | "Loading guides... taking longer than usual." | Auto-retry 2x with timeout increase | Return partial results |
| Content version mismatch | "Updated guide available. Refreshing..." | Auto-fetch latest version | Display cached version with update badge |

#### Data Validation
| Field | Type | Required | Min/Max | Pattern | Sanitization |
|-------|------|----------|---------|---------|-------------|
| search_query | string | no | 1/100 | Alphanumeric + spaces | Trim, escape special chars, lowercase |
| category_filter | enum | no | N/A | rough_in\|fixture\|repair\|maintenance\|emergency\|code | Validate against allowed values |
| difficulty_filter | enum | no | N/A | beginner\|intermediate\|advanced | Validate against allowed values |
| guide_id | UUID | yes | 36/36 | UUID v4 | Trim whitespace, validate format |
| page_offset | integer | no | 0/1000 | Non-negative integer | Clamp to valid range, default 0 |
| page_limit | integer | no | 1/50 | Positive integer | Clamp to 1-50, default 20 |

---

### F3: Real-Time Error Detection

**What it does:** During AI camera analysis, the system specifically identifies errors, code violations, and safety hazards. Errors are categorized by severity and accompanied by specific fix instructions.

**User Story:**
> As a plumber installing a P-trap, I want FieldLens to catch that my trap arm slope is incorrect before I glue the joint so I do not have to tear it out and redo it.

**Acceptance Criteria:**
- [ ] Errors categorized as: `warning` (suboptimal but functional), `critical` (code violation or will fail), `safety` (immediate safety risk)
- [ ] Each error includes: what is wrong, why it matters, how to fix it, applicable code reference
- [ ] Safety errors trigger prominent red overlay + urgent voice tone
- [ ] Warning errors shown in yellow with calm voice guidance
- [ ] Error detection works for: incorrect measurements, wrong materials, code violations, safety hazards, improper technique
- [ ] Errors logged to task session for review and learning
- [ ] User can dismiss a warning with "I know" voice command (logged but cleared from view)
- [ ] Error count tracked in user profile (gamification: "errors caught")
- [ ] False positive rate < 15% (measured via user dismissals and corrections)

**Error Detection Categories:**

| Category | Examples | Severity |
|----------|---------|----------|
| **Measurement** | Incorrect pipe slope, wrong pipe size, insufficient clearance | Warning / Critical |
| **Material** | Wrong pipe type for application, incompatible fittings, wrong solder type | Critical |
| **Code** | Missing cleanout, improper venting, insufficient air gap | Critical |
| **Safety** | No PPE visible, water near electrical, improper gas line handling | Safety |
| **Technique** | Poor joint preparation, insufficient solder, uneven cuts | Warning |
| **Sequence** | Skipped step, out-of-order assembly, missed test | Warning |

#### Error Handling
| Condition | User Message | Retry | Fallback |
|-----------|-------------|-------|----------|
| Error detection model timeout | "Analysis is taking longer than expected. Basic check in progress." | Auto-retry 1x | Return TFLite-only basic safety check |
| Code reference database unavailable | "Code references temporarily unavailable. Error detection continues." | Background retry every 60s | Flag error without code citation |
| False positive reported by user | "Thanks for the feedback. Noted for accuracy improvement." | N/A | Log dismissal, reduce confidence for similar patterns |
| Error logging to Supabase fails | "Error details saved locally. Will sync later." | Auto-sync on reconnect | Local SQLite error log |
| Severity classification conflict | "Multiple assessments detected. Showing highest severity for safety." | N/A | Always escalate to higher severity |
| Simultaneous multiple errors detected | "Multiple issues found. Showing safety concerns first." | N/A | Priority queue: safety > critical > warning |

#### Data Validation
| Field | Type | Required | Min/Max | Pattern | Sanitization |
|-------|------|----------|---------|---------|-------------|
| error_severity | enum | yes | N/A | warning\|critical\|safety | Validate against allowed values |
| error_category | enum | yes | N/A | measurement\|material\|code\|safety\|technique\|sequence | Validate against enum |
| code_reference | string | no | 0/50 | IPC/UPC section format | Trim, validate against code database |
| user_dismissal | boolean | no | N/A | true\|false | Default false |
| session_id | UUID | yes | 36/36 | UUID v4 | Trim whitespace, validate format |
| confidence_score | float | yes | 0.0/1.0 | Decimal 0-1 | Clamp to valid range, round to 2 decimals |
| fix_instruction | string | yes | 10/500 | Free text | Sanitize HTML, trim whitespace |

---

### F4: Voice Interaction (Hands-Free)

**What it does:** Users interact with FieldLens via voice commands. They can ask questions, request analysis, navigate steps, and receive all feedback as spoken audio. This is critical because tradespeople have dirty, wet, or gloved hands and cannot touch their phone.

**User Story:**
> As an electrician with insulated gloves on, I want to say "FieldLens, check this" and get a spoken response about my wiring so I never have to take off my gloves or put down my tools.

**Acceptance Criteria:**
- [ ] Wake phrase: "Hey FieldLens" or button tap to start listening
- [ ] Voice command recognition via Whisper API in < 1.5 seconds
- [ ] Supported commands: "check this", "next step", "previous step", "what step am I on", "what tools do I need", "read the code", "take a photo", "I am done"
- [ ] Natural language questions supported: "Is this the right size pipe?", "What is the code for vent distance?"
- [ ] TTS responses via ElevenLabs with professional male and female voice options
- [ ] TTS volume adjustable; works with Bluetooth earpiece/speaker
- [ ] Voice works in noisy environments (construction noise filtering via Whisper)
- [ ] Visual feedback when listening (pulsing mic indicator)
- [ ] Conversation context maintained within a task session
- [ ] Voice interaction optional (all actions also available via touch)

**Voice Command Reference:**

| Command | Action | Voice Response |
|---------|--------|---------------|
| "Check this" / "Analyze" | Trigger camera analysis | AI feedback on current view |
| "Next step" | Advance to next step in guide | Read next step aloud |
| "Previous step" / "Go back" | Return to previous step | Read previous step aloud |
| "What step am I on?" | State current position | "You are on step 4 of 12: Connect the supply line" |
| "What tools do I need?" | List tools for current step | Read tool list |
| "Read the code" | Read applicable code reference | Read relevant code section |
| "Take a photo" | Capture current camera frame | "Photo saved" |
| "I'm done" / "Finish" | Complete current task | Summary + save session |
| "Help" | List available commands | Read command list |
| Any question | Natural language AI response | Contextual answer |

#### Error Handling
| Condition | User Message | Retry | Fallback |
|-----------|-------------|-------|----------|
| Whisper API timeout | "Didn't catch that. Try again or tap the screen." | Auto-retry 1x | Display touch-based command menu |
| Wake phrase not detected in noisy environment | (Visual pulse on mic icon indicating listening attempt) | Continuous listening for 10s | Suggest Bluetooth earpiece or tap-to-talk |
| ElevenLabs TTS API failure | "Voice output unavailable. Showing text response." | Auto-retry 2x | On-device system TTS as fallback |
| Unrecognized voice command | "I didn't understand that. Try 'check this' or 'next step'." | N/A | Display available commands list |
| Bluetooth audio disconnection | "Audio device disconnected. Switching to phone speaker." | Auto-reconnect on BT restore | Phone speaker output |
| Microphone permission denied | "Microphone access needed for voice commands. Tap to enable." | N/A | Touch-only mode with all voice features disabled |
| Context window exceeded | "Starting a fresh conversation context." | N/A | Reset context, retain current task step |

#### Data Validation
| Field | Type | Required | Min/Max | Pattern | Sanitization |
|-------|------|----------|---------|---------|-------------|
| audio_input | binary (WAV) | yes | 1KB/5MB | WAV/M4A header bytes | Validate audio format, reject silence-only |
| voice_command | string | no | 1/200 | Whisper transcription output | Trim, lowercase, strip profanity |
| tts_voice_id | enum | yes | N/A | male_professional\|female_professional | Validate against available voices |
| audio_volume | float | no | 0.0/1.0 | Decimal 0-1 | Clamp to valid range |
| session_context | JSON | no | 0/10KB | Valid JSON object | Validate schema, truncate if oversized |
| language_code | enum | yes | N/A | en-US | Validate against supported locales |

---

### F5: Task Progress Tracking

**What it does:** Tracks user progress through task guides, recording completed steps, time spent, errors caught, and photos taken. Builds a history of completed work.

**User Story:**
> As a plumber who just finished my first solo water heater install, I want to see a summary of the task including time taken, steps completed, and errors I caught so I can track my improvement over time.

**Acceptance Criteria:**
- [ ] Each task session tracks: steps completed, time per step, total time, errors detected, errors corrected, photos taken, AI interactions count
- [ ] Progress auto-saves every 30 seconds and on step completion
- [ ] Resume interrupted tasks from last completed step
- [ ] Task completion triggers summary screen with stats
- [ ] Historical task list shows all completed and abandoned tasks
- [ ] Streak tracking: consecutive days with at least one task interaction
- [ ] Stats visible on Progress Dashboard: total tasks, total errors caught, total time, streak
- [ ] Data synced to Supabase; available across devices (same account)
- [ ] Free tier: last 5 task sessions visible; Pro/Master: unlimited history

#### Error Handling
| Condition | User Message | Retry | Fallback |
|-----------|-------------|-------|----------|
| Auto-save to Supabase fails | "Progress saved on your device. Will sync when connected." | Auto-retry every 30s | Local SQLite persistence |
| Session resume data corrupted | "Couldn't restore your last session. Starting fresh for this task." | N/A | Offer to start new session, preserve photos |
| Streak calculation error | "Streak data is refreshing..." | Background recalculate | Show last known streak with stale indicator |
| Cross-device sync conflict | "Your progress was updated on another device. Using the latest version." | N/A | Last-write-wins with conflict log |
| Storage quota exceeded (free tier) | "You've reached your session limit. Upgrade to keep unlimited history." | N/A | Allow current session but block viewing old ones |
| Analytics event push failure | "No impact to your experience. Analytics will sync later." | Batch retry every 5 min | Local event queue with 7-day retention |

#### Data Validation
| Field | Type | Required | Min/Max | Pattern | Sanitization |
|-------|------|----------|---------|---------|-------------|
| session_id | UUID | yes | 36/36 | UUID v4 | Trim whitespace, validate format |
| task_guide_id | UUID | yes | 36/36 | UUID v4 | Validate exists in guide library |
| step_number | integer | yes | 1/100 | Positive integer | Clamp to guide step count |
| step_duration_ms | integer | yes | 0/3600000 | Non-negative integer | Cap at 1 hour, flag outliers |
| errors_detected | integer | yes | 0/999 | Non-negative integer | Clamp to valid range |
| photos_taken | integer | yes | 0/100 | Non-negative integer | Clamp to tier photo limit |
| completion_status | enum | yes | N/A | in_progress\|completed\|abandoned | Validate against allowed values |
| total_duration_ms | integer | no | 0/86400000 | Non-negative integer | Sum of step durations, auto-calculated |

---

### F6: Step-by-Step Guide View

**What it does:** When a user selects a task from the library, it opens in a step-by-step guide view. Each step shows instructions, reference images, tools needed, and a button to launch AI camera coaching for that specific step.

**User Story:**
> As an apprentice following a toilet installation guide, I want to see one clear step at a time with a picture of what it should look like and a button to check my work with the camera.

**Acceptance Criteria:**
- [ ] One step displayed at a time (no overwhelming multi-step view)
- [ ] Each step shows: step number, instruction text, reference image, tools for this step, estimated time, tips
- [ ] "Check My Work" button launches AI camera with step-specific context
- [ ] Swipe left/right or voice command to navigate steps
- [ ] Step completion checkmark (manual or AI-confirmed)
- [ ] Progress bar at top shows position in overall task
- [ ] Code reference expandable panel on relevant steps
- [ ] "Common Mistakes" expandable panel with photos of errors
- [ ] Step instructions available as audio (TTS read-aloud)
- [ ] Landscape mode supported (phone propped up while working)

#### Error Handling
| Condition | User Message | Retry | Fallback |
|-----------|-------------|-------|----------|
| Step content fails to load | "Step details loading... Check your connection." | Auto-retry 3x | Show cached step text without images |
| Reference image unavailable | "Reference image unavailable. Text instructions are ready." | Background retry | Text-only step with description of expected result |
| AI camera context handoff fails | "Camera coaching starting in general mode." | N/A | Launch camera without step-specific context |
| Step navigation out of bounds | "You're on the last step. Tap 'Finish' to complete." | N/A | Disable forward navigation, show completion prompt |
| Code reference panel load failure | "Code reference unavailable offline. Proceed with step instructions." | Auto-retry 1x | Hide code panel, show general compliance note |
| TTS step read-aloud failure | "Audio unavailable. Showing step text on screen." | Auto-retry 1x | System TTS fallback, then text-only display |

#### Data Validation
| Field | Type | Required | Min/Max | Pattern | Sanitization |
|-------|------|----------|---------|---------|-------------|
| guide_id | UUID | yes | 36/36 | UUID v4 | Trim whitespace, validate format |
| current_step | integer | yes | 1/100 | Positive integer | Clamp to guide total steps |
| step_completed | boolean | yes | N/A | true\|false | Default false |
| completion_method | enum | no | N/A | manual\|ai_confirmed | Validate against allowed values |
| navigation_direction | enum | yes | N/A | forward\|backward\|jump | Validate against allowed values |
| orientation | enum | no | N/A | portrait\|landscape | Auto-detect from device |

---

### F7: Photo Documentation

**What it does:** Users can capture photos during any task, which are automatically organized by task, step, and timestamp. Photos include AI analysis metadata. This creates a visual record of work done, useful for inspections, callbacks, and personal portfolio.

**User Story:**
> As a plumber who wants to show the inspector my rough-in before I close the wall, I want to take organized before/during/after photos of my work that I can pull up during the inspection.

**Acceptance Criteria:**
- [ ] Capture photo from camera view or dedicated photo mode
- [ ] Photos auto-tagged with: task name, step number, timestamp, trade, location (if permitted)
- [ ] AI analysis metadata attached to each photo (what was detected)
- [ ] Photos organized by task session in chronological order
- [ ] Gallery view with thumbnails; tap to expand
- [ ] Add text notes to any photo
- [ ] Share individual photos or entire task photo set (export as PDF or image gallery)
- [ ] Storage: Supabase Storage with CDN delivery
- [ ] Free tier: 50 photos total; Pro: 500/month; Master: unlimited
- [ ] Photos persist indefinitely for paid users

#### Error Handling
| Condition | User Message | Retry | Fallback |
|-----------|-------------|-------|----------|
| Photo upload to Supabase fails | "Photo saved on device. Will upload when connected." | Auto-retry every 60s | Local storage with upload queue |
| Storage quota exceeded | "Photo limit reached. Upgrade for more storage or delete old photos." | N/A | Block capture, show upgrade prompt |
| AI metadata attachment fails | "Photo saved without AI notes. Analysis will be added later." | Background retry on next sync | Store photo without metadata |
| PDF export generation fails | "Export failed. Trying again..." | Auto-retry 2x | Offer individual photo share as alternative |
| CDN delivery timeout for gallery | "Photos loading slowly..." | Auto-retry with lower resolution | Show thumbnails from local cache |
| Photo corruption detected | "One photo couldn't be loaded. Original may be recoverable." | N/A | Show placeholder with re-capture prompt |
| Location permission denied | "Photo saved without location data." | N/A | Tag with task name and timestamp only |

#### Data Validation
| Field | Type | Required | Min/Max | Pattern | Sanitization |
|-------|------|----------|---------|---------|-------------|
| photo_id | UUID | yes | 36/36 | UUID v4 | Trim whitespace, validate format |
| image_data | binary (JPEG) | yes | 50KB/10MB | JPEG/HEIC header bytes | Strip EXIF location if permission denied, compress to 2MB max |
| session_id | UUID | yes | 36/36 | UUID v4 | Validate exists in active sessions |
| step_number | integer | no | 1/100 | Positive integer | Validate against guide step count |
| text_note | string | no | 0/500 | Free text | Trim whitespace, sanitize HTML entities |
| tag_trade | enum | yes | N/A | plumbing\|electrical\|hvac | Validate against allowed values |
| gps_latitude | float | no | -90.0/90.0 | Decimal GPS coordinate | Validate range, round to 6 decimals |
| gps_longitude | float | no | -180.0/180.0 | Decimal GPS coordinate | Validate range, round to 6 decimals |

---

### Feature Dependency Graph

```
F1: AI Camera Analysis (Foundation)
├──→ F3: Real-Time Error Detection (depends on F1 camera + AI pipeline)
├──→ F4: Voice Interaction (depends on F1 for "check this" command trigger)
│     └──→ F6: Step-by-Step Guide View (depends on F4 for voice navigation + F2 for content)
├──→ F7: Photo Documentation (depends on F1 camera module)
│
F2: Plumbing Task Guide Library (Foundation — content)
├──→ F6: Step-by-Step Guide View (depends on F2 guide content)
│     └──→ F5: Task Progress Tracking (depends on F6 step completion events)
│           └──→ F7: Photo Documentation (enhanced by F5 session context)
│
Build Order: F1 + F2 (parallel) → F3 + F4 (parallel) → F6 → F5 → F7
```

---

## Post-MVP Features (Months 5-9)

### F8: Electrical Trade Vertical

**What it does:** Expand FieldLens beyond plumbing to cover electrical work. Includes 50 electrical task guides, NEC code references, electrical-specific error detection, and safety-focused AI prompting.

**User Story:**
> As an apprentice electrician, I want the same AI coaching I have seen plumbers use so I can get real-time guidance on residential wiring and panel work.

**Details:**
- 50 electrical task guides (residential focus): panel installation, circuit wiring, outlet/switch installation, GFCI/AFCI, lighting circuits, 240V circuits, grounding, conduit work, low voltage, troubleshooting
- NEC 2023 code database integration
- Electrical-specific TFLite model: wire color detection, gauge estimation, connection type identification
- Enhanced safety detection: live circuit warnings, grounding verification prompts, PPE checks
- Voltage/amperage reference calculator
- Wire sizing calculator based on load and run length

**Timeline:** Months 5-6
**Effort:** 6-8 weeks (content creation is the bottleneck, not engineering)

---

### F9: HVAC Trade Vertical

**What it does:** Third trade vertical covering heating, ventilation, and air conditioning. Includes task guides, IMC/IRC code references, and HVAC-specific diagnostics.

**User Story:**
> As a solo HVAC tech doing a furnace replacement, I want step-by-step guidance including gas line connections, venting, and electrical hookup with code compliance checks.

**Details:**
- 40 HVAC task guides: furnace installation, AC installation, mini-split installation, ductwork, gas piping, refrigerant handling, thermostat wiring, maintenance procedures, troubleshooting
- IMC 2021 and IRC mechanical code references
- HVAC-specific diagnostics: temperature differential analysis (via phone thermal data or manual input), airflow assessment, refrigerant line sizing
- Safety: gas leak detection protocols, refrigerant handling (EPA 608 references), carbon monoxide awareness
- Integration with common HVAC diagnostic tools (future: Bluetooth multimeter data)

**Timeline:** Months 7-8
**Effort:** 6-8 weeks

---

### F10: Offline Mode

**What it does:** Download task guides, reference images, and TFLite models for use without internet connection. On-device analysis provides basic guidance. Full AI analysis queues for when connection is restored.

**User Story:**
> As a plumber working in a basement with no cell signal, I want to still access my task guide and get basic error detection from FieldLens so I am not stuck without guidance.

**Acceptance Criteria:**
- [ ] Download individual guides or entire trade packs for offline use
- [ ] Downloaded content includes: step text, reference images, code references, common errors
- [ ] TFLite models provide basic on-device analysis (tool detection, scene assessment, safety checks)
- [ ] Offline analysis clearly labeled as "Basic Mode" (not full AI accuracy)
- [ ] Photos captured offline are queued for AI analysis when online
- [ ] Voice commands work offline for guide navigation (on-device speech recognition)
- [ ] Sync progress automatically when connection restored
- [ ] Offline storage management: show size, allow selective deletion
- [ ] Master tier only (strong upgrade incentive)

**Timeline:** Month 8-9
**Effort:** 4-5 weeks

---

### F11: Certification & Learning Paths

**What it does:** Structured learning paths that guide users through trade skills in a logical progression. Completion of paths earns FieldLens certifications (digital badges) that can be shared on LinkedIn and shown to employers.

**User Story:**
> As an apprentice plumber in my first year, I want a structured learning path that takes me through residential plumbing tasks from basic to advanced so I can build skills systematically and show my progress to my employer.

**Details:**
- Learning paths organized by trade and experience level
- Example: "Residential Plumbing Fundamentals" (20 tasks, beginner)
- Each task in a path must be completed with AI verification (camera check)
- Minimum photo documentation required per task
- Quiz questions on code requirements at path milestones
- Digital certificate (PDF + shareable image) on path completion
- LinkedIn share integration
- Employer verification link (unique URL shows certificate details)
- Master tier feature

**Timeline:** Month 9
**Effort:** 3-4 weeks (leverages existing task infrastructure)

---

## Year 2+ Features (Months 13-24)

### F12: Smart Glasses Integration

**What it does:** Support for smart glasses (Meta Ray-Ban, Xreal Air) as an alternative to phone camera. True hands-free coaching with heads-up display of guidance overlays.

**Details:**
- Camera feed from smart glasses replaces phone camera
- Audio feedback through glasses speakers
- Always-on coaching mode (continuous analysis while working)
- Voice commands via glasses microphone
- Requires smart glasses SDK integration (Meta, Xreal)
- Premium feature: Master tier + potential hardware partnership

**Timeline:** Months 13-16

---

### F13: AR Overlay Guidance

**What it does:** Augmented reality overlays on the camera view showing exactly where to cut, drill, connect, or measure. Visual guides overlaid on the real world.

**Details:**
- AR markers showing: measurement lines, cut locations, connection points, flow direction
- Pipe fitting preview: see how a fitting will look before installing
- Level/plumb indicators using phone gyroscope
- Color-coded overlays matching error severity (green/yellow/red)
- Requires ARKit (iOS) and ARCore (Android) integration
- Expo bare workflow may be needed for native AR performance

**Timeline:** Months 15-18

---

### F14: Employer & Contractor Dashboards (B2B Expansion)

**What it does:** Web dashboard for plumbing companies, electrical contractors, and HVAC businesses to manage their crew's FieldLens usage, track training progress, and ensure quality standards.

**Details:**
- Employer creates organization; invites crew members
- Dashboard shows: team member progress, task completion rates, error rates, certifications earned
- Quality assurance: photo documentation for all jobs (searchable by address, date, task type)
- Training assignment: assign specific learning paths to team members
- Compliance tracking: ensure all crew members have completed required training
- Per-seat pricing: $15-25/seat/month on top of individual subscription
- Web app built with Next.js (Vercel deployment)
- Supabase row-level security handles multi-tenant data isolation

**Timeline:** Months 16-20

---

### F15: Community & Knowledge Sharing

**What it does:** In-app community where tradespeople can share tips, ask questions, post photos of tricky jobs, and learn from each other.

**Details:**
- Trade-specific forums (plumbing, electrical, HVAC)
- Photo posts with AI-assisted Q&A (FieldLens AI can answer community questions about posted photos)
- Upvote/downvote system for quality control
- Expert badges for users with verified certifications
- Moderation via AI content screening + community reports
- Integration with task guides (link community discussions to specific guide steps)

**Timeline:** Months 18-22

---

## Priority Matrix

### Impact vs. Effort Grid

```
                      HIGH IMPACT
                          |
     F3 Error Detection   |   F1 AI Camera (CORE)
     F4 Voice Interact.   |   F2 Task Library
     F5 Progress Track.   |
                          |
  LOW EFFORT ------------|------------- HIGH EFFORT
                          |
     F7 Photo Docs        |   F10 Offline Mode
     F6 Step-by-Step      |   F8 Electrical
                          |   F9 HVAC
                          |
                      LOW IMPACT
```

**Priority Order:**
1. F1 AI Camera Analysis (core value proposition; everything depends on this)
2. F2 Task Library (content is the product; 50 guides are the minimum for launch)
3. F4 Voice Interaction (hands-free is the key differentiator; without it, just another app)
4. F3 Error Detection (built into F1 but deserves dedicated tuning and testing)
5. F6 Step-by-Step Guide (UI for F2 content; straightforward to build)
6. F5 Progress Tracking (retention driver; gamification increases stickiness)
7. F7 Photo Documentation (monetization enabler; Pro feature that justifies $29/mo)

---

## User Stories (Complete)

### Epic 1: First-Time User Experience

| ID | Story | Priority | Sprint |
|----|-------|----------|--------|
| US-1.1 | As a new user, I want to sign up with Apple/Google SSO in under 30 seconds so I can start using the app immediately | Must-have | Sprint 1 |
| US-1.2 | As a new user, I want to select my trade and experience level so the app can personalize my experience | Must-have | Sprint 1 |
| US-1.3 | As a new user, I want a 60-second interactive demo showing me how to use the AI camera so I understand the value immediately | Must-have | Sprint 1 |
| US-1.4 | As a free user, I want to try 3 AI camera analyses per day so I can experience the product before committing to pay | Must-have | Sprint 2 |

### Epic 2: AI Camera Coaching

| ID | Story | Priority | Sprint |
|----|-------|----------|--------|
| US-2.1 | As a plumber, I want to point my camera at a pipe joint and get instant feedback on whether it is correct | Must-have | Sprint 2-3 |
| US-2.2 | As a user in a dim space, I want the app to suggest turning on the flashlight so I get better analysis results | Must-have | Sprint 3 |
| US-2.3 | As a user, I want to see a visual overlay (green/yellow/red) on my camera view so I can quickly understand the AI assessment | Must-have | Sprint 3 |
| US-2.4 | As a user, I want the AI to speak its feedback aloud so I do not have to look at my phone screen | Must-have | Sprint 3-4 |
| US-2.5 | As a user following a task guide, I want the AI to know which step I am on so its feedback is specific to what I am doing | Must-have | Sprint 4 |
| US-2.6 | As a user, I want the AI to tell me what specific building code applies to what I am doing so I can be confident in compliance | Should-have | Sprint 5 |

### Epic 3: Task Library & Guides

| ID | Story | Priority | Sprint |
|----|-------|----------|--------|
| US-3.1 | As a plumber, I want to search for "water heater install" and find a relevant guide in under 3 seconds | Must-have | Sprint 4 |
| US-3.2 | As a beginner, I want to filter guides by difficulty so I do not start with tasks beyond my skill level | Should-have | Sprint 4 |
| US-3.3 | As a user following a guide, I want to see one step at a time with a clear picture of what the result should look like | Must-have | Sprint 5 |
| US-3.4 | As a user, I want to bookmark guides I use frequently so I can access them quickly on future jobs | Should-have | Sprint 5 |
| US-3.5 | As a user, I want to hear the step instructions read aloud so I can follow the guide while keeping my hands on the work | Must-have | Sprint 5 |

### Epic 4: Voice Interaction

| ID | Story | Priority | Sprint |
|----|-------|----------|--------|
| US-4.1 | As a user with dirty hands, I want to say "next step" to advance the guide without touching my phone | Must-have | Sprint 3-4 |
| US-4.2 | As a user, I want to say "check this" to trigger a camera analysis without touching my phone | Must-have | Sprint 4 |
| US-4.3 | As a user, I want to ask natural questions like "what size pipe do I need here?" and get a spoken answer | Should-have | Sprint 6 |
| US-4.4 | As a user, I want visual feedback (pulsing mic icon) so I know when the app is listening to me | Must-have | Sprint 4 |

### Epic 5: Progress & Documentation

| ID | Story | Priority | Sprint |
|----|-------|----------|--------|
| US-5.1 | As a user, I want to see my total tasks completed, errors caught, and current streak on a dashboard | Should-have | Sprint 6 |
| US-5.2 | As a user, I want my task progress auto-saved so I can resume if I get interrupted | Must-have | Sprint 5 |
| US-5.3 | As a user, I want to capture and organize photos of my work by task and step | Should-have | Sprint 6 |
| US-5.4 | As a user, I want to share my task photos with an inspector or customer | Should-have | Sprint 7 |
| US-5.5 | As a user, I want to see how my speed and accuracy have improved over time | Nice-to-have | Sprint 8 |

### Epic 6: Subscription & Settings

| ID | Story | Priority | Sprint |
|----|-------|----------|--------|
| US-6.1 | As a free user hitting my daily limit, I want to see a clear upgrade prompt showing what Pro unlocks | Must-have | Sprint 7 |
| US-6.2 | As a subscriber, I want to manage my subscription from within the app | Must-have | Sprint 7 |
| US-6.3 | As a user, I want to choose between male and female AI voice | Nice-to-have | Sprint 8 |
| US-6.4 | As a user, I want to toggle between dark mode and light mode | Should-have | Sprint 6 |

---

## Month-by-Month Development Timeline

### Month 1: Foundation & Core AI

**Sprint 1 (Weeks 1-2):**
- Set up Expo project with TypeScript, Expo Router, NativeWind
- Configure Supabase project (auth, database, storage)
- Implement authentication (Apple SSO, Google SSO, magic link)
- Create onboarding flow (trade selection, experience level)
- Build basic navigation shell (tab bar, screen structure)
- Design system foundation (colors, typography, spacing, components)

**Sprint 2 (Weeks 3-4):**
- Implement camera module with Expo Camera
- Build TFLite scene classifier integration (on-device pre-screening)
- Create GPT-4o Vision API integration (Edge Function)
- Build camera overlay UI (assessment indicators)
- Implement basic AI analysis pipeline (capture -> compress -> analyze -> display)
- Free tier usage tracking (3 analyses/day)

**Deliverable:** App skeleton with working camera that sends images to GPT-4o Vision and displays text results.

---

### Month 2: Voice + Error Detection

**Sprint 3 (Weeks 5-6):**
- Integrate Whisper API for voice command recognition
- Build voice command parser (map transcriptions to app actions)
- Integrate ElevenLabs TTS for spoken AI responses
- Build voice interaction UI (listening indicator, audio controls)
- Implement error detection categorization (warning/critical/safety)
- Build error overlay UI (color-coded indicators with fix instructions)

**Sprint 4 (Weeks 7-8):**
- Connect voice commands to app actions (next step, check this, take photo)
- Refine AI prompting for error detection accuracy
- Build low-light detection and torch suggestion
- Implement conversation context within task sessions
- Performance optimization (image compression, response caching)
- Begin writing plumbing task guides (content creation)

**Deliverable:** Fully hands-free AI camera coaching with voice in/out and error detection.

---

### Month 3: Task Library + Guides

**Sprint 5 (Weeks 9-10):**
- Build task library screen with search and filters
- Create step-by-step guide view (single-step display, swipe navigation)
- Connect guide context to AI camera analysis (step-specific feedback)
- Build progress tracking system (step completion, time tracking, auto-save)
- Implement guide bookmarking and recent history
- Write 25 plumbing task guides (content creation continues)

**Sprint 6 (Weeks 11-12):**
- Build Progress Dashboard (stats, streaks, history)
- Build Photo Documentation module (capture, organize, annotate)
- Implement PostHog analytics (key events, funnels)
- Implement Sentry error tracking
- Dark mode implementation
- Write remaining 25 plumbing task guides (50 total complete)

**Deliverable:** Complete task library with 50 guides, progress tracking, photo docs.

---

### Month 4: Monetization + Polish + Launch

**Sprint 7 (Weeks 13-14):**
- Integrate RevenueCat SDK (subscription products, entitlements)
- Build paywall screens (free limit hit, feature gates)
- Implement tier-based feature gating (free vs Pro vs Master)
- Build Settings screen (profile, subscription, voice, notifications)
- App Store / Google Play listing preparation (screenshots, description, keywords)

**Sprint 8 (Weeks 15-16):**
- End-to-end testing on physical devices (iOS + Android)
- Performance profiling and optimization
- Accessibility audit (VoiceOver, TalkBack, contrast ratios)
- Beta testing with 20-30 real tradespeople
- Bug fixes from beta feedback
- Submit to App Store and Google Play

**Deliverable:** Production-ready app submitted to both app stores.

---

### Month 5-6: Electrical Vertical + Growth

- Build 50 electrical task guides
- Add NEC code database
- Electrical-specific TFLite model training/integration
- Implement TikTok content strategy (begin posting)
- ASO optimization based on initial download data
- User feedback collection and iteration

---

### Month 7-8: HVAC Vertical + Offline

- Build 40 HVAC task guides
- Add IMC code database
- Implement offline mode for Master tier
- Downloadable guide packs
- On-device basic analysis in offline mode

---

### Month 9: Certifications + Scale

- Build certification/learning path system
- Digital badge generation
- LinkedIn sharing integration
- Performance optimization for growing user base
- Infrastructure scaling preparation

---

## Feature Gating by Tier

| Feature | Free | Pro ($29/mo) | Master ($49/mo) |
|---------|------|-------------|-----------------|
| AI Camera Analysis | 3/day | Unlimited | Unlimited + Priority |
| Task Guides | 15 basic | 50 plumbing | All trades (140+) |
| Voice Interaction | Basic commands | Full natural language | Full + custom wake word |
| Error Detection | Basic (warning only) | Full (all severities) | Full + code references |
| Progress Tracking | Last 5 sessions | Unlimited history | Unlimited + analytics |
| Photo Documentation | 50 photos total | 500/month | Unlimited |
| Step-by-Step Guides | 15 guides | 50 plumbing guides | All trade guides |
| Offline Mode | No | No | Yes |
| Certifications | No | No | Yes |
| Code Reference Library | No | Plumbing codes | All trade codes |
| Export/Share Photos | No | Yes | Yes + PDF reports |
| AI Voice Choice | Default | Male/Female | Male/Female + custom |

---

## Success Metrics per Feature

| Feature | Key Metric | Target (Month 3 post-launch) |
|---------|-----------|------------------------------|
| AI Camera Analysis | Analyses per active user per day | 4-6 |
| Task Library | Guides opened per user per week | 3-5 |
| Voice Interaction | % of sessions using voice | > 40% |
| Error Detection | User-confirmed error catches per month (avg) | 8-12 |
| Progress Tracking | % of started tasks completed | > 65% |
| Photo Documentation | Photos per completed task (avg) | 3-5 |
| Subscription Conversion | Free to Pro conversion rate | > 8% |
| Retention | Day 7 / Day 30 retention | 60% / 35% |
