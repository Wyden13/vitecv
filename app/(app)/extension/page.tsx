import ExtensionConnect from "@/components/extension/ExtensionConnect";
import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";

export default function ExtensionPage() {
  return (
    <PageShell header="Browser extension" actions={<UserMenu />}>
      <ExtensionConnect />
    </PageShell>
  );
}
