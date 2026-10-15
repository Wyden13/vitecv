import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";

export default function JobTrackerPage() {
  return <PageShell header="Job Tracker" actions={<UserMenu />} />;
}
