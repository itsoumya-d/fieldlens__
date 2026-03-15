import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

// ============================================================
// Well-Known Files Server — FieldLens
// Serves apple-app-site-association (iOS Universal Links) and
// assetlinks.json (Android App Links) at the correct paths.
//
// Deploy: supabase functions deploy well-known
// Host these at your custom domain's /.well-known/ path.
// See: https://docs.expo.dev/guides/deep-linking/
// ============================================================

// iOS Universal Links — apple-app-site-association
// Replace 'com.fieldlens.app' with your actual bundle ID on App Store.
// The 'components' array lists URL paths the app handles.
const AASA = {
  applinks: {
    details: [
      {
        appIDs: ['TEAMID.com.fieldlens.app'], // Replace TEAMID with your Apple Team ID
        components: [
          { '/': '/auth/callback', comment: 'Supabase OAuth callback' },
          { '/': '/link/*', comment: 'All deep link paths' },
          { '/': '/shared/*', comment: 'Shared content links' },
          { '/': '/reset-password', comment: 'Password reset' },
        ],
      },
    ],
  },
  webcredentials: {
    apps: ['TEAMID.com.fieldlens.app'], // Replace TEAMID with your Apple Team ID
  },
};

// Android App Links — assetlinks.json
// Replace SHA256_CERT_FINGERPRINT with your app's signing certificate SHA-256 fingerprint.
// Run: keytool -list -v -keystore your-key.jks | grep SHA256
const ASSET_LINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.fieldlens.app',
      sha256_cert_fingerprints: [
        'REPLACE_WITH_YOUR_SHA256_FINGERPRINT', // from EAS build credentials
      ],
    },
  },
];

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === '/.well-known/apple-app-site-association' || path === '/apple-app-site-association') {
    return new Response(JSON.stringify(AASA, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  if (path === '/.well-known/assetlinks.json') {
    return new Response(JSON.stringify(ASSET_LINKS, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return new Response('Not Found', { status: 404 });
});
