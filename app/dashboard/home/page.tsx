"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, ChevronRight, CheckCircle2, Flame, Footprints, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { getUserProfile, getWorkoutLogs } from "@/lib/actions";

export default function DashboardHome() {
    const [dailyExercises, setDailyExercises] = useState<any[]>([]);
    const [dailyFocus, setDailyFocus] = useState<string | null>(null);
    const [planName, setPlanName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // Stats data
    const [tasksDone, setTasksDone] = useState(0);
    const [calories, setCalories] = useState(0);
    const [steps, setSteps] = useState(0);
    const [streak, setStreak] = useState(0);

    /* Day Ring Layout calculation fields */
    const days = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
    const [activeDayIndex, setActiveDayIndex] = useState(0);
    const [doneNames, setDoneNames] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function loadData() {
            try {
                const profile = await getUserProfile();
                const logs = await getWorkoutLogs();

                if (profile && profile.workoutPlans?.[0]) {
                    const plan = profile.workoutPlans[0];
                    setPlanName(plan.planName);

                    const start = new Date(plan.startDate);
                    const now = new Date();
                    const diffMs = now.getTime() - start.getTime();
                    const totalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

                    const weekIndex = Math.floor(totalDays / 7);
                    const dayInWeekIndex = totalDays % 7;
                    setActiveDayIndex(dayInWeekIndex);

                    let todayPlan = null;
                    if (weekIndex === 0) {
                        const schedule = (plan.weeklyPlan as any[]) || [];
                        todayPlan = schedule[dayInWeekIndex];
                    } else if (weekIndex > 0) {
                        const monthly = (plan.monthlyPlan as any[]) || [];
                        const currentWeek = monthly[weekIndex - 1]; // monthlyPlan is Weeks 2, 3, 4
                        if (currentWeek && currentWeek.days) {
                            todayPlan = currentWeek.days[dayInWeekIndex];
                        }
                    }

                    if (todayPlan) {
                        setDailyExercises(todayPlan.exercises || []);
                        setDailyFocus(todayPlan.focus || null);
                    }
                }

                // Process stats from logs safely
                const completedLogs = (logs || []).filter((l: any) => l.completed);
                setTasksDone(completedLogs.length);
                setCalories(completedLogs.length * 35);
                setSteps(2000 + completedLogs.length * 800);

                // Set of exercises completed today specifically
                const todayStr = new Date().toISOString().slice(0, 10);
                const todayDone = new Set<string>(
                    (logs || [])
                        .filter((l: any) => l.date && new Date(l.date).toISOString().slice(0, 10) === todayStr)
                        .flatMap((l: any) => (l.exercises as any[] || []).map((e: any) => e.name as string))
                );
                setDoneNames(todayDone);

                // Calculate streak
                const daysWithActivity = new Set(
                    (logs || []).map((l: any) => l.date ? new Date(l.date).toISOString().slice(0, 10) : "")
                );
                daysWithActivity.delete("");

                let streakCount = 0;
                const today = new Date();
                for (let i = 0; i < 30; i++) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const key = d.toISOString().slice(0, 10);
                    if (daysWithActivity.has(key)) {
                        streakCount++;
                    } else if (i === 0) {
                        continue;
                    } else {
                        break;
                    }
                }
                setStreak(streakCount);

            } catch (error) {
                console.error("CRITICAL: Dashboard Data Load Failed", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const nextTask = dailyExercises.find((ex) => !doneNames.has(ex.name)) || dailyExercises[0];
    const nextTaskIndex = dailyExercises.findIndex((ex) => !doneNames.has(ex.name));

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Routine...</p>
            </div>
        );
    }


    return (
        <div className="p-4 space-y-5 pb-24">

            {/* Header */}
            <header className="space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary px-1">Active Routine</p>
                <div className="flex justify-between items-end">
                    <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-foreground dark:text-white px-1">
                        {planName || "Welcome Back"}
                    </h1>
                </div>
            </header>

            {/* Top Navigation Activity Day Rings */}
            <div className="flex justify-between px-2 pt-1 pb-1">
                {days.map((d, index) => {
                    const isActive = index === activeDayIndex;
                    const isPast = index < activeDayIndex;
                    return (
                        <div key={index} className="flex flex-col items-center gap-1.5 grayscale-0 transition-all">
                            <span className="text-[10px] font-bold text-muted uppercase leading-none">{d}</span>
                            <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center transition-all ${isActive ? 'border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] bg-primary/10' : isPast ? 'border-primary/50 opacity-80' : 'border-card-border opacity-40'}`}>
                                {isPast ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : isActive && (
                                    <motion.div layoutId="activeDayRing" className="w-2.5 h-2.5 bg-primary rounded-full shadow-md" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Up Next Core Component */}
            {nextTask ? (
                <section className="space-y-1.5 px-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted">Up Next</p>
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="p-5 rounded-[1.8rem] bg-card border border-card-border shadow-xl shadow-primary/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/15 blur-2xl rounded-full -mr-10 -mt-10" />

                        <div className="relative z-10 space-y-3">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary">
                                    {dailyFocus || "Today's Task"}
                                </p>
                                <h2 className="text-xl font-black uppercase leading-tight line-clamp-1">
                                    {nextTask.name}
                                </h2>
                                <p className="text-[10px] text-muted font-bold">
                                    {nextTask.sets || 3} sets · {nextTask.reps}
                                </p>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <Link
                                    href={`/dashboard/exercise/${Math.max(0, nextTaskIndex)}`}
                                    className="flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    Start
                                </Link>
                                <Link
                                    href="/dashboard/workout"
                                    className="px-4 py-1.5 flex items-center justify-center gap-1 rounded-xl border border-card-border text-[10px] font-black uppercase tracking-widest hover:bg-black/5 active:scale-95"
                                >
                                    View All
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </section>
            ) : (
                <div className="p-5 px-1">
                    <div className="p-5 rounded-[1.5rem] bg-card border border-dashed border-card-border text-center space-y-1">
                        <CheckCircle2 className="w-6 h-6 text-primary mx-auto opacity-80" />
                        <p className="font-black uppercase text-xs">All done today!</p>
                    </div>
                </div>
            )}

            {/* Stats Overview */}
            <section className="space-y-2 px-1 pt-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Your Overview</p>
                <div className="grid grid-cols-2 gap-4">
                    <StatTile
                        icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
                        label="Tasks Crushed" value={tasksDone.toString()} unit="TOTAL"
                    />
                    <StatTile
                        icon={<Flame className="w-5 h-5 text-accent" />}
                        label="Calories" value={calories.toString()} unit="KCAL EST."
                    />
                    <StatTile
                        icon={<Footprints className="w-5 h-5 text-secondary" />}
                        label="Steps" value={steps.toLocaleString()} unit="EST."
                    />
                    <StatTile
                        icon={<TrendingUp className="w-5 h-5 text-foreground dark:text-white" />}
                        label="Streak" value={streak.toString()} unit="DAYS"
                    />
                </div>
            </section>
        </div>
    );
}

function StatTile({ icon, label, value, unit }: any) {
    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="p-5 rounded-3xl bg-card border border-card-border space-y-3"
        >
            <div className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                {icon}
            </div>
            <div className="space-y-0.5">
                <p className="text-[8px] font-black text-muted uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black tracking-tight leading-none">
                    {value} <span className="text-[9px] text-muted font-black">{unit}</span>
                </p>
            </div>
        </motion.div>
    );
}
