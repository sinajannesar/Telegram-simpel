"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeSwitcher() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {mounted && (
        theme === "light" ? (
          <Moon className="h-5 w-5 transition-transform duration-200" />
        ) : (
          <Sun className="h-5 w-5 transition-transform duration-200" />
        )
      )}
    </button>
  );
}