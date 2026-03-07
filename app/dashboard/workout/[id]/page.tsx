"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Zap,
    ArrowRight,
    Timer,
    Flame,
    Loader2
} from "lucide-react";
import { getUserProfile } from "@/lib/actions";
import Link from "next/link";

export default function DailyWorkoutPage() {
    const params = useParams();
    const router = useRouter();
    const [dayData, setDayData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const profile = await getUserProfile();
                const dayIdx = parseInt(params.id as string);
                if (profile && profile.workoutPlans?.[0]) {
                    const plan = profile.workoutPlans[0].weeklyPlan as any[];
                    if (plan[dayIdx]) {
                        setDayData(plan[dayIdx]);
                    }
                }
            } catch (error) {
                console.error("Failed to load workout day", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Downloading Routine...</p>
            </div>
        );
    }

    if (!dayData) {
        return (
            <div className="p-6 text-center">
                <p>Workout data not found.</p>
                <Link href="/dashboard/workout" className="text-primary">Back to Plan</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="p-6 flex items-center gap-4 border-b border-card-border sticky top-0 bg-background/80 backdrop-blur-xl z-20">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 rounded-full hover:bg-foreground/5 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Day {parseInt(params.id as string) + 1}</p>
                    <h1 className="text-xl font-black uppercase tracking-tight">{dayData.focus || "Session"}</h1>
                </div>
            </header>

            <div className="p-6 space-y-8 pb-32">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-secondary/10 border border-secondary/20 flex flex-col items-center justify-center space-y-1">
                        <Timer className="w-5 h-5 text-secondary" />
                        <p className="text-xl font-black uppercase">{dayData.exercises.length * 5}m</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted">Est. Time</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-accent/10 border border-accent/20 flex flex-col items-center justify-center space-y-1">
                        <Flame className="w-5 h-5 text-accent" />
                        <p className="text-xl font-black uppercase">{dayData.exercises.length * 45}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted">Est. Burn</p>
                    </div>
                </div>

                {/* Exercises List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted">Today&apos;s Protocol</h3>
                        <p className="text-[10px] font-black text-primary uppercase">{dayData.exercises.length} Exercises</p>
                    </div>

                    <div className="space-y-3">
                        {dayData.exercises.map((ex: any, idx: number) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-5 rounded-3xl bg-card border border-card-border group hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center text-sm font-black text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-base leading-tight">{ex.name}</h4>
                                        <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">
                                            {ex.sets} Sets · {ex.reps}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/dashboard/exercise/${params.id}?startAt=${idx}`)}
                                        className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Float Action Button */}
            <div className="fixed bottom-24 left-0 right-0 p-6 flex justify-center z-30">
                <button
                    onClick={() => router.push(`/dashboard/exercise/${params.id}`)}
                    className="w-full max-w-sm py-4 rounded-[2rem] bg-primary text-black font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Zap className="w-5 h-5 fill-current" />
                    Commence Training
                </button>
            </div>
        </div>
    );
}
