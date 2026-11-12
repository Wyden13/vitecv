/** Stands in for UserMenu, which needs a signed-in Firebase user. */
export default function DemoAvatar() {
  return (
    <span
      aria-label="Avery Lin"
      className="flex size-9 items-center justify-center rounded-full bg-accent-subtle text-sm font-semibold text-accent"
    >
      AL
    </span>
  );
}
