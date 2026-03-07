"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, ChevronRight, Loader2 } from "lucide-react";
import { getUserProfile } from "@/lib/actions";

import Link from "next/link";

export default function WorkoutPlanPage() {
    const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const profile = await getUserProfile();
                if (profile && profile.workoutPlans?.[0]) {
                    setWeeklyPlan((profile.workoutPlans[0].weeklyPlan as any[]) || []);
                }
            } catch (error) {
                console.error("Failed to load workout plan", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [getUserProfile]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Protocol...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <header className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Overview</p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground dark:text-white">My Weekly Plan</h1>
            </header>

            <div className="space-y-4">
                {weeklyPlan.map((day: any, idx: number) => (
                    <Link href={`/dashboard/workout/${idx}`} key={`${day.day}-${idx}`} className="block">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-5 rounded-3xl bg-card border border-card-border space-y-3 hover:border-primary/50 cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/ dark:text-white/">Day {idx + 1}</p>
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
                    </Link>
                ))}
            </div>
        </div>
    );
}
