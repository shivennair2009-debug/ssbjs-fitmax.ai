"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "fixed top-6 right-6 z-[200] w-14 h-14 rounded-2xl backdrop-blur-xl border flex items-center justify-center transition-all active:scale-95 touch-manipulation",
                "bg-black/5 border-black/5 text-black hover:bg-black/10",
                "dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-white/20"
            )}
        >
            {theme === "dark" ? <Sun className="w-5 h-5 fill-current" /> : <Moon className="w-5 h-5 fill-current" />}
        </button>
    );
}
