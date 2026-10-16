import { Suspense } from "react";
import { redirect } from "next/navigation";

import GoogleSignInButton from "@/components/GoogleSignInButton";
import { HOME_ROUTE } from "@/constants";
import { getCurrentUser } from "@/libs/dal";

export const metadata = {
  title: "Sign in · viteCV",
};

export default function LoginPage() {
  return (
    <div className="flex h-full items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div
          aria-hidden="true"
          className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white dark:text-zinc-950"
        >
          V
        </div>

        <h1 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome to viteCV
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to build, match, and edit your resume.
        </p>

        <div className="mt-6">
          <GoogleSignInButton />
        </div>
      </div>

      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
    </div>
  );
}

async function RedirectIfSignedIn() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return null;
  }
  if (user) redirect(HOME_ROUTE);
  return null;
}
