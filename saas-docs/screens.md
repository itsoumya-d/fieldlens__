# FieldLens Screens

**All 8 app screens with UI elements, interactions, states, and navigation flow.**

---

## Navigation Architecture

```
[Onboarding] (first launch only)
      |
      v
[Tab Navigator] ------------------------------------------------
  |              |                |                |             |
  v              v                v                v             v
[Home]       [Camera]        [Library]        [Progress]   [Settings]
              (core)             |
                                 v
                          [Task Guide]
                              |
                              v
                        [Photo Docs]
```

**Navigation Type:** Bottom tab navigator (4 primary tabs) + Settings accessible from Home header

**Tab Bar:**
- Home (house icon)
- Camera (camera icon, center, enlarged with Safety Orange accent)
- Library (book-open icon)
- Progress (chart-bar icon)

---

## Screen 1: Onboarding

**Purpose:** Capture trade and experience level, demonstrate the AI camera, and convert the user into an engaged first session within 90 seconds.

### UI Elements

**Page 1 - Welcome (auto-advances after 2 seconds)**
- FieldLens logo (centered, large)
- Tagline: "Your AI mentor on every job site."
- Subtle construction-themed background pattern (blueprint lines)
- Smooth fade transition to Page 2

**Page 2 - Select Your Trade**
- Heading: "What is your trade?"
- 5 large tappable cards (grid layout, 2 columns + 1 centered):
  - Plumbing (pipe wrench icon)
  - Electrical (lightning bolt icon)
  - HVAC (thermometer icon)
  - Carpentry (hammer icon) [labeled "Coming Soon" with muted style]
  - General / Other (tool icon) [labeled "Coming Soon" with muted style]
- Each card: 120x120px, rounded corners (16px), Slate Blue border, white fill
- Selected card: Safety Orange border + fill, white icon
- "Continue" button (full-width, Safety Orange, disabled until selection)

**Page 3 - Experience Level**
- Heading: "How experienced are you?"
- 3 large tappable cards (vertical stack):
  - Apprentice: "Learning the trade (0-3 years)" - graduation cap icon
  - Journeyman: "Skilled and independent (3-8 years)" - wrench icon
  - Master: "Expert level (8+ years)" - star icon
- Same selection styling as trade cards
- "Continue" button

**Page 4 - AI Camera Demo (Interactive)**
- Heading: "See FieldLens in action"
- Pre-recorded 15-second demo video showing:
  1. Phone pointed at a pipe joint
  2. AI overlay appearing (green checkmark)
  3. Voice saying "Joint looks good, proper slope maintained"
  4. Error example: red indicator with spoken correction
- "Try It Now" button (Safety Orange, full-width, pulses gently)
- "Skip" text link below button (muted color)

**Page 5 - Sign Up / Sign In**
- Heading: "Create your free account"
- "Continue with Apple" button (Apple SSO, black)
- "Continue with Google" button (Google SSO, white with border)
- Divider: "or"
- Email input field + "Send Magic Link" button
- Terms of service and privacy policy links (small text, bottom)
- "Already have an account? Sign in" link

### Functionality per Interaction

| Interaction | Result |
|------------|--------|
| Tap trade card | Card highlights with Safety Orange; other cards deselect; Continue button enables |
| Tap experience card | Card highlights; Continue enables |
| Tap "Try It Now" | Opens camera with guided demo overlay (pre-set analysis results) |
| Tap "Skip" | Goes to sign-up page |
| Tap Apple/Google SSO | Native auth flow; on success, creates profile with selected trade/level; navigates to Home |
| Enter email + Send Magic Link | Sends magic link email; shows confirmation screen |
| Swipe left/right | Navigate between onboarding pages (dot indicator at bottom) |

### States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton shimmer on cards while checking auth state |
| **Empty** | N/A (onboarding always has content) |
| **Error - Auth failed** | Toast: "Sign in failed. Please try again." with retry option |
| **Error - Network** | Toast: "No internet connection. Please check your connection." |
| **Completed** | Onboarding never shown again (flag stored in MMKV) |

