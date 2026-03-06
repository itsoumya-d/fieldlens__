# Deployment Guide — FieldLens

## Overview

FieldLens is a mobile-first agricultural intelligence platform built with React Native and Expo. The deployment architecture spans a React Native client distributed via Apple App Store and Google Play Store, a Supabase backend (PostgreSQL, Auth, Edge Functions, Realtime, Storage), agricultural sensor webhook ingestion pipelines, and offline-first synchronization infrastructure. OTA updates are delivered through Expo EAS Update for JavaScript-layer changes, while native binary releases follow a staged rollout through both app stores.

The system is designed for intermittent connectivity environments common in rural agricultural areas. Deployment must account for offline data queuing, background sync workers, and conflict resolution logic that runs on-device when network access resumes.

---

## Prerequisites

- Apple Developer Account ($99/year) — required for App Store distribution and push notification certificates
- Google Play Developer Account ($25 one-time) — required for Play Store distribution
- Expo Account with EAS Build access — manages cloud builds, OTA updates, and submission workflows
- GitHub repository with CI/CD configured (GitHub Actions)
- Supabase project (staging + production) — PostgreSQL, Auth, Edge Functions, Storage, Realtime
- Sentry account — crash reporting and performance monitoring
- PostHog account — product analytics and feature flags
- Mapbox account — satellite imagery tiles and geospatial APIs
- OpenWeatherMap API key — weather data integration
- Domain with SSL — for deep linking and universal links configuration
- Agricultural sensor gateway credentials — for webhook ingestion from IoT sensor networks

---

## Environment Configuration

### Environment Files

The project uses three environment files managed at the root of the repository. These files are **never committed to version control** and are injected via EAS Secrets during CI/CD builds.

```
.env.development      # Local development with Expo Dev Client
.env.staging          # Internal testing builds (TestFlight / Internal Track)
.env.production       # App Store / Play Store release builds
```

### Environment Variables

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `EXPO_PUBLIC_SUPABASE_URL` | `http://localhost:54321` | `https://staging-xyz.supabase.co` | `https://prod-xyz.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | local anon key | staging anon key | production anon key |
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | dev token | staging token | production token |
| `EXPO_PUBLIC_OPENWEATHER_API_KEY` | dev key | staging key | production key |
| `EXPO_PUBLIC_SENTRY_DSN` | dev DSN | staging DSN | production DSN |
| `EXPO_PUBLIC_POSTHOG_KEY` | dev key | staging key | production key |
| `EXPO_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` | `https://app.posthog.com` | `https://app.posthog.com` |
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000` | `https://staging-api.fieldlens.app` | `https://api.fieldlens.app` |
| `EXPO_PUBLIC_APP_ENV` | `development` | `staging` | `production` |
| `EXPO_PUBLIC_SENSOR_WEBHOOK_URL` | `http://localhost:54321/functions/v1/sensor-ingest` | `https://staging-xyz.supabase.co/functions/v1/sensor-ingest` | `https://prod-xyz.supabase.co/functions/v1/sensor-ingest` |
| `EXPO_PUBLIC_OFFLINE_SYNC_INTERVAL` | `30000` | `60000` | `120000` |
| `EXPO_PUBLIC_SYNC_BATCH_SIZE` | `10` | `50` | `100` |

### Secrets (EAS Secrets — never in code)

```bash
eas secret:create --scope project --name SUPABASE_SERVICE_ROLE_KEY --value "..."
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "..."
eas secret:create --scope project --name MAPBOX_SECRET_TOKEN --value "..."
eas secret:create --scope project --name SENSOR_GATEWAY_API_KEY --value "..."
eas secret:create --scope project --name APPLE_TEAM_ID --value "..."
eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_KEY --value "..."
```

---

## Expo EAS Build Configuration

