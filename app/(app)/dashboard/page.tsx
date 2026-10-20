import ContinueCard from "@/components/dashboard/ContinueCard";
import DashboardHero from "@/components/dashboard/DashboardHero";
import MarketGuide from "@/components/dashboard/MarketGuide";
import QuickActions from "@/components/dashboard/QuickActions";
import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";
import {
  UploadProgressBar,
  UploadProgressProvider,
} from "@/components/UploadProgress";

export default function DashboardPage() {
  return (
    <UploadProgressProvider>
      <PageShell bare actions={<UserMenu />} progress={<UploadProgressBar />}>
        <DashboardHero />

        <div className="mx-auto max-w-5xl px-6 pb-20">
          <ContinueCard />
          <QuickActions />
          <MarketGuide />
        </div>
      </PageShell>
    </UploadProgressProvider>
  );
}
