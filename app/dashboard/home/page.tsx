"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap as ZapIcon,
    ChevronRight,
    Clock as ClockIcon,
    Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardHome() {
    const [dailyExercises, setDailyExercises] = useState<any[]>([]);
    const [dailyFocus, setDailyFocus] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("currentWorkoutPlan");
        if (stored) {
            const plan = JSON.parse(stored);
            const schedule = plan.weeklyPlan || [];
            const startDate = localStorage.getItem("planStartDate");

            const computeDateIndex = (startDateISO: string | null) => {
                if (!startDateISO) return 0;
                const start = new Date(startDateISO);
                const now = new Date();
                const diffMs = now.getTime() - start.getTime();
                return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            };

            const todayIndex = computeDateIndex(startDate) % schedule.length;
            const todayPlan = schedule[todayIndex];

            if (todayPlan) {
                setDailyExercises(todayPlan.exercises || []);
                setDailyFocus(todayPlan.focus || null);
            }
        }
    }, []);

    const currentExercise = dailyExercises[0];

    return (
        <div className="p-6 space-y-8">
            {/* Hero Section */}
            <section className="space-y-6">
                <header className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Plan Status: Active</p>
                    <h1 className="text-4xl font-black uppercase tracking-tight leading-none">
                        Welcome back, <br /> <span className="text-primary italic">Athlete</span>
                    </h1>
                </header>

                {/* Main Action Card */}
                {currentExercise ? (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="p-8 rounded-[2.5rem] bg-card border border-card-border shadow-2xl shadow-primary/5 space-y-6 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ZapIcon className="w-24 h-24 text-primary fill-current" />
                        </div>

                        <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Up Next Today</p>
                            <h2 className="text-3xl font-black uppercase text-white leading-tight">{currentExercise.name}</h2>
                            <p className="text-sm font-bold text-primary/80 uppercase tracking-widest italic">{dailyFocus || 'Strength Session'}</p>
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-muted uppercase">Target</p>
                                    <p className="text-xs font-black italic">{currentExercise.reps}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-muted uppercase">Sets</p>
                                    <p className="text-xs font-black italic">{currentExercise.sets || 3}</p>
                                </div>
                            </div>

                            <Link
                                href="/dashboard/exercise/0"
                                className="w-14 h-14 rounded-2xl bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-transform"
                            >
                                <Play className="w-6 h-6 fill-current" />
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <div className="p-8 rounded-[2.5rem] bg-card border border-dashed border-white/10 flex items-center justify-center text-center">
                        <p className="text-muted text-xs font-black uppercase tracking-widest">No exercises assigned yet.</p>
                    </div>
                )}
            </section>

            {/* Horizontal Exercises List */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        Today&apos;s Full Session
                    </h3>
                    <span className="text-[10px] font-black text-primary">{dailyExercises.length} Tasks</span>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                    {dailyExercises.map((exercise, idx) => (
                        <motion.div
                            key={`${exercise.name}-${idx}`}
                            whileTap={{ scale: 0.95 }}
                            className="min-w-[200px] p-5 rounded-3xl bg-card border border-card-border space-y-3 shrink-0"
                        >
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black uppercase line-clamp-1">{exercise.name}</h4>
                                <p className="text-[10px] text-muted font-bold tracking-tight">{exercise.reps} · {exercise.sets || 3} sets</p>
                            </div>
                            <Link
                                href={`/dashboard/exercise/${idx}`}
                                className="text-[10px] font-black uppercase text-primary tracking-widest block pt-2"
                            >
                                View Details
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Quick Stats Grid */}
            <section className="grid grid-cols-2 gap-4 pb-12">
                <div className="p-5 rounded-3xl bg-card border border-card-border space-y-1">
                    <p className="text-[8px] font-black text-muted uppercase tracking-widest">Streak</p>
                    <p className="text-xl font-black">12 <span className="text-[10px] text-primary italic">DAYS</span></p>
                </div>
                <div className="p-5 rounded-3xl bg-card border border-card-border space-y-1">
                    <p className="text-[8px] font-black text-muted uppercase tracking-widest">Readiness</p>
                    <p className="text-xl font-black text-secondary uppercase italic">Elite</p>
                </div>
            </section>
        </div>
    );
}