### eas.json

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development"
      },
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "staging"
      },
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      },
      "channel": "staging"
    },
    "production": {
      "env": {
        "APP_ENV": "production"
      },
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "dev@fieldlens.app",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

### app.config.ts — Dynamic Configuration

```typescript
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const APP_ENV = process.env.APP_ENV || "development";

  const envConfig = {
    development: {
      name: "FieldLens (Dev)",
      bundleIdentifier: "app.fieldlens.dev",
      package: "app.fieldlens.dev",
    },
    staging: {
      name: "FieldLens (Staging)",
      bundleIdentifier: "app.fieldlens.staging",
      package: "app.fieldlens.staging",
    },
    production: {
      name: "FieldLens",
      bundleIdentifier: "app.fieldlens",
      package: "app.fieldlens",
    },
  }[APP_ENV];

  return {
    ...config,
    name: envConfig.name,
    slug: "fieldlens",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1B5E20",
    },
    ios: {
      bundleIdentifier: envConfig.bundleIdentifier,
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "FieldLens needs your location to map field boundaries and provide local weather data.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "FieldLens uses background location to track field work sessions.",
        NSCameraUsageDescription:
          "FieldLens uses the camera to capture crop photos for disease detection.",
        UIBackgroundModes: ["location", "fetch", "remote-notification"],
      },
    },
    android: {
      package: envConfig.package,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1B5E20",
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "CAMERA",
        "RECEIVE_BOOT_COMPLETED",
        "FOREGROUND_SERVICE",
      ],
    },
    plugins: [
      "expo-router",
      "expo-localization",
      "expo-secure-store",
      "expo-camera",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "FieldLens uses your location for field mapping and weather.",
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#1B5E20",
        },
      ],
      ["@sentry/react-native/expo", { organization: "fieldlens", project: "mobile" }],
    ],
  };
};
```

---

## iOS Deployment

### Code Signing

Expo EAS manages provisioning profiles and distribution certificates automatically. For most deployments, no manual intervention is required.

**Automatic (Recommended):**
- EAS generates and manages distribution certificates
- Provisioning profiles are created and updated automatically
- Push notification capabilities are registered during build

**Manual Override (if needed):**
1. Navigate to Apple Developer Portal > Certificates, Identifiers & Profiles
2. Create an iOS Distribution certificate (App Store)
3. Create a provisioning profile linked to your App ID
4. Upload the `.p12` certificate and profile to EAS credentials store:
   ```bash
   eas credentials --platform ios
   ```

**Push Notification Certificate:**
1. In Apple Developer Portal, create an APNs key (`.p8` file)
2. Upload the key to Supabase Dashboard > Authentication > Push Notifications
3. Configure the key in EAS credentials:
   ```bash
   eas credentials --platform ios
   # Select "Push Notifications" and upload .p8 key
   ```

### App Store Submission Checklist

- [ ] App icon: 1024x1024 PNG (no transparency, no rounded corners)
- [ ] Screenshots for all required device sizes:
  - 6.7" iPhone (1290x2796) — iPhone 15 Pro Max
  - 6.5" iPhone (1284x2778) — iPhone 14 Plus
  - 5.5" iPhone (1242x2208) — iPhone 8 Plus
  - iPad Pro 12.9" (2048x2732)
  - iPad Pro 11" (1668x2388)
- [ ] App name (30 characters max)
- [ ] Subtitle (30 characters max)
- [ ] Description (4000 characters max)
- [ ] Keywords (100 characters max, comma-separated)
- [ ] Primary category: Productivity
- [ ] Secondary category: Utilities
- [ ] Privacy policy URL: `https://fieldlens.app/privacy`
- [ ] Support URL: `https://fieldlens.app/support`
- [ ] Marketing URL: `https://fieldlens.app`
- [ ] App Review information:
  - Demo account credentials
  - Notes about offline functionality testing
  - Notes about location-dependent features
- [ ] Age rating questionnaire completed
- [ ] Export compliance: "No" for non-exempt encryption (using HTTPS only)
- [ ] Content rights: Confirm rights to all content
- [ ] **FieldLens-specific:** Location usage descriptions reviewed for App Review compliance
- [ ] **FieldLens-specific:** Background location justification documented
- [ ] **FieldLens-specific:** Camera usage justification for crop disease scanning

### Build and Submit

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --profile production

# Or combine build + submit
eas build --platform ios --profile production --auto-submit
```

---

## Android Deployment

### Signing Configuration

**Upload Key (EAS Managed — Recommended):**
- EAS generates and manages the upload key automatically
- Google Play App Signing re-signs with the final distribution key
- Enroll in Google Play App Signing during first upload

**Manual Key Management (if needed):**
```bash
# Generate a keystore
keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 \
  -validity 10000 -storepass <password> -keypass <password> \
  -alias fieldlens-upload -keystore fieldlens-upload.jks \
  -dname "CN=FieldLens, OU=Mobile, O=FieldLens Inc, L=City, S=State, C=US"

# Upload to EAS credentials
eas credentials --platform android
```

### Play Store Submission Checklist

- [ ] Feature graphic: 1024x500 PNG or JPEG
- [ ] App icon: 512x512 PNG (32-bit, no alpha)
- [ ] Screenshots (minimum 2, maximum 8 per device type):
  - Phone screenshots (16:9 or 9:16)
  - 7-inch tablet screenshots
  - 10-inch tablet screenshots
- [ ] Short description (80 characters max)
- [ ] Full description (4000 characters max)
- [ ] Application type: Application
- [ ] Category: Productivity
- [ ] Content rating questionnaire (IARC)
- [ ] Data safety section:
  - Location data collected (approximate and precise)
  - Photos collected for crop analysis
  - Account information (name, email)
  - Data encrypted in transit (yes)
  - Data deletion request mechanism
- [ ] Target API level: API 34 (Android 14) minimum
- [ ] Ads declaration: "No" (does not contain ads)
- [ ] **FieldLens-specific:** Background location access declaration with video demonstrating use case
- [ ] **FieldLens-specific:** Foreground service declaration for sensor data sync
- [ ] **FieldLens-specific:** Camera permission declaration for crop scanning

### Build and Submit

```bash
# Build AAB for Play Store
eas build --platform android --profile production

# Submit to Google Play Console
eas submit --platform android --profile production

# Or combine build + submit
eas build --platform android --profile production --auto-submit
```

---

## CI/CD Pipeline (GitHub Actions)

### Workflow: `.github/workflows/deploy.yml`

```yaml
name: FieldLens Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

jobs:
  lint-and-test:
    name: Lint and Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npx eslint . --ext .ts,.tsx --max-warnings 0

      - name: Run TypeScript compiler
        run: npx tsc --noEmit

      - name: Run unit tests
        run: npx jest --ci --coverage --reporters=default

      - name: Run offline sync integration tests
        run: npx jest --ci --testPathPattern="sync" --reporters=default

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build-preview:
    name: Build Preview (Staging)
    needs: lint-and-test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build preview (iOS)
        run: eas build --platform ios --profile preview --non-interactive

      - name: Build preview (Android)
        run: eas build --platform android --profile preview --non-interactive

      - name: Comment PR with build links
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: eas-build
          message: |
            ## FieldLens Preview Build
            Builds triggered for commit ${{ github.sha }}.
            Check [EAS Dashboard](https://expo.dev) for build status and install links.

  build-production:
    name: Build Production
    needs: lint-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build production (iOS)
        run: eas build --platform ios --profile production --non-interactive --auto-submit

      - name: Build production (Android)
        run: eas build --platform android --profile production --non-interactive --auto-submit

  ota-update:
    name: OTA Update (JS-only changes)
    needs: lint-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Publish OTA update
        run: eas update --branch production --message "${{ github.event.head_commit.message }}"
```

---

## OTA Updates

FieldLens uses `expo-updates` for delivering JavaScript-only changes without requiring a new app store submission.

### Update Channels

| Channel | Branch | Purpose |
|---------|--------|---------|
| `production` | `main` | Live app store users |
| `staging` | `develop` | Internal testers on preview builds |

### Update Policies

FieldLens implements three update urgency tiers:

1. **Critical (Force Update):** Security patches, data corruption fixes. The app displays a blocking modal requiring the user to update before continuing. No dismiss option.
2. **Recommended (Prompt Update):** Bug fixes, significant improvements. The app shows a dismissible prompt at launch. Users can skip once but will be prompted again on next launch.
3. **Optional (Silent Update):** Minor UI tweaks, copy changes. Downloaded in the background and applied on next cold start. No user-facing prompt.

### Update Commands

```bash
# Publish to production channel
eas update --branch production --message "fix: correct offline sync conflict resolution"

# Publish to staging channel
eas update --branch staging --message "feat: add soil moisture widget"

# Check update history
eas update:list --branch production

# Rollback to previous update
eas update:rollback --branch production
```

### Offline Sync Considerations for OTA

When deploying OTA updates that modify the offline sync schema or conflict resolution logic:

1. Version the sync protocol in the update metadata
2. Ensure backward compatibility with queued offline operations
3. Deploy the Supabase Edge Function changes **before** publishing the OTA update
4. Monitor the `sync_errors` table in Supabase for 24 hours post-update

---

## Offline Sync Deployment

FieldLens operates in environments with intermittent or no network connectivity. The offline sync system is a critical deployment concern.

### Architecture

```
[Device SQLite] <---> [Sync Engine] <---> [Supabase PostgreSQL]
                          |
                    [Conflict Resolver]
                          |
                    [Operation Queue]
```

### Deploying Offline Schema Changes

When modifying the local SQLite schema or sync configuration:

1. **Create a migration version:**
   ```typescript
   // src/db/migrations/003_add_soil_moisture.ts
   export const migration003 = {
     version: 3,
     up: (db: SQLiteDatabase) => {
       db.execSync(`
         ALTER TABLE field_readings ADD COLUMN soil_moisture REAL;
         ALTER TABLE sync_queue ADD COLUMN retry_count INTEGER DEFAULT 0;
       `);
     },
   };
   ```

2. **Register the migration in the sync engine:**
   ```typescript
   // src/db/index.ts
   const MIGRATIONS = [migration001, migration002, migration003];
   ```

3. **Deploy order for schema changes:**
   - Deploy Supabase migration first (add column to remote table)
   - Wait for migration to propagate (verify in Supabase Dashboard)
   - Publish OTA update with local schema migration
   - Monitor `sync_errors` for migration failures

### Conflict Resolution Deployment

The sync engine uses a last-write-wins strategy with field-level merging:

```typescript
// Conflict resolution configuration
const SYNC_CONFIG = {
  conflictStrategy: "field-level-merge",
  tombstoneRetention: "30d",
  maxRetries: 5,
  retryBackoff: "exponential",
  batchSize: Number(process.env.EXPO_PUBLIC_SYNC_BATCH_SIZE) || 50,
  syncInterval: Number(process.env.EXPO_PUBLIC_OFFLINE_SYNC_INTERVAL) || 120000,
};
```

### Monitoring Offline Sync in Production

```sql
-- Check sync queue depth across users
SELECT user_id, COUNT(*) as pending_ops, MIN(created_at) as oldest_op
FROM sync_queue
WHERE status = 'pending'
GROUP BY user_id
ORDER BY pending_ops DESC;

-- Check sync error rates
SELECT error_type, COUNT(*) as occurrences, MAX(created_at) as last_seen
FROM sync_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY occurrences DESC;
```

---

## Agricultural Sensor Webhook Deployment

FieldLens ingests data from IoT sensor networks deployed in agricultural fields. Sensor data arrives via webhooks from gateway devices.

### Webhook Endpoint

The sensor ingestion endpoint is deployed as a Supabase Edge Function:

```bash
# Deploy the sensor ingestion function
supabase functions deploy sensor-ingest --project-ref <project-ref>

# Set secrets for the function
supabase secrets set SENSOR_GATEWAY_API_KEY="..." --project-ref <project-ref>
supabase secrets set WEBHOOK_SIGNING_SECRET="..." --project-ref <project-ref>
```

### Edge Function: `supabase/functions/sensor-ingest/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  // Verify webhook signature
  const signature = req.headers.get("x-webhook-signature");
  const signingSecret = Deno.env.get("WEBHOOK_SIGNING_SECRET");

  if (!verifySignature(await req.text(), signature, signingSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(await req.text());

  // Validate sensor data schema
  const { sensor_id, field_id, readings, timestamp } = payload;

  // Insert into database
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await supabase.from("sensor_readings").insert({
    sensor_id,
    field_id,
    temperature: readings.temperature,
    humidity: readings.humidity,
    soil_moisture: readings.soil_moisture,
    soil_ph: readings.soil_ph,
    light_intensity: readings.light_intensity,
    recorded_at: timestamp,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Trigger Realtime notification for connected devices
  await supabase.from("sensor_alerts").insert({
    field_id,
    alert_type: evaluateThresholds(readings),
    sensor_id,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

### Sensor Gateway Configuration

Configure the sensor gateway to forward data to the FieldLens webhook:

| Gateway Setting | Staging | Production |
|----------------|---------|------------|
| Endpoint URL | `https://staging-xyz.supabase.co/functions/v1/sensor-ingest` | `https://prod-xyz.supabase.co/functions/v1/sensor-ingest` |
| Authentication | API Key Header | API Key Header |
| Batch Interval | 30 seconds | 60 seconds |
| Retry Policy | 3 retries, exponential backoff | 5 retries, exponential backoff |
| Payload Format | JSON | JSON |

### Monitoring Sensor Webhooks

```sql
-- Check sensor data ingestion rate
SELECT DATE_TRUNC('hour', recorded_at) as hour,
       COUNT(*) as readings_count,
       COUNT(DISTINCT sensor_id) as active_sensors
FROM sensor_readings
WHERE recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Check for stale sensors (no data in 2 hours)
SELECT s.sensor_id, s.field_id, MAX(sr.recorded_at) as last_reading
FROM sensors s
LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
GROUP BY s.sensor_id, s.field_id
HAVING MAX(sr.recorded_at) < NOW() - INTERVAL '2 hours'
   OR MAX(sr.recorded_at) IS NULL;
```

---

## Supabase Database Deployment

### Migration Strategy

```bash
# Create a new migration
supabase migration new add_soil_moisture_column

# Apply all pending migrations to local database
supabase db push

# Reset local database to clean state (development only)
supabase db reset

# Diff local schema against remote
supabase db diff --use-migra

# Push migrations to staging
supabase db push --project-ref <staging-ref>

# Push migrations to production
supabase db push --project-ref <production-ref>
```

### Production Database Configuration

- **Point-in-time recovery:** Enabled with 7-day retention window
- **Read replicas:** One replica in the same region for analytics queries and dashboard views
- **Connection pooling:** Supavisor configured with pool size of 50 for transaction mode
- **Backups:** Daily automated backups stored in a separate region
- **Row Level Security:** Enforced on all tables — users can only access their own field data

### Database Secrets

```bash
# Set production database secrets
supabase secrets set --project-ref <production-ref> \
  SENSOR_GATEWAY_API_KEY="..." \
  WEBHOOK_SIGNING_SECRET="..." \
  MAPBOX_SERVER_TOKEN="..."
```

### Key Migrations for FieldLens

```sql
-- 001_initial_schema.sql
CREATE TABLE fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  boundary JSONB NOT NULL, -- GeoJSON polygon
  acreage REAL,
  crop_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own fields"
  ON fields FOR ALL USING (auth.uid() = user_id);

-- 002_sensor_readings.sql
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id TEXT NOT NULL,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
  temperature REAL,
  humidity REAL,
  soil_moisture REAL,
  soil_ph REAL,
  light_intensity REAL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sensor_readings_field_time
  ON sensor_readings (field_id, recorded_at DESC);
```

---

## Monitoring and Observability

### Sentry — Crash Reporting

```typescript
// Sentry initialization in app entry
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_APP_ENV,
  tracesSampleRate: process.env.EXPO_PUBLIC_APP_ENV === "production" ? 0.2 : 1.0,
  enableAutoSessionTracking: true,
  attachScreenshot: true,
  integrations: [
    new Sentry.ReactNativeTracing({
      tracingOrigins: ["fieldlens.app", "supabase.co"],
    }),
  ],
});
```

### PostHog — Product Analytics

```typescript
import PostHog from "posthog-react-native";

export const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY, {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  enableSessionReplay: false,
});
```

### Key Metrics to Monitor

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| App crash rate | Sentry | > 1% of sessions |
| Offline sync failure rate | Supabase + Sentry | > 5% of sync operations |
| Sensor webhook latency | Supabase Dashboard | > 2s p95 |
| Stale sensor count | Custom SQL alert | > 10% of sensors inactive |
| API response time | Sentry Performance | > 500ms p95 |
| OTA update adoption | Expo Insights | < 80% after 48 hours |
| Background sync battery impact | PostHog | > 5% battery per hour |

---

## Rollback Strategy

### 1. OTA Rollback (JavaScript-only changes)

```bash
# Rollback to previous OTA update on production channel
eas update:rollback --branch production

# Or publish a specific known-good commit
git checkout <known-good-sha>
eas update --branch production --message "rollback: revert to stable version"
```

### 2. Binary Rollback (native code changes)

- Resubmit the previous known-good build to App Store Connect and Google Play Console
- Use EAS to rebuild from a tagged release:
  ```bash
  git checkout v1.2.3
  eas build --platform all --profile production
  eas submit --platform all --profile production
  ```

### 3. Database Rollback

```bash
# Roll back to a specific migration version
supabase db reset --version 20240101000000

# Or apply a down migration manually
supabase migration new rollback_soil_moisture
# Write the reversal SQL in the generated file
supabase db push --project-ref <production-ref>
```

### 4. Sensor Webhook Rollback

```bash
# Redeploy previous version of the edge function
git checkout <previous-sha> -- supabase/functions/sensor-ingest
supabase functions deploy sensor-ingest --project-ref <production-ref>
```

---

## Security Checklist

- [ ] All API keys stored in EAS Secrets, never in source code
- [ ] Certificate pinning enabled for Supabase and Mapbox API calls
- [ ] ProGuard/R8 enabled for Android release builds (obfuscation and shrinking)
- [ ] Network security config restricts cleartext traffic on Android
- [ ] iOS App Transport Security enforced (no cleartext exceptions)
- [ ] Row Level Security enabled on all Supabase tables
- [ ] Supabase service role key is never exposed to the client
- [ ] Webhook signatures verified on all sensor data ingestion
- [ ] Secure storage used for authentication tokens (expo-secure-store)
- [ ] Background location access minimized to active field work sessions
- [ ] Sensor data encrypted in transit via HTTPS/TLS 1.3
- [ ] Local SQLite database encrypted with SQLCipher for sensitive field data
- [ ] API rate limiting configured on Supabase Edge Functions
- [ ] App permissions request only what is necessary at time of use (just-in-time)
- [ ] Debug logging disabled in production builds
- [ ] Source maps uploaded to Sentry but not included in production bundles

---

## Deep Linking and Universal Links

### iOS Associated Domains

```
applinks:fieldlens.app
```

**File:** `https://fieldlens.app/.well-known/apple-app-site-association`
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["ABCDE12345.app.fieldlens"],
        "paths": ["/field/*", "/invite/*", "/report/*"]
      }
    ]
  }
}
```

### Android App Links

**File:** `https://fieldlens.app/.well-known/assetlinks.json`
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.fieldlens",
      "sha256_cert_fingerprints": ["..."]
    }
  }
]
```

---

## Release Process Summary

1. **Code complete:** All features merged to `develop`, QA complete
2. **Staging build:** Merge `develop` to `staging`, trigger preview build
3. **Internal testing:** Distribute via TestFlight (iOS) and Internal Track (Android)
4. **Production build:** Merge `staging` to `main`, CI triggers production build and submit
5. **Staged rollout:** Android — 10% > 25% > 50% > 100% over 7 days. iOS — immediate (phased release optional)
6. **Monitor:** Watch Sentry crash rates, sync error rates, and sensor webhook health for 48 hours
7. **OTA patch:** If JS-only fixes needed, publish via `eas update` without new store submission
