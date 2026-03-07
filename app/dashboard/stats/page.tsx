"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Flame, Footprints, TrendingUp, Loader2 } from "lucide-react";
import { getWorkoutLogs } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function StatsPage() {
    const [tasksDone, setTasksDone] = useState(0);
    const [calories, setCalories] = useState(0);
    const [steps, setSteps] = useState(0);
    const [graphData, setGraphData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
    const [streak, setStreak] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const logs = await getWorkoutLogs();
                const completed = logs.filter((l: any) => l.completed !== false); // Assuming completed by default or check field

                setTasksDone(completed.length);
                setCalories(completed.length * 35);
                setSteps(2000 + completed.length * 800);

                // Calculate streak
                const daysWithActivity = new Set(
                    completed.map((l: any) => new Date(l.date).toISOString().slice(0, 10))
                );

                let streakCount = 0;
                const today = new Date();
                for (let i = 0; i < 30; i++) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const key = d.toISOString().slice(0, 10);
                    if (daysWithActivity.has(key)) {
                        streakCount++;
                    } else if (i === 0) {
                        // If nothing today, check yesterday to continue streak
                        continue;
                    } else {
                        break;
                    }
                }
                setStreak(streakCount);

                // Build 7-day graph
                const last7: number[] = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const key = d.toISOString().slice(0, 10);
                    const count = completed.filter((l: any) => new Date(l.date).toISOString().slice(0, 10) === key).length;
                    last7.push(count);
                }
                const maxVal = Math.max(...last7, 1);
                setGraphData(last7.map((v) => Math.round((v / maxVal) * 100)));
            } catch (error) {
                console.error("Failed to load stats", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const dayLabels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
    });

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Processing biometric data...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 pb-32">
            <header className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Your Progress</p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground dark:text-white">Stats</h1>
            </header>

            {/* 7-Day Activity Graph */}
            <div className="p-6 rounded-[2.5rem] bg-card border border-card-border space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">7-Day Activity</p>
                        <h2 className="text-2xl font-black">
                            {tasksDone > 0 ? `${tasksDone} Tasks` : "No data yet"}
                        </h2>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                </div>

                <div className="h-36 flex items-end gap-2">
                    {graphData.map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-black/5 dark:bg-white/5 rounded-t-xl relative overflow-hidden" style={{ height: "120px" }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(h, 4)}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.08 }}
                                    className={`absolute bottom-0 left-0 right-0 rounded-t-xl ${i === 6 ? "bg-primary shadow-[0_0_16px_rgba(var(--primary-rgb),0.4)]" : "bg-black/20 dark:bg-white/20"}`}
                                />
                            </div>
                            <p className="text-[8px] font-black uppercase text-muted">{dayLabels[i]}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Tiles */}
            <div className="grid grid-cols-2 gap-4">
                <StatTile
                    icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
                    label="Tasks Crushed"
                    value={tasksDone.toString()}
                    unit="TOTAL"
                    color="primary"
                />
                <StatTile
                    icon={<Flame className="w-5 h-5 text-accent" />}
                    label="Calories Burnt"
                    value={calories.toString()}
                    unit="KCAL EST."
                    color="accent"
                />
                <StatTile
                    icon={<Footprints className="w-5 h-5 text-secondary" />}
                    label="Steps Done"
                    value={steps.toLocaleString()}
                    unit="EST."
                    color="secondary"
                />
                <StatTile
                    icon={<TrendingUp className="w-5 h-5 text-foreground dark:text-white" />}
                    label="Current Streak"
                    value={streak.toString()}
                    unit="DAYS"
                    color="foreground"
                />
            </div>

            <p className="text-[9px] text-center text-muted font-bold uppercase tracking-widest opacity-50">
                Calories and steps are estimates based on logged activity
            </p>
        </div>
    );
}

function StatTile({ icon, label, value, unit, color }: any) {
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
