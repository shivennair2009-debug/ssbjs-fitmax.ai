"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLES = [
    "Lose belly fat and tone up",
    "Prepare for football trials",
    "Improve my swimming stamina",
    "Stay active during exam weeks",
    "Get taller and improve posture"
];

export function GoalInput({ onNext }: { onNext: (goal: string) => void }) {
    const [goal, setGoal] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (goal.trim()) onNext(goal);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl mx-auto space-y-12"
        >
            <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
                    What is your <span className="text-primary">main goal?</span>
                </h2>
                <p className="text-foreground/80 text-lg">
                    Tell me exactly what you want to achieve, in your own words.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <input
                    autoFocus
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Prepare for marathon, fix my back pain..."
                    className="w-full bg-transparent border-b-2 border-foreground/20 py-6 text-2xl md:text-3xl font-medium focus:outline-none focus:border-primary transition-colors pr-16 placeholder:text-muted"
                />
                <button
                    disabled={!goal.trim()}
                    className={cn(
                        "absolute right-0 bottom-6 p-2 rounded-full transition-all duration-300",
                        goal.trim() ? "text-primary opacity-100 scale-110" : "text-muted opacity-0 scale-90"
                    )}
                >
                    <Send className="w-8 h-8" />
                </button>
            </form>

            <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted font-bold">Try these ideas</p>
                <div className="flex flex-wrap gap-3">
                    {EXAMPLES.map((example) => (
                        <button
                            key={example}
                            onClick={() => setGoal(example)}
                            className="px-4 py-2 rounded-lg border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 hover:border-foreground/30 transition-all text-sm text-muted hover:text-foreground"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-8">
                <div className="flex items-center gap-4 text-muted text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span>I&apos;m ready to help you plan!</span>
                </div>
            </div>
        </motion.div>
    );
}