### Accessibility
- All cards have accessible labels: "Select Plumbing as your trade"
- VoiceOver reads page headings and card descriptions
- Demo video has closed captions
- Minimum tap target: 48x48px on all interactive elements
- High contrast text on all backgrounds (WCAG AA)

---

## Screen 2: Home Dashboard

**Purpose:** Landing screen after login. Shows quick-access actions, recent activity, daily usage stats, and personalized recommendations.

### UI Elements

**Header:**
- "FieldLens" text logo (left)
- User avatar circle (right) - taps to Settings
- Notification bell icon (right of avatar) - future use

**Greeting Section:**
- "Good morning, Mike" (time-aware greeting)
- Trade badge: "Journeyman Plumber" (pill-shaped, Slate Blue)
- Streak indicator: flame icon + "12 day streak" (Safety Orange)

**Quick Actions Row (horizontal scroll):**
- "Start Camera" card (Safety Orange gradient, camera icon, largest card)
- "Browse Tasks" card (Slate Blue, book icon)
- "My Photos" card (neutral, camera-photo icon)
- "View Progress" card (neutral, chart icon)

**Daily Stats Bar:**
- 3 inline metrics: "2/3 free analyses" | "1 task today" | "0 errors caught"
- For Pro/Master: "Unlimited analyses" replaces the limit counter
- Progress bar under free tier count (Safety Orange fill)

**Continue Where You Left Off (conditional):**
- Card showing last active task session (if one exists and is incomplete)
- Task title, step X of Y, time since last activity
- "Resume" button (Safety Orange outline)

**Recommended Tasks Section:**
- Heading: "Recommended for You"
- 3 horizontal-scroll task cards based on experience level and trade
- Each card: task thumbnail, title, difficulty badge, estimated time
- Tap to open Task Guide

**Recent Activity Section:**
- Heading: "Recent Activity"
- Last 5 completed or abandoned tasks
- Each row: task icon, title, date, completion status (checkmark or "Abandoned")
- Tap to view task session details

**Upgrade Banner (free users only):**
- Persistent but dismissible banner at bottom
- "Unlock unlimited AI coaching - Go Pro" with Safety Orange CTA button
- Dismiss X button (does not show again for 24 hours)

### Functionality per Interaction

| Interaction | Result |
|------------|--------|
| Tap "Start Camera" | Navigate to AI Camera screen |
| Tap "Browse Tasks" | Navigate to Task Library tab |
| Tap "My Photos" | Navigate to Photo Documentation screen |
| Tap "View Progress" | Navigate to Progress tab |
| Tap "Resume" on active task | Navigate to Step-by-Step Guide at saved step |
| Tap recommended task card | Navigate to Step-by-Step Guide for that task |
| Tap recent activity row | Navigate to task session detail / summary |
| Tap avatar | Navigate to Settings |
| Tap upgrade banner CTA | Navigate to paywall screen |
| Pull to refresh | Refresh stats and recommendations |

### States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton shimmer on all sections; greeting shows immediately from cached data |
| **Empty (new user)** | No recent activity; "Complete your first task!" prompt with arrow to Camera |
| **Empty (no active task)** | "Continue Where You Left Off" section hidden |
| **Error - Network** | Cached data shown; banner: "Offline - showing cached data" |
| **Free tier limit reached** | Daily stat shows "3/3 used" in red; Start Camera card shows lock icon overlay |

### Accessibility
- Time-aware greeting readable by screen reader
- Stats bar uses semantic labels: "2 out of 3 free analyses used today"
- All cards have descriptive accessible labels
- Upgrade banner can be dismissed via VoiceOver

---

## Screen 3: AI Camera Coaching (Core Screen)

**Purpose:** The primary screen where users point their camera at work and receive real-time AI feedback. This is the most critical screen in the app and must work flawlessly in real-world jobsite conditions.

### UI Elements

**Camera Viewport (full screen):**
- Live camera feed fills entire screen
- Semi-transparent dark gradient at top (for status indicators) and bottom (for controls)
- Camera orientation: supports portrait and landscape

**Top Status Bar:**
- Back arrow (top-left) - returns to previous screen
- Active task indicator (top-center): "Step 3/12: Install P-Trap" or "Free Analysis Mode"
- Analysis counter (top-right, free tier only): "2/3" in pill badge

