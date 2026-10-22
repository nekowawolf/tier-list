"use client";

import { FiMoon, FiSun } from "react-icons/fi";
import { toggleDarkMode } from "@/utils/darkmode";

export default function ThemeToggle() {
  return (
    <button type="button" onClick={toggleDarkMode} aria-label="Toggle color theme" title="Toggle color theme" className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface transition-colors hover:border-blue-500/60 hover:bg-foreground/5">
      <FiSun size={18} aria-hidden="true" className="text-amber-400 light:hidden" />
      <FiMoon size={18} aria-hidden="true" className="hidden text-blue-600 light:block" />
    </button>
  );
}