export interface TopbarProps {
  header: string;
  children?: React.ReactNode;
}

export default function Topbar({ header, children }: TopbarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-200 bg-background px-6 py-4 dark:border-zinc-800">
      <h1 className="text-lg font-semibold tracking-tight">{header}</h1>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