**AI Assessment Overlay (appears after analysis):**
- Full-width card sliding up from bottom (60% screen height)
- Assessment indicator: large circle icon
  - Green checkmark: "Looks Good"
  - Yellow warning triangle: "Needs Attention"
  - Red X: "Error Detected"
  - Blue question mark: "Unclear - Adjust Camera"
- Assessment message: 2-3 sentences of AI feedback (large text, 18px)
- Error details (if errors): expandable list with severity badges
- Code reference (if applicable): tappable pill that expands to show code text
- "Got It" button to dismiss overlay
- Auto-dismiss after 10 seconds (configurable in settings)

**Camera Guidance Indicators (on camera feed):**
- Pulsing corner brackets when scene is being analyzed
- Green border flash on "correct" assessment
- Red border flash on "error" assessment
- Yellow border pulse on "needs attention"
- Low-light warning icon (sun icon) with "Turn on flashlight?" prompt

**Bottom Control Bar:**
- Capture/Analyze button (center, large, 72px circle):
  - Default state: Safety Orange circle with camera icon
  - Listening state: Pulsing blue circle with microphone icon
  - Analyzing state: Spinning loader animation
- Flashlight toggle (left of capture button)
- Gallery/Photos button (right of capture button) - quick access to session photos
- Voice command indicator (above capture button):
  - Mic icon that pulses when listening
  - Transcribed text appears briefly when command recognized

**Task Context Panel (when task guide active, swipe up to expand):**
- Collapsed: thin handle bar showing "Step 3: Install P-Trap"
- Expanded: full step instructions, reference image, tools needed
- "Next Step" and "Previous Step" buttons within panel
- "Check My Work" button (triggers analysis with step context)

### Functionality per Interaction

| Interaction | Result |
|------------|--------|
| Tap capture/analyze button | Captures frame, sends to TFLite pre-screen then GPT-4o Vision; shows loading state then assessment overlay |
| Say "Check this" | Same as tapping capture button |
| Say "Next step" | Advances task guide to next step; reads step aloud |
| Say "Previous step" | Returns to previous step; reads step aloud |
| Say "Take a photo" | Captures and saves photo to task session |
| Say "What tools do I need?" | Reads tools for current step aloud |
| Tap flashlight toggle | Toggles phone flashlight on/off |
| Tap gallery button | Opens Photo Documentation for current session |
| Tap assessment overlay "Got It" | Dismisses overlay, returns to camera view |
| Tap code reference pill | Expands to show full code text |
| Swipe up on task context panel | Expands to show full step details |
| Tap back arrow | Exits camera; if task active, confirms "Save progress?" |
| Long press capture button | Starts continuous analysis mode (analysis every 5 seconds) |
| Pinch to zoom | Camera zoom in/out |

### States

| State | Behavior |
|-------|----------|
| **Loading (camera)** | Black screen with "Initializing camera..." text; typically < 1 second |
| **Ready** | Live camera feed visible; capture button in default state; no overlay |
| **Listening** | Capture button changes to blue mic; pulsing animation; transcribed text appears |
| **Analyzing** | Capture button shows spinner; corner brackets pulse on camera feed; "Analyzing..." text |
| **Result - Correct** | Green flash; assessment overlay slides up with green check; voice reads feedback |
| **Result - Warning** | Yellow pulse; assessment overlay with warning; voice reads feedback |
| **Result - Error** | Red flash; assessment overlay with error details; urgent voice tone |
| **Result - Unclear** | Blue indicator; message asks to adjust camera angle/distance/lighting |
| **Low Light** | Sun icon overlay; "Turn on flashlight for better results?" prompt |
| **Free Limit Reached** | Capture button grayed out; overlay: "Daily limit reached. Upgrade to Pro for unlimited." |
| **Error - Network** | Toast: "No connection. Camera coaching needs internet." Offline TFLite basic mode continues |
| **Error - API** | Toast: "AI service temporarily unavailable. Try again in a moment." Retry button |
| **Camera Permission Denied** | Full-screen: "Camera access required for AI coaching. Open Settings to enable." |
| **Microphone Permission Denied** | Voice commands disabled; visual indicator shows mic is off; settings prompt |

