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
                "fixed top-6 right-6 z-[200] p-3 rounded-2xl backdrop-blur-xl border flex items-center justify-center transition-all active:scale-95",
                "bg-white/10 border-white/10 text-white hover:bg-white/20",
                "light:bg-black/5 light:border-black/5 light:text-black"
            )}
        >
            {theme === "dark" ? <Sun className="w-5 h-5 fill-current" /> : <Moon className="w-5 h-5 fill-current" />}
        </button>
    );
}
