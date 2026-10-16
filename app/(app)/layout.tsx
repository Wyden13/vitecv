import { Suspense } from "react";

import Sidebar from "@/components/sidebar/Sidebar";
import { requireUser } from "@/libs/dal";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-full overflow-hidden print:block print:h-auto print:overflow-visible">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto print:overflow-visible">
        <Suspense fallback={null}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </main>
    </div>
  );
}

async function AuthGate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