### Accessibility
- VoiceOver announces assessment results automatically
- All overlay text minimum 18px for readability in bright/dim conditions
- High contrast overlays on camera feed (semi-transparent dark backgrounds)
- Haptic feedback on analysis results (success, warning, error patterns)
- Capture button has 72px minimum tap target
- Voice interaction is inherently accessible (core feature)

---

## Screen 4: Task Library

**Purpose:** Searchable, filterable library of all available task guides. Entry point for starting guided tasks.

### UI Elements

**Header:**
- Screen title: "Task Library"
- Search bar (full-width, magnifying glass icon, placeholder: "Search tasks...")

**Filter Bar (horizontal scroll, below search):**
- Filter pills: "All", "Rough-In", "Install", "Repair", "Maintenance", "Emergency", "Code"
- Difficulty filter dropdown: "All Levels", "Beginner", "Intermediate", "Advanced"
- Active filters: Safety Orange fill; inactive: Slate Blue outline

**Recently Viewed Section (collapsed by default):**
- Heading: "Recently Viewed" with expand/collapse chevron
- Horizontal scroll of last 5 viewed guide cards (compact)

**Bookmarked Section (collapsed by default):**
- Heading: "My Bookmarks" with expand/collapse chevron
- Horizontal scroll of bookmarked guides

**Task Guide List (main content):**
- Vertical scrolling list of task guide cards
- Each card contains:
  - Thumbnail image (left, 80x80px, rounded)
  - Task title (bold, 16px)
  - Category pill (small, colored by category)
  - Difficulty badge: Beginner (green), Intermediate (yellow), Advanced (red)
  - Estimated time: clock icon + "45 min"
  - Step count: "12 steps"
  - Lock icon overlay on premium guides (free tier users)
  - Bookmark icon (top-right of card, toggleable)
- Cards grouped by category with section headers

**Empty Search Results:**
- Illustration of magnifying glass with question mark
- "No tasks found for '[search term]'"
- "Try a different search or browse categories"

### Functionality per Interaction

| Interaction | Result |
|------------|--------|
| Type in search bar | Real-time search filtering (debounced 300ms); searches title, description, tags |
| Tap filter pill | Filters list by category; multiple filters supported; active pill highlighted |
| Tap difficulty dropdown | Filters by difficulty level |
| Tap task card | Navigate to Step-by-Step Guide for that task |
| Tap lock icon on premium card | Show paywall: "This guide requires Pro. Upgrade to unlock all 50 plumbing guides." |
| Tap bookmark icon | Toggle bookmark; haptic feedback; bookmark saved to MMKV + Supabase |
| Expand "Recently Viewed" | Shows last 5 viewed guides in horizontal scroll |
| Tap recently viewed guide | Navigate to Step-by-Step Guide |
| Pull to refresh | Refresh guide list (checks for new guides added) |
| Scroll to bottom | Load more guides if paginated |

### States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton cards (3-4 placeholder cards with shimmer animation) |
| **Loaded** | Full list of guides with images loaded progressively |
| **Empty (no bookmarks)** | Bookmark section shows "Tap the bookmark icon on any guide to save it here" |
| **Empty (search no results)** | Illustration + "No tasks found" message |
| **Error - Network** | Show cached guides (from last successful load); banner: "Showing saved guides" |
| **Free tier** | Premium guides show lock overlay; "15 of 50 guides available" counter at top |

### Accessibility
- Search bar has accessible label: "Search task guides"
- Filter pills announce state: "Repair category filter, selected"
- Task cards read: "Toilet Installation, Intermediate difficulty, 45 minutes, 12 steps"
- Lock icon announces: "Premium guide, requires Pro subscription"

---

## Screen 5: Step-by-Step Guide

**Purpose:** Displays a single task guide one step at a time. Users can navigate steps, launch AI camera coaching with step context, and track completion.

### UI Elements

**Header:**
- Back arrow (returns to Task Library)
- Task title (centered, truncated if long)
- Bookmark icon (right)
- Overflow menu icon (right): "Share Guide", "Report Issue"

**Progress Bar:**
- Full-width thin bar below header
- Filled portion: Safety Orange (percentage of steps completed)
- Step indicators: small dots or numbered circles along the bar
- Current step highlighted (larger dot, Safety Orange)

