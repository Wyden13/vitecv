import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Each value must be written as a full static `process.env.NAME` expression —
// Next inlines these at build time, and dynamic access (`process.env[key]`)
// is left untouched and resolves to undefined in the browser.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (process.env.NODE_ENV !== "production") {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(
      `[firebase] Missing config values: ${missing.join(", ")}. ` +
        "Check .env and restart the dev server — NEXT_PUBLIC_* vars are read at build time.",
    );
  }
}

// Reuse the existing app across hot reloads and repeated imports; calling
// initializeApp twice throws "Firebase App named '[DEFAULT]' already exists".
export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

/**
 * Analytics requires `window` and browser support, so it cannot run during
 * SSR/prerender. Call this from a client component inside an effect.
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  return (await isSupported()) ? getAnalytics(app) : null;
}
