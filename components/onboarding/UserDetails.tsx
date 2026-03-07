"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface UserDetailsProps {
    onNext: (details: { age: number; height: number; weight: number }) => void;
}

export function UserDetails({ onNext }: UserDetailsProps) {
    const [age, setAge] = useState<string>("");
    const [height, setHeight] = useState<string>("");
    const [weight, setWeight] = useState<string>("");

    const isValid = age && height && weight && !isNaN(Number(age)) && !isNaN(Number(height)) && !isNaN(Number(weight));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onNext({
                age: Number(age),
                height: Number(height),
                weight: Number(weight)
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl space-y-12"
        >
            <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
                    Tell me about <span className="text-primary">yourself.</span>
                </h2>
                <p className="text-foreground/60 dark:text-white/60 text-lg">
                    I need your stats to tailor the perfect plan for your body.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Age */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50">Age (Years)</label>
                        <select
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 text-xl font-medium focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                        >
                            <option value="" disabled className="text-foreground/30 dark:text-white/30">Select Age</option>
                            {Array.from({ length: 80 }, (_, i) => i + 14).map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>

                    {/* Height */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50">Height (cm)</label>
                        <select
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 text-xl font-medium focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                        >
                            <option value="" disabled className="text-foreground/30 dark:text-white/30">Select Height</option>
                            {Array.from({ length: 120 }, (_, i) => i + 120).map(num => (
                                <option key={num} value={num}>{num} cm</option>
                            ))}
                        </select>
                    </div>

                    {/* Weight */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50">Weight (kg)</label>
                        <select
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 text-xl font-medium focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                        >
                            <option value="" disabled className="text-foreground/30 dark:text-white/30">Select Weight</option>
                            {Array.from({ length: 150 }, (_, i) => i + 40).map(num => (
                                <option key={num} value={num}>{num} kg</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={!isValid}
                        className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all bg-primary text-black hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        Continue
                        <ArrowRight className="w-5 h-5 group-enabled:group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
