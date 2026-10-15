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
    // The page is tinted and the card is not: --background is pure white in
    // light mode, so a card using it would be invisible against the page.
    <div className="flex h-full items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Decorative — the heading below already carries the name. */}
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

/**
 * Sends an already-signed-in user to the app.
 *
 * `proxy.ts` deliberately does not do this: it only knows whether a cookie
 * exists, and bouncing on presence alone loops forever against the DAL's
 * redirect when the cookie is stale. Here the session is actually verified, so
 * an invalid cookie falls through and the sign-in form renders — which is what
 * lets the user recover.
 */
async function RedirectIfSignedIn() {
  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    // Resolving the session failed outright — misconfigured service account,
    // Firebase unreachable. This redirect is only a convenience, so it fails
    // open to the sign-in form rather than taking the page down. /login is the
    // recovery surface; trapping the user on an error here leaves no way out.
    return null;
  }

  // Outside the try on purpose: redirect() signals by throwing, and a catch
  // around it would swallow the navigation.
  if (user) redirect(HOME_ROUTE);
  return null;
}
