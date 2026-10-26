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

    let idToken: string;

    try {
      const user = await signInWithGoogle();
      if (!user) {
        setSigningIn(false);
        return;
      }

      idToken = await user.getIdToken();
    } catch (error) {
      setSigningIn(false);
      notify({
        variant: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not sign in with Google.",
      });
      return;
    }

    // On success createSession redirects and this component unmounts, so
    // `signingIn` is only cleared on the failure path below.
    startTransition(async () => {
      const result = await createSession(idToken);
      if (result?.error) {
        setSigningIn(false);
        notify({ variant: "error", message: result.error });
      }
    });
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
