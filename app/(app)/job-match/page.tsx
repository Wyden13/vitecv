import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";

export default function JobMatchPage() {
  return <PageShell header="Job Match" actions={<UserMenu />} />;
}
