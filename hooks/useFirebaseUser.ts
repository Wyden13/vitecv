"use client";

import { useEffect, useRef, useState } from "react";
import { signInWithCustomToken, type User } from "firebase/auth";

import { createClientAuthToken } from "@/actions/auth-action";
import { auth } from "@/libs/firebase/firebase";
import { isSigningOut, onAuthStateChanged } from "@/libs/firebase/auth";

export interface FirebaseUserState {
  user: User | null;
  loading: boolean;
}

export function useFirebaseUser(): FirebaseUserState {
  const [state, setState] = useState<FirebaseUserState>({
    user: null,
    loading: true,
  });

  // At most one recovery attempt per mount. Without this a failing token
  // would retry every time the listener re-fires with null.
  const recovering = useRef(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged((user) => {
      if (!active) return;

      if (user) {
        setState({ user, loading: false });
        return;
      }

      // No client user. The server session cookie may still be valid — the
      // two stores expire independently — in which case every client
      // Firestore read would fail `firestore.rules` and the account would
      // vanish from the UI. Ask the server to mint a custom token and sign
      // back in. See createClientAuthToken in actions/auth-action.ts.
      // A deliberate sign-out also clears client auth, and it does so before
      // removeSession() clears the cookie — recovering there would sign the
      // user straight back in.
      if (recovering.current || isSigningOut()) {
        setState({ user: null, loading: false });
        return;
      }
      recovering.current = true;

      void (async () => {
        const result = await createClientAuthToken();

        if (!active) return;

        if ("error" in result) {
          // Genuinely signed out: hold null and let the route gate redirect.
          setState({ user: null, loading: false });
          return;
        }

        try {
          // Resolves through the listener above, which sets the state.
          await signInWithCustomToken(auth, result.token);
        } catch (error) {
          console.error("[auth] client auth recovery failed", error);
          if (active) setState({ user: null, loading: false });
        }
      })();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
}
