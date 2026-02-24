"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Activity, ArrowRight, Dna } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeSelectionProps {
    goal: string;
    onComplete: (mode: string) => void;
}

export function ModeSelection({ goal, onComplete }: ModeSelectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-5xl space-y-12"
        >
            <div className="space-y-4 text-center">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <Dna className="w-16 h-16 text-primary animate-pulse" />
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
                    Select Your <span className="text-secondary">Level</span>
                </h2>
                <p className="text-white/60 text-lg max-w-xl mx-auto">
                    Based on your goal: <span className="text-white italic">&quot;{goal}&quot;</span>. How hard do you want to train?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Mode */}
                <ModeCard
                    title="Easy"
                    description="Perfect for starting out. Stay active and build a habit without strict rules."
                    icon={<Activity className="w-6 h-6" />}
                    color="white"
                    onClick={() => onComplete("active")}
                />

                {/* Intermediate Mode */}
                <ModeCard
                    title="Balanced"
                    description="Move faster. A mix of steady progress and structured training sessions."
                    icon={<Shield className="w-6 h-6" />}
                    color="secondary"
                    highlight
                    onClick={() => onComplete("intermediate")}
                />

                {/* Locked-In Mode */}
                <ModeCard
                    title="Elite"
                    description="Maximum intensity. Strict targets and daily tracking for the best results."
                    icon={<Zap className="w-6 h-6" />}
                    color="accent"
                    onClick={() => onComplete("locked-in")}
                />
            </div>
        </motion.div>
    );
}

function ModeCard({ title, description, icon, color, highlight, onClick }: any) {
    const colors: any = {
        white: "border-white/10 bg-white/5 hover:border-white/30",
        secondary: "border-secondary/20 bg-secondary/5 hover:border-secondary/50",
        accent: "border-accent/20 bg-accent/5 hover:border-accent/50",
    };

    const textColors: any = {
        white: "text-white",
        secondary: "text-secondary",
        accent: "text-accent",
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex flex-col p-8 rounded-3xl border text-left transition-all duration-500 group overflow-hidden",
                colors[color],
                highlight && "ring-2 ring-secondary/40"
            )}
        >
            {highlight && (
                <div className="absolute top-4 right-4 bg-secondary text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                    Recommended
                </div>
            )}

            <div className={cn("mb-6 p-4 rounded-2xl bg-white/5 inline-flex", textColors[color])}>
                {icon}
            </div>

            <h3 className="text-2xl font-black uppercase mb-3 tracking-wide">{title}</h3>
            <p className="text-white/50 leading-relaxed mb-8 flex-grow">{description}</p>

            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x--2 group-hover:translate-x-0">
                Start <ArrowRight className="w-4 h-4" />
            </div>

            {/* Background Glow */}
            <div className={cn(
                "absolute -bottom-24 -right-24 w-48 h-48 blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity rounded-full",
                color === 'white' ? 'bg-white' : color === 'secondary' ? 'bg-secondary' : 'bg-accent'
            )} />
        </button>
    );
}
