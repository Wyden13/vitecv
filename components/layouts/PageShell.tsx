import Topbar from "@/components/layouts/Topbar";

export interface PageShellProps {
  header: string;
  actions?: React.ReactNode;
  /** Full-bleed slot rendered directly under the header, e.g. a progress bar. */
  progress?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageShell({
  header,
  actions,
  progress,
  children,
}: PageShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <Topbar header={header}>{actions}</Topbar>
      {progress}
      <div className="flex-1 px-6 py-5">{children}</div>
    </div>
  );
}
