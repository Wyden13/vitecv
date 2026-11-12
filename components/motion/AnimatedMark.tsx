import { useId } from "react";

import {
  MARK_DRAW_PATH,
  MARK_GROUP_TRANSFORM,
  MARK_SPARK_PATH,
  MARK_STROKE_PATH,
} from "./markPaths";

export interface AnimatedMarkProps {
  /** `reveal` plays once (splash, sign-in); `loader` loops (full-page waits). */
  mode: "reveal" | "loader";
  className?: string;
  label?: string;
}

/**
 * The mark with its stroke drawn through a mask. Light: blue tile, white →
 * spark gradient. Dark: sky tile, charcoal stroke, spark kept orange so the
 * animation still reads.
 */
export default function AnimatedMark({
  mode,
  className = "size-14",
  label = mode === "loader" ? "Loading" : "viteCV",
}: AnimatedMarkProps) {
  const id = useId().replace(/:/g, "");
  const reveal = mode === "reveal";

  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label={label}
      className={`group/mark ${className}`}
    >
      <defs>
        <linearGradient
          id={`${id}-ink`}
          gradientUnits="userSpaceOnUse"
          x1="294.5"
          y1="276.4"
          x2="354.5"
          y2="184.2"
        >
          <stop offset="0" className="[stop-color:#fff] dark:[stop-color:#222]" />
          <stop offset="1" className="[stop-color:var(--spark)]" />
        </linearGradient>
        <mask
          id={`${id}-mask`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="512"
          height="512"
        >
          <path
            className={reveal ? "mo-reveal-stroke" : "mo-loader-stroke"}
            d={MARK_DRAW_PATH}
            fill="none"
            stroke="#fff"
            strokeWidth="130"
            strokeLinejoin="miter"
            strokeMiterlimit="10"
          />
        </mask>
      </defs>
      <rect
        className={`fill-accent ${reveal ? "mo-reveal-tile" : ""}`}
        width="512"
        height="512"
        rx="144"
      />
      <g transform={MARK_GROUP_TRANSFORM}>
        <path
          d={MARK_STROKE_PATH}
          fill={`url(#${id}-ink)`}
          mask={`url(#${id}-mask)`}
        />
        <path
          className={`fill-spark ${reveal ? "mo-reveal-spark" : "mo-loader-spark"}`}
          d={MARK_SPARK_PATH}
        />
      </g>
    </svg>
  );
}
