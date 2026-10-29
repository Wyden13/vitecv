"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  applyTheme,
  DARK_QUERY,
  readStoredTheme,
  THEME_EVENT,
  writeStoredTheme,
  type ThemePref,
} from "@/libs/theme";

export interface ThemeState {
  theme: ThemePref;
  setTheme: (next: ThemePref) => void;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

/** Matches the attribute the server renders; the boot script corrects it. */
const serverSnapshot = (): ThemePref => "system";

export function useTheme(): ThemeState {
  const theme = useSyncExternalStore(
    subscribe,
    readStoredTheme,
    serverSnapshot,
  );

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;

    const media = window.matchMedia(DARK_QUERY);
    const reapply = () => applyTheme("system");
    media.addEventListener("change", reapply);

    return () => media.removeEventListener("change", reapply);
  }, [theme]);

  const setTheme = useCallback((next: ThemePref) => {
    applyTheme(next);
    writeStoredTheme(next);
  }, []);

  return { theme, setTheme };
}
