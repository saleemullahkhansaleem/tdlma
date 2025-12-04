"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ThemeToggleProps = {
  size?: "icon" | "default";
  variant?: "outline" | "ghost";
};

export function ThemeToggle({
  size = "icon",
  variant = "ghost",
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={size === "icon" ? "rounded-full" : "rounded-full px-4"}
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

