/**
 * Theme preference — shared by the no-flash boot script in `app/layout.tsx`
 * and the `useTheme` hook.
 *
 * The source of truth is the `data-theme` attribute on `<html>`, which always
 * holds a *resolved* value ("light" or "dark"). The user's *preference* may
 * additionally be "system", in which case it is stored as the absence of a
 * localStorage entry and resolved against `prefers-color-scheme` on every read.
 */

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "vitecv-theme";

/** Same-tab notification; the `storage` event only fires in *other* tabs. */
export const THEME_EVENT = "vitecv:themechange";

export const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Runs blocking in `<head>` so the correct palette is in place before the
 * first paint — a deferred script would flash white at every dark-mode load.
 * Kept to one statement and wrapped in try/catch: localStorage throws in some
 * privacy modes, and a boot script must never be the thing that breaks a page.
 */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.dataset.theme=(s==="dark"||s==="light")?s:(window.matchMedia("${DARK_QUERY}").matches?"dark":"light");}catch(e){}})();`;

export function resolveTheme(pref: ThemePref): ResolvedTheme {
  if (pref !== "system") return pref;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function applyTheme(pref: ThemePref): void {
  document.documentElement.dataset.theme = resolveTheme(pref);
}

export function readStoredTheme(): ThemePref {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : "system";
  } catch {
    return "system";
  }
}

export function writeStoredTheme(pref: ThemePref): void {
  try {
    if (pref === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, pref);
    }
  } catch {
    // Preference is not persistable here; the in-session theme still applies.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}
