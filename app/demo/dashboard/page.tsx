import DashboardHero from "@/components/dashboard/DashboardHero";
import MarketGuide from "@/components/dashboard/MarketGuide";
import QuickActions from "@/components/dashboard/QuickActions";
import PageShell from "@/components/layouts/PageShell";
import { UploadProgressProvider } from "@/components/UploadProgress";

import DemoAvatar from "../DemoAvatar";

export default function DemoDashboardPage() {
  return (
    <UploadProgressProvider>
      <PageShell bare actions={<DemoAvatar />}>
        <DashboardHero />
        <div className="mx-auto max-w-5xl px-6 pb-20">
          <QuickActions />
          <MarketGuide />
        </div>
      </PageShell>
    </UploadProgressProvider>
  );
}
