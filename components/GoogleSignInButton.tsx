"use client";

import { useState, useTransition } from "react";

import { createSession } from "@/actions/auth-action";
import { signInWithGoogle } from "@/libs/firebase/auth";
import Button from "./Button";
import { GoogleIcon, SpinnerIcon } from "./icons";
import { useToast } from "./Toast";

export default function GoogleSignInButton() {
  const { notify } = useToast();
  const [signingIn, setSigningIn] = useState(false);
  const [pending, startTransition] = useTransition();

  const busy = signingIn || pending;

  const handleClick = async () => {
    setSigningIn(true);

    try {
      const user = await signInWithGoogle();
      // Null means the user dismissed the popup — not an error worth shouting about.
      if (!user) return;

      const idToken = await user.getIdToken();
      // createSession redirects on success, so it must run in a transition.
      startTransition(() => {
        void createSession(idToken);
      });
    } catch (error) {
      notify({
        variant: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not sign in with Google.",
      });
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      disabled={busy}
      onClick={handleClick}
      icon={
        busy ? (
          <SpinnerIcon className="size-4" />
        ) : (
          <GoogleIcon className="size-4" />
        )
      }
    >
      {busy ? "Signing in…" : "Continue with Google"}
    </Button>
  );
}
