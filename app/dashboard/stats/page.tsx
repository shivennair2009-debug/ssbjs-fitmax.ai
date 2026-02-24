"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Zap, Activity, Flame } from "lucide-react";

export default function StatsPage() {
    const [stats, setStats] = useState({
        output: 0,
        adherence: 0,
        streak: 0,
        readiness: 7.5,
        graphData: [20, 30, 25, 40, 35, 50, 45]
    });

    useEffect(() => {
        const logs = JSON.parse(localStorage.getItem("workoutLogs") || "[]");
        const meals = JSON.parse(localStorage.getItem("mealLogs") || "[]");

        const completedWorkouts = logs.filter((l: any) => l.completed).length;
        const daysTracked = logs.length + meals.length;
        const adherence = daysTracked > 0 ? Math.min(100, Math.round((completedWorkouts / Math.max(1, logs.length)) * 100)) : 0;
        const streak = completedWorkouts > 0 ? completedWorkouts : 0;

        setStats(prev => ({
            ...prev,
            output: completedWorkouts * 10,
            adherence,
            streak
        }));
    }, []);

    return (
        <div className="p-6 space-y-8 pb-12">
            <header className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Progress</p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">Performance</h1>
            </header>

            {/* Main Graph Card */}
            <div className="p-8 rounded-[2.5rem] bg-card border border-card-border relative overflow-hidden">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Weekly Output</p>
                        <h2 className="text-4xl font-black">{stats.output > 0 ? `+${stats.output}%` : 'Stable'}</h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <LineChart className="w-6 h-6 text-primary" />
                    </div>
                </div>

                <div className="h-40 flex items-end gap-3">
                    {stats.graphData.map((h, i) => (
                        <div key={i} className="flex-grow bg-white/5 rounded-t-xl relative overflow-hidden">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className={`absolute bottom-0 left-0 right-0 ${i === 6 ? 'bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]' : 'bg-white/10'}`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <StatTile icon={<Zap className="w-4 h-4 text-primary" />} label="Readiness" value={stats.readiness.toString()} unit="SIGNAL" />
                <StatTile icon={<Activity className="w-4 h-4 text-secondary" />} label="Adherence" value={stats.adherence.toString()} unit="%" />
                <StatTile icon={<Flame className="w-4 h-4 text-accent" />} label="Avg Effort" value="Elite" unit="" />
                <StatTile icon={<LineChart className="w-4 h-4 text-white" />} label="Streak" value={stats.streak.toString()} unit="DAYS" />
            </div>
        </div>
    );
}

function StatTile({ icon, label, value, unit }: any) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-5 rounded-3xl bg-card border border-card-border space-y-2"
        >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">{icon}</div>
            <div className="space-y-0.5">
                <p className="text-[8px] font-black text-muted uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black uppercase tracking-tight">
                    {value} <span className="text-[10px] text-muted italic">{unit}</span>
                </p>
            </div>
        </motion.div>
    );
}
