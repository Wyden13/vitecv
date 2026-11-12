/**
 * The viteCV lockup. Two images rather than one, because dark mode follows
 * `data-theme` (the in-app toggle), which a `<picture>` media query cannot see.
 */
export interface LogoProps {
  /** Height in px; the lockup is 484×136. */
  height?: number;
  className?: string;
}

export default function Logo({ height = 28, className = "" }: LogoProps) {
  const width = Math.round((height * 484) / 136);
  return (
    <span className={`inline-flex ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
      <img
        src="/brand/lockup-light.svg"
        alt="viteCV"
        width={width}
        height={height}
        className="dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
      <img
        src="/brand/lockup-dark.svg"
        alt="viteCV"
        width={width}
        height={height}
        className="hidden dark:block"
      />
    </span>
  );
}
