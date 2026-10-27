import Topbar from "@/components/layouts/Topbar";

export interface PageShellProps {
  /** Omitted only in `bare` mode, where the page supplies its own heading. */
  header?: string;
  actions?: React.ReactNode;
  progress?: React.ReactNode;
  children?: React.ReactNode;
  /**
   * Drops the titled topbar and the padded grey body so a page can own the
   * full canvas — the dashboard hero. `actions` still floats top-right, so
   * the user menu never becomes unreachable.
   */
  bare?: boolean;
}

export default function PageShell({
  header,
  actions,
  progress,
  children,
  bare = false,
}: PageShellProps) {
  if (bare) {
    return (
      <div className="relative flex min-h-full flex-col">
        {actions && (
          <div className="absolute right-6 top-4 z-10 flex items-center gap-2">
            {actions}
          </div>
        )}
        {progress}
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <Topbar header={header ?? ""}>{actions}</Topbar>
      {progress}
      <div className="flex-1 bg-zinc-50 px-6 py-5 dark:bg-zinc-950">{children}</div>
    </div>
  );
}
