"use client";

import { ReactNode, useState } from "react";
import {
    Activity as ActivityIcon,
    Calendar as CalendarIcon,
    Utensils as UtensilsIcon,
    MessageSquare,
    ChevronLeft,
    User,
    LogOut,
    Settings,
    X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const navItems = [
        { icon: <ActivityIcon className="w-5 h-5" />, label: "Home", href: "/dashboard/home" },
        { icon: <CalendarIcon className="w-5 h-5" />, label: "Plan", href: "/dashboard/workout" },
        { icon: <UtensilsIcon className="w-5 h-5" />, label: "Food", href: "/dashboard/meals" },
        { icon: <MessageSquare className="w-5 h-5" />, label: "Coach", href: "/dashboard/chat" },
    ];

    const showBackButton = pathname !== "/dashboard/home";

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            {/* Global Header with Back Button */}
            <header className="p-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-2">
                    {showBackButton && (
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 rounded-full hover:bg-black/ dark:bg-white/ transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div className="flex items-center gap-3 relative z-50">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            <User className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-12 left-0 w-64 bg-background border border-card-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[100]"
                                >
                                    <div className="p-4 border-b border-card-border bg-foreground/5 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm">Account Settings</p>
                                            <p className="text-[10px] text-muted uppercase tracking-widest font-black">FitMax Member</p>
                                        </div>
                                        <button onClick={() => setIsDropdownOpen(false)} className="p-1.5 rounded-full hover:bg-foreground/10 text-muted hover:text-foreground transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                router.push("/dashboard/profile");
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-foreground/5 text-sm font-medium transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                <Settings className="w-4 h-4" />
                                            </div>
                                            Profile & Settings
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                handleSignOut();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-sm font-medium text-red-500 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            Sign Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Invisible Backdrop for closing dropdown */}
                        {isDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow overflow-y-auto no-scrollbar pb-32">
                {children}
            </main>

            {/* Bottom Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-card-border z-50">
                <nav className="flex items-center justify-around max-w-lg mx-auto px-2 py-3 pb-safe">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-200 relative"
                            >
                                {/* Active top indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                                    />
                                )}
                                <div className={cn(
                                    "transition-all duration-200",
                                    isActive ? "text-primary scale-110" : "text-muted scale-100"
                                )}>
                                    {item.icon}
                                </div>
                                <span className={cn(
                                    "text-[8px] font-black uppercase tracking-widest transition-all duration-200",
                                    isActive ? "text-primary" : "text-muted opacity-50"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </footer>
        </div>
    );
}