**Step Content Area (scrollable):**
- Step number and title: "Step 3 of 12: Install the P-Trap"
- Reference image (full-width, 200px height, rounded corners)
  - Tap to expand to full-screen with pinch-to-zoom
- Instruction text (16px, high line-height for readability)
- Tools for this step: horizontal pill row (wrench icons + names)
- Estimated time for this step: clock icon + "5 min"
- Tips panel (expandable, light blue background):
  - Icon: lightbulb
  - "Pro tip: Apply pipe dope to threads before connecting"
- Common Mistakes panel (expandable, light red background):
  - Icon: warning triangle
  - Photo of common mistake + description
- Code Reference panel (expandable, light purple background):
  - Icon: book
  - Relevant code section + requirement text

**Bottom Action Bar:**
- "Previous" button (left, outline style, disabled on step 1)
- "Check My Work" button (center, Safety Orange, camera icon)
- "Next" button (right, filled Slate Blue)
- On last step: "Next" becomes "Complete Task" (Safety Orange)
- Audio button (speaker icon) - reads current step aloud via TTS

**Step Completion Indicator:**
- Checkmark circle at top-right of step content
- Unfilled: step not verified
- Green filled: AI verified correct
- Orange filled: manually marked complete by user

### Functionality per Interaction

| Interaction | Result |
|------------|--------|
| Tap "Next" | Advance to next step; auto-scroll to top; progress bar updates |
| Tap "Previous" | Return to previous step |
| Tap "Check My Work" | Open AI Camera with this step's context loaded; analysis references this step's requirements |
| Tap reference image | Full-screen image viewer with pinch-to-zoom |
| Tap Tips panel | Expand/collapse tips section |
| Tap Common Mistakes panel | Expand/collapse with error photos |
| Tap Code Reference panel | Expand/collapse code details |
| Tap audio button | TTS reads current step instructions aloud |
| Tap step completion checkmark | Toggle manual completion (if not AI-verified) |
| Tap "Complete Task" (last step) | Navigate to Task Completion Summary |
| Swipe left | Next step (gesture navigation) |
| Swipe right | Previous step (gesture navigation) |
| Say "Next step" | Advance to next step; read aloud |
| Say "Check this" | Same as tapping "Check My Work" |
| Say "Read the step" | TTS reads current step |

### States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton layout with placeholder image and text blocks |
| **Active step** | Full content displayed; navigation arrows enabled appropriately |
| **Step verified by AI** | Green checkmark; "AI Verified" badge on step |
| **Step manually completed** | Orange checkmark; no AI badge |
| **Task completed** | All steps checked; completion summary overlay with stats |
| **Resumed session** | Opens to last incomplete step; completed steps show checkmarks |
| **Error - Image load fail** | Placeholder image with "Image unavailable" text; retry button |
| **Error - Network (during Check My Work)** | Toast: "Camera coaching needs internet"; fall back to manual check |
| **Landscape mode** | Image moves to left 40%; step text to right 60% (side-by-side layout) |

**Task Completion Summary (overlay on last step completion):**
- Confetti or subtle celebration animation
- Stats: total time, steps completed, AI checks performed, errors caught, photos taken
- "Great work!" heading
- "Save to Progress" button (auto-saves but confirms)
- "Share" button (share completion card image)
- "Back to Library" button

### Accessibility
- Step navigation announced: "Step 3 of 12, Install the P-Trap"
- Reference images have descriptive alt text
- Expandable panels announce state: "Tips, collapsed. Double tap to expand."
- Progress bar announces percentage: "50% complete, step 6 of 12"
- Swipe gestures have button alternatives (Previous/Next)

---

## Screen 6: Progress Dashboard

**Purpose:** Shows the user their learning journey: completed tasks, skills developed, errors caught over time, streaks, and achievements.

### UI Elements

**Header:**
- Screen title: "My Progress"
- Date range selector (top-right): "This Week", "This Month", "All Time"

