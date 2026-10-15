import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";

export default function CoverLetterPage() {
  return (
    <PageShell header="Cover Letter" actions={<UserMenu />}>
      <div>something</div>
    </PageShell>
  );
}
