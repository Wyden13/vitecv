import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";

export default function InsightPage() {
  return <PageShell header="Insights" actions={<UserMenu />} />;
}
