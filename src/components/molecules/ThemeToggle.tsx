"use client";

import clsx from "clsx";
import { SelectField } from "@/components/atoms/SelectField";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";

type ThemeToggleProps = {
  className?: string;
};

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <label
      className={clsx(
        "flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]",
        className
      )}
    >
      <span>Theme</span>
      <SelectField
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
        className="text-xs"
        aria-label="Theme"
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </SelectField>
    </label>
  );
};