**Hero Stats Row:**
- 4 stat cards in 2x2 grid:
  - Total Tasks Completed (number + task icon, Slate Blue)
  - Errors Caught (number + shield icon, Safety Orange)
  - Total Hours (number + clock icon, neutral)
  - Current Streak (number + flame icon, Safety Orange if active, gray if broken)
- Each card: rounded corners, subtle shadow, large number (32px), label below (14px)

**Weekly Activity Chart:**
- Bar chart showing daily task completions for current week
- X-axis: Mon-Sun (abbreviated)
- Y-axis: task count
- Bars colored Safety Orange
- Today's bar highlighted with accent
- Tap bar to see details for that day

**Skills Heatmap:**
- Grid showing categories attempted and frequency
- Categories on Y-axis (Rough-In, Install, Repair, etc.)
- Weeks on X-axis (last 12 weeks)
- Color intensity: white (none) to Safety Orange (frequent)
- Helps user identify gaps in their practice

**Error Improvement Chart:**
- Line chart showing error rate over time (errors per task)
- Trend line showing improvement direction
- Green if trending down (improving), red if trending up

**Recent Tasks List:**
- Heading: "Task History"
- Scrollable list of completed and abandoned tasks
- Each row: status icon (green check / gray X), task title, date, duration, error count
- Tap to view full session detail (photos, AI feedback log, step times)

**Achievements Section (future, but UI placeholder in MVP):**
- Heading: "Achievements"
- Locked achievement badges in a grid
- "Coming soon" label
- Examples: "First Task", "Error Catcher (10 errors)", "Week Warrior (7-day streak)", "Code Guru (50 code lookups)"

### Functionality per Interaction

| Interaction | Result |
|------------|--------|
| Tap date range selector | Filters all stats and charts to selected period |
| Tap stat card | Expands to show breakdown (e.g., tasks by category, errors by type) |
| Tap bar in weekly chart | Shows detail: "Tuesday: 3 tasks, 2 errors caught, 1.5 hours" |
| Tap cell in skills heatmap | Shows: "Repair tasks: 4 completed in week of Jan 6" |
| Tap task in history list | Navigate to session detail screen |
| Pull to refresh | Refresh all stats from Supabase |
| Scroll down past achievements | Load more task history (paginated) |

### States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton shimmer on stat cards and chart areas |
| **Empty (new user)** | All stats show 0; motivational message: "Complete your first task to start tracking!" with CTA to Task Library |
| **Active streak** | Flame icon animated; streak count in Safety Orange |
| **Broken streak** | Flame icon gray; "Start a new streak today!" prompt |
| **Error - Network** | Show cached stats; banner: "Showing last synced data" |
| **Free tier** | Banner: "Upgrade to Pro for full history and analytics" - shows last 5 sessions only |

### Accessibility
- Stat cards announce: "Total tasks completed: 47"
- Charts have accessible descriptions: "Weekly activity chart showing 3 tasks on Monday, 2 on Tuesday..."
- Date range selector is a proper accessible picker
- Color is never the sole indicator (always paired with text/icons)

---

## Screen 7: Photo Documentation

**Purpose:** Organized gallery of all photos taken during task sessions. Serves as a work portfolio and documentation for inspections.

### UI Elements

**Header:**
- Screen title: "Photo Docs"
- Sort toggle (top-right): "By Task" / "By Date"
- Search icon (magnifying glass)

**Storage Usage Bar (for tier-limited users):**
- "32 / 50 photos used" (free tier)
- Progress bar fill
- "Upgrade for more" link

**Task Group View (default - "By Task" sort):**
- Collapsible sections, one per task session
- Section header: task title, date, photo count, completion status
- Photo grid within each section: 3 columns, square thumbnails
- Photos ordered by step number then timestamp

**Date View (alternate - "By Date" sort):**
- Photos grouped by date (today, yesterday, this week, etc.)
- Same 3-column grid within each date group

**Photo Detail View (on tap):**
- Full-screen photo with pinch-to-zoom
- Swipe left/right to navigate photos in same task/date group
- Overlay info bar (bottom):
  - Task name and step number
  - Timestamp
  - AI analysis summary (if available): "Assessment: Correct" or "Error: Slope insufficient"
- Action buttons:
  - Add/Edit Note (text annotation)
  - Share (native share sheet)
  - Delete (with confirmation)
  - AI Analyze (re-run analysis on this photo)

