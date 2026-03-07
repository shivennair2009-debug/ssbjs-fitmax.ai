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
import { getUserProfile, logWorkout, saveWorkoutPlan } from "@/lib/actions";

export default function ExerciseActivePage() {
    const router = useRouter();
    const params = useParams();
    const { searchParams } = new URL(typeof window !== 'undefined' ? window.location.href : '');
    const startAt = parseInt(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('startAt') || '0');
    const index = parseInt(params.id as string) || 0;

    const [dailyExercises, setDailyExercises] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(startAt);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isRestMode, setIsRestMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activePlan, setActivePlan] = useState<any>(null);

    // UI Phase State
    const [phase, setPhase] = useState<"detail" | "active">("detail");

    // Adaptation State
    const [isAdapting, setIsAdapting] = useState(false);
    const [adaptReason, setAdaptReason] = useState("");
    const [isGeneratingAdaptation, setIsGeneratingAdaptation] = useState(false);

    // Load data from DB
    useEffect(() => {
        async function loadData() {
            try {
                const profile = await getUserProfile();
                if (profile && profile.workoutPlans?.[0]) {
                    const plan = profile.workoutPlans[0];
                    setActivePlan(plan);

                    const schedule = (plan.weeklyPlan as any[]) || [];
                    const start = new Date(plan.startDate);
                    const now = new Date();
                    const diffMs = now.getTime() - start.getTime();
                    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
                    const todayIndex = diffDays % schedule.length;

                    const exercises = schedule[todayIndex]?.exercises || [];
                    setDailyExercises(exercises);

                    if (exercises[currentIndex]) {
                        setTimeLeft(exercises[currentIndex].durationSeconds || 45);
                    }
                }
            } catch (error) {
                console.error("Failed to load exercise data", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [currentIndex, getUserProfile]);

    const currentExercise = dailyExercises[currentIndex];
    const totalExercises = dailyExercises.length;
    const overallProgress = ((currentIndex) / totalExercises) * 100;

    const handleAdapt = async () => {
        if (!adaptReason.trim() || !activePlan) return;
        setIsGeneratingAdaptation(true);
        try {
            const fitnessMode = activePlan.fitnessMode || "active";
            const response = await fetch("/api/adapt-workout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentExercise: currentExercise.name,
                    feedback: adaptReason,
                    mode: fitnessMode
                }),
            });

            const data = await response.json();
            if (data.shouldModify) {
                const newExercise = {
                    ...currentExercise,
                    name: "Alternative: " + data.suggestion,
                    notes: data.reason,
                };
                const newExercises = [...dailyExercises];
                newExercises[currentIndex] = newExercise;

                // Update Plan in DB
                const updatedWeeklyPlan = [...(activePlan.weeklyPlan as any[])];
                const start = new Date(activePlan.startDate);
                const now = new Date();
                const diffDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                const todayIndex = diffDays % updatedWeeklyPlan.length;

                updatedWeeklyPlan[todayIndex].exercises = newExercises;

                await saveWorkoutPlan({
                    ...activePlan,
                    weeklyPlan: updatedWeeklyPlan
                });

                setDailyExercises(newExercises);
                setIsAdapting(false);
                setAdaptReason("");
            }
        } catch (e) {
            console.error("Adaptation failed", e);
        } finally {
            setIsGeneratingAdaptation(false);
        }
    };

    const handleNext = useCallback(async () => {
        if (currentIndex < totalExercises - 1) {
            setIsRestMode(true);
            setTimeLeft(15);
            setPhase("active");
        } else {
            // Workout Complete: Log it!
            await logWorkout({
                exercises: dailyExercises,
                durationMins: 30, // Default for now
                calories: dailyExercises.length * 35
            });
            router.push("/dashboard/home");
        }
    }, [currentIndex, totalExercises, router, dailyExercises, logWorkout]);

    const handleSkip = useCallback(async () => {
        setIsRestMode(false);
        if (currentIndex < totalExercises - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setPhase("detail");
            if (dailyExercises[nextIdx]) {
                setTimeLeft(dailyExercises[nextIdx].durationSeconds || 45);
            }
        } else {
            await logWorkout({
                exercises: dailyExercises,
                durationMins: 30,
                calories: dailyExercises.length * 35
            });
            router.push("/dashboard/home");
        }
    }, [currentIndex, totalExercises, router, dailyExercises, logWorkout]);

    const handleFinishRest = useCallback(() => {
        setIsRestMode(false);
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setPhase("detail");
        if (dailyExercises[nextIdx]) {
            setTimeLeft(dailyExercises[nextIdx].durationSeconds || 45);
        }
    }, [currentIndex, dailyExercises]);

    // Timer Logic
    useEffect(() => {
        if (phase !== "active" || isPaused || timeLeft <= 0) return;

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
    }, [timeLeft, isPaused, phase, isRestMode, handleNext, handleFinishRest]);

    if (!currentExercise && dailyExercises.length > 0) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-[200] flex flex-col h-[100dvh] overflow-y-auto transition-colors duration-700",
            isRestMode ? "bg-secondary/20" : "bg-background"
        )}>
            {/* Top Navigation & Progress */}
            <div className="p-6 pt-12 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <button onClick={() => { phase === 'active' && !isRestMode ? setPhase('detail') : router.back() }} className="p-2 -ml-2 rounded-full hover:bg-black/ dark:bg-white/ transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                            {Array.from({ length: totalExercises }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-2 h-2 rounded-full border border-background",
                                        i < currentIndex ? "bg-primary" : i === currentIndex ? "bg-white animate-pulse" : "bg-black/ dark:bg-white/"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-1.5 w-full bg-black/ dark:bg-white/ rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                    />
                </div>
            </div>

            {phase === "detail" ? (
                /* DETAIL PHASE: PRE-START EXERCISE INSTRUCTIONS & ADAPTATION */
                <div className="flex-grow p-6 flex flex-col pb-16">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex-grow">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Exercise {currentIndex + 1} of {totalExercises}</p>
                            <h1 className="text-3xl font-black uppercase mt-1 leading-tight">{currentExercise?.name}</h1>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-2xl bg-card border border-card-border text-center space-y-1">
                                <p className="text-[9px] font-black uppercase text-muted tracking-widest">Sets</p>
                                <p className="text-2xl font-black">{currentExercise?.sets || 3}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-card border border-card-border text-center space-y-1">
                                <p className="text-[9px] font-black uppercase text-muted tracking-widest">Reps</p>
                                <p className="text-2xl font-black text-primary">{currentExercise?.reps || '10'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-card border border-card-border text-center space-y-1">
                                <p className="text-[9px] font-black uppercase text-muted tracking-widest">Time</p>
                                <p className="text-2xl font-black">{currentExercise?.durationSeconds || 45}s</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-[2rem] bg-card border border-card-border space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Instructions</h3>
                            <p className="text-sm font-bold text-muted leading-relaxed">{currentExercise?.notes}</p>

                            {currentExercise?.steps && (
                                <ul className="space-y-3 pt-2">
                                    {currentExercise.steps.map((step: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm font-bold">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[10px] text-muted">{i + 1}</span>
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {isAdapting ? (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 space-y-3">
                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">What&apos;s the issue?</p>
                                <textarea
                                    className="w-full bg-background border border-card-border rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-amber-500 resize-none"
                                    placeholder="e.g. My knee hurts, or I don't have a barbell..."
                                    rows={2}
                                    value={adaptReason}
                                    onChange={(e) => setAdaptReason(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setIsAdapting(false)} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black/5 dark:bg-white/5 disabled:opacity-50" disabled={isGeneratingAdaptation}>Cancel</button>
                                    <button onClick={handleAdapt} disabled={!adaptReason.trim() || isGeneratingAdaptation} className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black shadow-lg shadow-amber-500/20 disabled:opacity-50">
                                        {isGeneratingAdaptation ? "Asking AI..." : "Get Alternative"}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <button onClick={() => setIsAdapting(true)} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground/ dark:hover:text-white/ transition-colors flex items-center justify-center gap-2">
                                <Zap className="w-3.5 h-3.5" /> Need to modify this?
                            </button>
                        )}
                    </motion.div>

                    <div className="mt-auto pt-6">
                        <button
                            onClick={() => setPhase("active")}
                            className="w-full py-5 rounded-[2rem] bg-primary text-black text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            <Play className="w-5 h-5 fill-current" /> Begin Exercise
                        </button>
                    </div>
                </div>
            ) : (
                /* ACTIVE PHASE: TIMER RECORDING AND CUES */
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
                                <h1 className="text-4xl font-black uppercase tracking-tight text-foreground dark:text-white leading-tight px-4">
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
                                    className="absolute inset-0 rounded-[3rem] bg-black/ dark:bg-white/ border border-black/ dark:border-white/ flex flex-col items-center justify-center p-8 overflow-hidden"
                                >
                                    <div className="absolute inset-0 opacity-10 blur-3xl bg-primary/20 pointer-events-none" />
                                    <div className="w-full h-full relative border border-primary/20 rounded-2xl flex items-center justify-center">
                                        <Zap className="w-16 h-16 text-primary/40 animate-pulse" />
                                        <p className="absolute bottom-4 text-[8px] font-black text-foreground/ dark:text-white/ uppercase tracking-widest">Postural Reference Active</p>
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
                                    className="text-foreground/ dark:text-white/"
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
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Interactive Controls */}
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsPaused(!isPaused)}
                            className="w-16 h-16 rounded-full bg-black/ dark:bg-white/ border border-black/ dark:border-white/ flex items-center justify-center hover:bg-black/ dark:bg-white/"
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
                            onClick={handleSkip}
                            className="w-16 h-16 rounded-full bg-black/ dark:bg-white/ border border-black/ dark:border-white/ flex items-center justify-center hover:bg-black/ dark:bg-white/"
                        >
                            <SkipForward className="w-6 h-6" />
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
}
