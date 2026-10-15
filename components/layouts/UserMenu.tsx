"use client";

import { useState, useTransition } from "react";

import { removeSession } from "@/actions/auth-action";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { signOut } from "@/libs/firebase/auth";
import Button from "@/components/Button";
import { useToast } from "@/components/Toast";

export default function UserMenu() {
  const { user, loading } = useFirebaseUser();
  const { notify } = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const [pending, startTransition] = useTransition();

  if (loading || !user) return null;

  const label = user.displayName ?? user.email ?? "Account";

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut();
      startTransition(() => {
        void removeSession();
      });
    } catch (error) {
      setSigningOut(false);
      notify({
        variant: "error",
        message:
          error instanceof Error ? error.message : "Could not sign out.",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          className="size-7 rounded-full border border-zinc-200 dark:border-zinc-800"
        />
      ) : (
        <span className="flex size-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {label.charAt(0).toUpperCase()}
        </span>
      )}

      <span className="hidden max-w-32 truncate text-sm text-zinc-600 sm:block dark:text-zinc-400">
        {label}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={signingOut || pending}
      >
        {signingOut || pending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
