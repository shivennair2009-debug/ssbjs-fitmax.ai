"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("dark", "light");
        root.classList.add(theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className="flex min-h-[100dvh] bg-neutral-100 dark:bg-neutral-950 items-center justify-center transition-colors">
                <main className="w-full max-w-[450px] lg:max-w-[500px] min-h-[100dvh] bg-background shadow-2xl relative z-0 flex flex-col overflow-y-auto no-scrollbar sm:border-x sm:border-black/10 dark:sm:border-white/10 transition-colors">
                    {children}
                </main>
            </div>
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
};
