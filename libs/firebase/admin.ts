import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function readCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && "FIREBASE_PROJECT_ID",
      !clientEmail && "FIREBASE_CLIENT_EMAIL",
      !privateKey && "FIREBASE_PRIVATE_KEY",
    ].filter(Boolean);

    throw new Error(
      `[firebase-admin] Missing ${missing.join(", ")}. Add them to .env — ` +
      "see .env.example for where to find the values.",
    );
  }

  return { projectId, clientEmail, privateKey };
}

function getAdminApp(): App {
  if (getApps().length) return getApp();
  return initializeApp({ credential: cert(readCredentials()) });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * Server-side Firestore. Unlike the browser SDK in `libs/firebase/firebase.ts`,
 * the admin SDK **bypasses `firestore.rules` entirely** — the uid scoping that
 * the rules normally enforce becomes the caller's responsibility. Build every
 * path from `requireUser().uid`, never from anything the client supplied.
 */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
