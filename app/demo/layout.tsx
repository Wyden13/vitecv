import { Suspense } from "react";
import { notFound } from "next/navigation";

import Sidebar from "@/components/sidebar/Sidebar";

/**
 * The app chrome around fixtures, for README and portfolio screenshots
 * (`npm run dev`, then /demo/dashboard). No auth and no Firestore: every page
 * renders the real components with data/demoFixtures.ts. Production builds
 * 404 the whole tree, and proxy.ts only lets /demo through in development.
 */
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar basePath="/demo" />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
