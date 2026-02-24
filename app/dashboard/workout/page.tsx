"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";

export default function WorkoutPlanPage() {
    const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("currentWorkoutPlan");
        if (stored) {
            const plan = JSON.parse(stored);
            setWeeklyPlan(plan.weeklyPlan || []);
        }
    }, []);

    return (
        <div className="p-6 space-y-8">
            <header className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Overview</p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">My Weekly Plan</h1>
            </header>

            <div className="space-y-4">
                {weeklyPlan.map((day: any, idx: number) => (
                    <motion.div
                        key={`${day.day}-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-5 rounded-3xl bg-card border border-card-border space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{day.day}</p>
                                <h3 className="text-sm font-black uppercase">{day.focus || "Session"}</h3>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted" />
                        </div>

                        <div className="space-y-1">
                            {(day.exercises || []).slice(0, 3).map((ex: any, exIdx: number) => (
                                <p key={exIdx} className="text-[10px] text-muted font-bold uppercase tracking-tight">
                                    {ex.name} · {ex.reps}
                                </p>
                            ))}
                            {(day.exercises || []).length > 3 && (
                                <p className="text-[8px] text-primary/60 font-black uppercase">+ {(day.exercises || []).length - 3} more</p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
