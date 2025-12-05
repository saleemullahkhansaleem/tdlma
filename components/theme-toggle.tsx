"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  size?: "icon" | "default";
  variant?: "outline" | "ghost";
};

export function ThemeToggle({
  size = "icon",
  variant = "ghost",
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only showing theme after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  // Show a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={size === "icon" ? "rounded-full" : "rounded-full px-4"}
        aria-label="Toggle theme"
      >
        {size === "icon" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <span className="flex items-center gap-2 text-xs">
            <Moon className="h-4 w-4" />
            Dark mode
          </span>
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={size === "icon" ? "rounded-full" : "rounded-full px-4"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {size === "icon" ? (
        isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
      ) : (
        <span className="flex items-center gap-2 text-xs">
          {isDark ? (
            <>
              <Sun className="h-4 w-4" />
              Light mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              Dark mode
            </>
          )}
        </span>
      )}
    </Button>
  );
}