**Floating Action Button:**
- Camera icon, bottom-right
- Opens camera in standalone photo mode (not task-linked)
- For capturing general documentation photos outside of guided tasks

### Functionality per Interaction

| Interaction | Result |
|------------|--------|
| Tap photo thumbnail | Open Photo Detail View |
| Swipe in Photo Detail | Navigate between photos in group |
| Tap "Add Note" | Open text input overlay; save note to photo metadata |
| Tap "Share" | Native share sheet (save to gallery, AirDrop, message, email) |
| Tap "Delete" | Confirmation dialog: "Delete this photo? This cannot be undone." |
| Tap "AI Analyze" | Send photo to GPT-4o Vision for analysis; show result overlay |
| Tap sort toggle | Switch between Task and Date grouping |
| Tap search icon | Open search: search by task name, note content, date |
| Tap FAB (camera) | Open camera in documentation mode |
| Long press photo | Multi-select mode; batch share or delete |
| Tap task section header | Collapse/expand photo group |

### States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton grid of placeholder squares |
| **Empty (no photos)** | Illustration + "No photos yet. Take your first photo during a task or tap the camera button." |
| **Empty (search no results)** | "No photos match your search" |
| **Storage full (free tier)** | Banner: "Photo limit reached. Upgrade to Pro for 500 photos/month." FAB disabled |
| **Error - Photo load fail** | Broken image placeholder with retry button |
| **Error - Network** | Show locally cached thumbnails; full-res may not load; banner: "Some photos may not load offline" |
| **Multi-select active** | Checkmark overlays on selected photos; bottom bar with "Share (3)" and "Delete (3)" buttons |

### Accessibility
- Photos have alt text from AI analysis: "Photo of P-trap installation, assessed as correct"
- Multi-select announces count: "3 photos selected"
- Delete confirmation is properly announced
- Grid navigation works with VoiceOver (left-to-right, top-to-bottom)

---

## Screen 8: Settings

**Purpose:** User profile management, subscription management, app preferences, and account actions.

### UI Elements

**Profile Section (top):**
- User avatar (large circle, tappable to change)
- Full name (editable)
- Trade and experience level badges
- "Edit Profile" text link

**Subscription Section:**
- Current plan card:
  - Plan name: "Pro Plan" (or "Free", "Master")
  - Price: "$29/month"
  - Renewal date: "Renews Feb 15, 2026"
  - "Manage Subscription" button (opens RevenueCat management / native subscription settings)
- For free users: "Upgrade to Pro" card (Safety Orange gradient)

**AI Preferences Section:**
- Voice Selection: "AI Voice" dropdown
  - Options: "Professional Male", "Professional Female"
  - Preview button (speaker icon - plays sample)
- Analysis Auto-Dismiss: Toggle + seconds selector (5s, 10s, 15s, 30s, "Manual")
- Continuous Analysis Mode: Toggle (auto-analyze every 5 seconds when enabled)
- AI Detail Level: Segmented control ("Concise", "Detailed")

**App Preferences Section:**
- Theme: Segmented control ("Dark", "Light", "System")
- Notifications: Toggle for daily reminders, new guide alerts
- Measurement Units: Segmented control ("Imperial", "Metric")
- Language: Selector (English only at MVP; future expansion)

**Data & Storage Section:**
- "Downloaded Guides" with storage size shown ("128 MB")
- "Clear Cache" button with size indicator
- "Export My Data" button (GDPR compliance)
- "Photo Storage Used" with progress bar

**Account Section:**
- "Change Email" row
- "Sign Out" button (red text)
- "Delete Account" button (red text, destructive) - confirmation required

**About Section:**
- App version number
- "Terms of Service" link
- "Privacy Policy" link
- "Contact Support" (opens email compose)
- "Rate FieldLens" (opens App Store / Play Store rating)

**Footer:**
- "Made for tradespeople, by tradespeople" text
- Small FieldLens logo

### Functionality per Interaction

