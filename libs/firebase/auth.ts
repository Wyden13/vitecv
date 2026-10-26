import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
} from "firebase/auth";

import { auth } from "./firebase";


export function onAuthStateChanged(callback: (authUser: User | null) => void) {
  return _onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    throw error;
  }
}

/**
 * Set for the duration of a deliberate sign-out.
 *
 * `useFirebaseUser` signs the browser SDK back in from the session cookie
 * whenever client auth goes missing. Sign-out clears client auth *before*
 * `removeSession()` clears the cookie, so without this flag that recovery
 * would race in and immediately re-authenticate the user. Read it via
 * `isSigningOut()`.
 */
let signingOut = false;

export function isSigningOut(): boolean {
  return signingOut;
}

export async function signOut(): Promise<void> {
  signingOut = true;
  try {
    return await auth.signOut();
  } catch (error) {
    console.error("Error signing out with Google", error);
    // Only cleared on failure: on success the page navigates away, and
    // staying latched keeps recovery suppressed until it does.
    signingOut = false;
  }
}
