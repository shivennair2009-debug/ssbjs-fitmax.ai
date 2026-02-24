"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Pause,
    Play,
    SkipForward,
    CheckCircle2,
    ChevronLeft,
    Timer,
    Zap
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ExerciseActivePage() {
    const router = useRouter();
    const params = useParams();
    const index = parseInt(params.id as string) || 0;

    const [dailyExercises, setDailyExercises] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(index);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isRestMode, setIsRestMode] = useState(false);
    const [progress, setProgress] = useState(0);

    // Load data
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
            const exercises = schedule[todayIndex]?.exercises || [];
            setDailyExercises(exercises);

            if (exercises[currentIndex]) {
                setTimeLeft(exercises[currentIndex].durationSeconds || 45);
            }
        }
    }, [currentIndex]);

    const currentExercise = dailyExercises[currentIndex];
    const totalExercises = dailyExercises.length;
    const overallProgress = ((currentIndex) / totalExercises) * 100;

    const handleNext = useCallback(() => {
        if (currentIndex < totalExercises - 1) {
            setIsRestMode(true);
            setTimeLeft(15);
        } else {
            // Workout Complete: Log it!
            const logs = JSON.parse(localStorage.getItem("workoutLogs") || "[]");
            const newLog = {
                date: new Date().toISOString(),
                exercises: dailyExercises,
                completed: true,
                type: "session"
            };
            localStorage.setItem("workoutLogs", JSON.stringify([...logs, newLog]));
            router.push("/dashboard/home");
        }
    }, [currentIndex, totalExercises, router, dailyExercises]);

    const handleFinishRest = useCallback(() => {
        setIsRestMode(false);
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        if (dailyExercises[nextIdx]) {
            setTimeLeft(dailyExercises[nextIdx].durationSeconds || 45);
        }
    }, [currentIndex, dailyExercises]);

    // Timer Logic
    useEffect(() => {
        if (isPaused || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (isRestMode) {
                        handleFinishRest();
                    } else {
                        handleNext();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isPaused, isRestMode, handleNext, handleFinishRest]);

    if (!currentExercise && dailyExercises.length > 0) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-[200] flex flex-col transition-colors duration-700",
            isRestMode ? "bg-secondary/20" : "bg-background"
        )}>
            {/* Top Navigation & Progress */}
            <div className="p-6 pt-12 space-y-4">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-white/10">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                            {Array.from({ length: totalExercises }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-2 h-2 rounded-full border border-background",
                                        i < currentIndex ? "bg-primary" : i === currentIndex ? "bg-white animate-pulse" : "bg-white/10"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                    />
                </div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-between p-8 pb-16">
                {/* Exercise Identity */}
                <header className="text-center space-y-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isRestMode ? "rest" : currentExercise?.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-1"
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                                {isRestMode ? "Recovery Protocol" : `Tactical Exercise ${currentIndex + 1}`}
                            </p>
                            <h1 className="text-4xl font-black uppercase tracking-tight text-white leading-tight px-4">
                                {isRestMode ? "REST & BREATHE" : currentExercise?.name}
                            </h1>
                        </motion.div>
                    </AnimatePresence>
                </header>

                {/* Central Visual & Timer Area */}
                <div className="relative w-full aspect-square flex items-center justify-center max-w-[320px]">
                    {/* Visual Diagram Placeholder */}
                    <AnimatePresence mode="wait">
                        {!isRestMode ? (
                            <motion.div
                                key="visual"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute inset-0 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center p-8 overflow-hidden"
                            >
                                <div className="absolute inset-0 opacity-10 blur-3xl bg-primary/20 pointer-events-none" />
                                <div className="w-full h-full relative border border-primary/20 rounded-2xl flex items-center justify-center">
                                    <Zap className="w-16 h-16 text-primary/40 animate-pulse" />
                                    <p className="absolute bottom-4 text-[8px] font-black text-white/20 uppercase tracking-widest">Postural Reference Active</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="rest-visual"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="w-48 h-48 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Circular Timer Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-white/5"
                            />
                            <motion.circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray="100 100"
                                initial={{ strokeDashoffset: 100 }}
                                animate={{
                                    strokeDashoffset: 100 - (timeLeft / (isRestMode ? 15 : (currentExercise?.durationSeconds || 45))) * 100
                                }}
                                className={cn(isRestMode ? "text-secondary" : "text-primary", "transition-colors duration-500")}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center pointer-events-auto">
                            <span className="text-7xl font-black italic tracking-tighter drop-shadow-2xl">
                                {timeLeft}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Seconds Left</span>
                        </div>
                    </div>
                </div>

                {/* Form Cues / Instructions */}
                <div className="w-full max-w-[280px] text-center space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isRestMode ? "rest-cues" : currentExercise?.name}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest italic">
                                {isRestMode ? "Refuel metabolic levels" : (currentExercise?.notes || "Maintain peak form")}
                            </p>
                            {!isRestMode && currentExercise?.steps && (
                                <div className="flex flex-wrap justify-center gap-2">
                                    {currentExercise.steps.slice(0, 2).map((step: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-white/60">
                                            {step}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Interactive Controls */}
                <div className="flex items-center gap-6">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsPaused(!isPaused)}
                        className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
                    >
                        {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            if (isRestMode) handleFinishRest();
                            else handleNext();
                        }}
                        className="w-24 h-24 rounded-[2rem] bg-primary text-black flex items-center justify-center shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
                    >
                        <CheckCircle2 className="w-10 h-10" />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNext}
                        className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
                    >
                        <SkipForward className="w-6 h-6" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
