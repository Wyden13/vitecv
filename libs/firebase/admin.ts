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

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();

  const first = key[0];
  if ((first === '"' || first === "'") && key.at(-1) === first) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, "\n");
}

function readCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    const missing = [
      !projectId && "FIREBASE_PROJECT_ID",
      !clientEmail && "FIREBASE_CLIENT_EMAIL",
      !rawPrivateKey && "FIREBASE_PRIVATE_KEY",
    ].filter(Boolean);

    throw new Error(
      `[firebase-admin] Missing ${missing.join(", ")}. Add them to .env — ` +
      "see .env.example for where to find the values. When deploying, set " +
      "them in your host's environment variables and redeploy.",
    );
  }

  const privateKey = normalizePrivateKey(rawPrivateKey);

  if (!privateKey.startsWith("-----BEGIN")) {
    throw new Error(
      "[firebase-admin] FIREBASE_PRIVATE_KEY is set but is not a PEM private " +
      "key (it should start with '-----BEGIN PRIVATE KEY-----'). In a host's " +
      "environment UI, paste the key with real newlines and no surrounding quotes.",
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

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
