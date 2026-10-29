import LibraryView from "@/components/library/LibraryView";
import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";

export default function LibraryPage() {
  return (
    <PageShell header="Your Library" actions={<UserMenu />}>
      <LibraryView />
    </PageShell>
  );
}
