"use client";

import { useTheme } from "@/hooks/useTheme";
import type { ThemePref } from "@/libs/theme";
import ViewSwitcher, { type ViewOption } from "@/components/ViewSwitcher";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";

const OPTIONS: ViewOption<ThemePref>[] = [
  { id: "light", label: "Light", icon: <SunIcon className="size-4" /> },
  { id: "dark", label: "Dark", icon: <MoonIcon className="size-4" /> },
  { id: "system", label: "Match system", icon: <MonitorIcon className="size-4" /> },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ViewSwitcher
      options={OPTIONS}
      value={theme}
      onChange={setTheme}
      label="Theme"
    />
  );
}
