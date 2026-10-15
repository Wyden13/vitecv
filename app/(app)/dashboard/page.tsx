import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";

export default function DashboardPage() {
  return <PageShell header="Dashboard" actions={<UserMenu />} />;
}
