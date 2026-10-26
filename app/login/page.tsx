import { Suspense } from "react";
import { redirect } from "next/navigation";

import GoogleSignInButton from "@/components/GoogleSignInButton";
import { HOME_ROUTE } from "@/constants";
import { getCurrentUser } from "@/libs/dal";

export const metadata = {
  title: "Sign in · viteCV",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
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
        <RedirectIfSignedIn searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/**
 * Bounces an already-signed-in visitor to the app — unless `?force=1`.
 *
 * The escape hatch is load-bearing. The session cookie and the browser
 * SDK's auth state expire independently, and when only the client half is
 * lost the app still renders but every client Firestore read fails and the
 * account disappears. Redirecting unconditionally would make that state
 * unrecoverable: the one action that fixes it — signing in again — lives on
 * this page, behind the redirect. `?force=1` reaches it.
 */
async function RedirectIfSignedIn({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  if ((await searchParams).force) return null;

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return null;
  }
  if (user) redirect(HOME_ROUTE);
  return null;
}
