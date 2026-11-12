/**
 * The viteCV mark on its 512 grid (public/brand/mark.svg): one brushstroke V
 * whose long arm tapers into the sparkle. Shared by every animated variant so
 * the motion never drifts from the static logo.
 */
export const MARK_GROUP_TRANSFORM =
  "translate(256 258) scale(0.88) translate(-260 -282.5)";

export const MARK_STROKE_PATH =
  "M149.7 193.3L137.3 170.7Q103.5 198.4 79.3 243.7L209.8 481.8Q288.6 337.2 357.4 186.1L351.6 182.3Q285.7 255.7 226.5 333.4Z";

export const MARK_SPARK_PATH =
  "M343.8 200.7Q369.0 144.7 323.3 103.8Q379.3 129.0 420.2 83.3Q395.0 139.3 440.7 180.2Q384.7 155.0 343.8 200.7Z";

/** The centre line the stroke is drawn along, used as a mask for draw-ons. */
export const MARK_DRAW_PATH = "M108.3 190L214.0 420.0L354.5 184.2";

/** The four-point sparkle on a 24 grid, for icons and buttons. */
export const SPARKLE_24 = "M12 2Q13.8 10.2 22 12Q13.8 13.8 12 22Q10.2 13.8 2 12Q10.2 10.2 12 2Z";
