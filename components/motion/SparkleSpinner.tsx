import type { IconProps } from "../icons";
import { SPARKLE_24 } from "./markPaths";

/**
 * "AI is working": the sparkle turns and breathes. It takes currentColor, so
 * it sits in any button variant the way SpinnerIcon does.
 */
export default function SparkleSpinner({
  className = "size-4",
  ...props
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <g className="mo-sparkle-spin">
        <path d={SPARKLE_24} fill="currentColor" />
      </g>
    </svg>
  );
}