| Interaction | Result |
|------------|--------|
| Tap avatar | Image picker (camera or gallery) to set profile photo |
| Tap "Edit Profile" | Inline editing of name; trade/level reopens selection |
| Tap "Manage Subscription" | Opens RevenueCat paywall or native subscription management |
| Tap "Upgrade to Pro" | Opens paywall with tier comparison |
| Change voice selection | Immediately plays voice sample; saves preference |
| Toggle continuous analysis | Saves preference; shows explanation tooltip on first enable |
| Change theme | Immediate theme switch with smooth transition |
| Tap "Clear Cache" | Confirmation dialog; clears cached images and guide data |
| Tap "Export My Data" | Generates data export; sends download link to email |
| Tap "Sign Out" | Confirmation: "Sign out of FieldLens?"; clears session |
| Tap "Delete Account" | Double confirmation: type "DELETE" to confirm; schedules account deletion per GDPR (30-day grace period) |
| Tap "Contact Support" | Opens email compose to support@fieldlens.app |
| Tap "Rate FieldLens" | Opens store rating dialog |

### States

| State | Behavior |
|-------|----------|
| **Loading** | Profile section shows cached data immediately; subscription status loads from RevenueCat |
| **Not authenticated** | Redirect to onboarding/sign-in |
| **Free user** | Upgrade card prominent; "Manage Subscription" hidden |
| **Subscription loading** | Spinner on subscription card |
| **Subscription error** | "Unable to load subscription status. Pull to refresh." |
| **Error - Network** | Cached profile shown; subscription management disabled with tooltip: "Requires internet" |
| **Account deletion pending** | Banner: "Account deletion scheduled for [date]. Cancel deletion?" |

### Accessibility
- All toggles announce state: "Dark mode, on"
- Segmented controls are proper accessible tab groups
- Destructive actions (sign out, delete) have additional confirmation
- Settings grouped with proper headings for screen reader navigation
- Voice preview button announces: "Play voice sample"

---

## Navigation Flow Summary

```
App Launch
    |
    +--> First Launch? --> [Onboarding] --> [Home Dashboard]
    |
    +--> Returning User? --> [Home Dashboard]
                                |
                                +--> Tab: Camera --> [AI Camera Coaching]
                                |                        |
                                |                        +--> (from task) return to [Step-by-Step Guide]
                                |
                                +--> Tab: Library --> [Task Library]
                                |                        |
                                |                        +--> Tap guide --> [Step-by-Step Guide]
                                |                                              |
                                |                                              +--> "Check My Work" --> [AI Camera]
                                |                                              |
                                |                                              +--> Photos --> [Photo Docs]
                                |
                                +--> Tab: Progress --> [Progress Dashboard]
                                |                        |
                                |                        +--> Tap session --> Session Detail
                                |
                                +--> Avatar --> [Settings]
                                                   |
                                                   +--> Manage Sub --> Paywall / Store
                                                   |
                                                   +--> Sign Out --> [Onboarding]
```

---

## Responsive Behavior

| Scenario | Adaptation |
|----------|-----------|
| **Portrait (default)** | Standard layouts as described above |
| **Landscape** | Camera: full-width viewfinder. Guide: side-by-side image + text. Library: 2-column card grid. |
| **Small screen (< 375px)** | Reduced padding; single-column quick actions; smaller stat cards |
| **Large screen (tablet)** | 2-column layout for Guide (image left, steps right); wider camera overlays |
| **Dynamic Type (iOS)** | All text scales with system font size preference; layouts reflow |
| **Font Scale > 1.5x** | Stat cards stack vertically; filter pills wrap to second row |

---

## Performance Targets

| Screen | Cold Load | Warm Load | Interaction Response |
|--------|-----------|-----------|---------------------|
| Onboarding | < 1.5s | N/A | Tap: < 100ms |
| Home | < 1s | < 300ms | Pull to refresh: < 1s |
| Camera | < 1s (camera init) | < 500ms | Analysis: < 3s |
| Library | < 500ms | < 200ms | Search: < 300ms |
| Guide | < 500ms | < 200ms | Step nav: < 100ms |
| Progress | < 1s | < 300ms | Chart render: < 500ms |
| Photo Docs | < 1s | < 300ms | Thumbnail load: < 200ms |
| Settings | < 500ms | < 200ms | Toggle: < 100ms |
