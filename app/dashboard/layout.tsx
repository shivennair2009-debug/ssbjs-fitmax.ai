"use client";

import { ReactNode } from "react";
import {
    Activity as ActivityIcon,
    Calendar as CalendarIcon,
    Utensils as UtensilsIcon,
    Target as TargetIcon,
    MessageSquare,
    ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { icon: <ActivityIcon className="w-5 h-5" />, label: "Home", href: "/dashboard/home" },
        { icon: <CalendarIcon className="w-5 h-5" />, label: "Plan", href: "/dashboard/workout" },
        { icon: <UtensilsIcon className="w-5 h-5" />, label: "Food", href: "/dashboard/meals" },
        { icon: <TargetIcon className="w-5 h-5" />, label: "Stats", href: "/dashboard/stats" },
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
                            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-black text-xs shadow-lg shadow-primary/20">FM</div>
                        <span className="font-black tracking-tighter text-lg uppercase">FitMax <span className="text-primary italic">AI</span></span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow overflow-y-auto no-scrollbar pb-32">
                {children}
            </main>

            {/* Bottom Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-background/80 backdrop-blur-xl border-t border-card-border z-50">
                <nav className="flex items-center justify-between max-w-[450px] mx-auto px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-300",
                                    isActive ? "text-primary" : "text-muted hover:text-foreground"
                                )}
                            >
                                <div className={cn("transition-all duration-300", isActive ? "scale-110" : "scale-100 opacity-60")}>
                                    {item.icon}
                                </div>
                                <span className={cn("text-[8px] font-black uppercase tracking-widest transition-opacity duration-300", isActive ? "opacity-100" : "opacity-40")}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-active"
                                        className="absolute -top-1 w-1 h-1 rounded-full bg-primary"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </footer>
        </div>
    );
}
