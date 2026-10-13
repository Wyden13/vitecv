import Topbar from "./Topbar";

export interface PageShellProps {
  header: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageShell({ header, actions, children }: PageShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <Topbar header={header}>{actions}</Topbar>
      <div className="flex-1 px-6 py-5">{children}</div>
    </div>
  );
}
