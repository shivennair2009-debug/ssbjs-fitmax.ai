"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Dna, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanPreviewProps {
    goal: string;
    mode: string;
    onComplete: () => void;
}

const LOADING_STEPS = [
    { min: 0, label: "Analyzing goals" },
    { min: 20, label: "Mapping 7-day split" },
    { min: 40, label: "Generating daily exercises" },
    { min: 60, label: "Structuring monthly plan" },
    { min: 80, label: "Finalizing plan" },
    { min: 100, label: "Plan ready" }
];

export function PlanPreview({ goal, mode, onComplete }: PlanPreviewProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [workoutPlan, setWorkoutPlan] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingLabel, setLoadingLabel] = useState(LOADING_STEPS[0].label);

    useEffect(() => {
        const generatePlan = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch("/api/generate-plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        goal,
                        mode,
                        userContext: {
                            daysPerWeek: 7,
                        },
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to generate workout plan");
                }

                const plan = await response.json();
                setWorkoutPlan(plan);
            } catch (err) {
                console.error("Error generating plan:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to generate plan"
                );
            } finally {
                setIsLoading(false);
            }
        };

        generatePlan();
    }, [goal, mode]);

    useEffect(() => {
        if (!isLoading) {
            setLoadingProgress(100);
            setLoadingLabel(LOADING_STEPS[LOADING_STEPS.length - 1].label);
            return;
        }

        setLoadingProgress(8);
        const interval = setInterval(() => {
            setLoadingProgress((prev) => Math.min(prev + Math.floor(Math.random() * 5) + 2, 98));
        }, 800);

        return () => clearInterval(interval);
    }, [isLoading]);

    useEffect(() => {
        const nextLabel = [...LOADING_STEPS].reverse().find((step) => loadingProgress >= step.min)?.label || LOADING_STEPS[0].label;
        setLoadingLabel((prev) => (prev === nextLabel ? prev : nextLabel));
    }, [loadingProgress]);

    const next = () => {
        if (currentSlide < 2) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete();
        }
    };

    if (error) {
        return (
            <div className="flex flex-col h-full bg-background items-center justify-center p-8">
                <div className="text-center space-y-6 max-w-md">
                    <AlertCircle className="w-16 h-16 text-accent mx-auto" />
                    <h2 className="text-2xl font-black uppercase">Generation Error</h2>
                    <p className="text-foreground/80">{error}</p>
                    <p className="text-xs text-muted">
                        Make sure you have set up the GEMINI_API_KEY in your .env.local file.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-primary text-black font-black rounded-lg mt-4"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-background items-center justify-center p-8 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />

                <motion.div className="text-center space-y-12 relative z-10">
                    <div className="relative w-32 h-32 mx-auto">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-b-2 border-primary"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 rounded-full border-t-2 border-secondary/50"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <Dna className="w-10 h-10 text-primary" />
                        </motion.div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black uppercase tracking-tight">Synthesizing</h2>
                            <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">{loadingLabel}</p>
                        </div>

                        <div className="w-48 h-1 bg-foreground/10 rounded-full mx-auto overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: `${loadingProgress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <p className="text-muted text-[10px] font-black">{loadingProgress}% COMPLETE</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Helper to get slide content dynamically based on currentSlide and workoutPlan
    const getSlideContent = () => {
        if (!workoutPlan) return null;

        if (currentSlide === 0) {
            // Slide 1: Program Name and Overview
            return (
                <div className="flex flex-col items-center">
                    <div className="p-8 rounded-[2.5rem] border bg-foreground/5 mb-8 text-primary border-primary/20">
                        <Dna className="w-12 h-12" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.4em] mb-2 text-primary border-primary/20">
                        Analysis Complete
                    </p>
                    <h2 className="text-4xl font-black uppercase tracking-tight leading-none mb-6">
                        {workoutPlan.planName || "Your Program"}
                    </h2>
                    <p className="text-foreground/80 text-sm leading-relaxed max-w-sm mx-auto">
                        {workoutPlan.overview || "Your personalized strategy is ready."}
                    </p>
                </div>
            );
        }

        if (currentSlide === 1) {
            // Slide 2: Today's Tasks
            const todayTasks = workoutPlan.weeklyPlan?.[0]?.exercises || [];
            return (
                <div className="flex flex-col items-center w-full max-h-[60vh] overflow-hidden">
                    <p className="text-xs font-black uppercase tracking-[0.4em] mb-2 text-secondary">
                        {workoutPlan.planName}
                    </p>
                    <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-6">
                        Today&apos;s Tasks
                    </h2>

                    <div className="w-full overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {todayTasks.map((task: any, idx: number) => (
                            <div key={idx} className="bg-foreground/5 border border-foreground/10 p-4 rounded-2xl flex flex-col items-start text-left shrink-0">
                                <h4 className="font-bold text-lg leading-tight mb-1">{task.name}</h4>
                                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted mb-2">
                                    <span>{task.sets} Sets</span>
                                    <span>•</span>
                                    <span>{task.reps}</span>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    {task.notes}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (currentSlide === 2) {
            // Slide 3: Monthly Overview
            const phases = workoutPlan.phases || [];
            return (
                <div className="flex flex-col items-center w-full max-h-[60vh] overflow-hidden">
                    <p className="text-xs font-black uppercase tracking-[0.4em] mb-2 text-accent">
                        {workoutPlan.planName}
                    </p>
                    <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-6">
                        Monthly Path
                    </h2>

                    <div className="w-full overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {phases.map((phase: any, idx: number) => (
                            <div key={idx} className="bg-foreground/5 border border-foreground/10 p-5 rounded-2xl flex flex-col items-start text-left shrink-0 border-l-4 border-l-accent">
                                <span className="text-xs font-black uppercase tracking-widest text-accent mb-1">
                                    {phase.duration}
                                </span>
                                <h4 className="font-black text-xl mb-2">{phase.name}</h4>
                                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                                    {phase.focus}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            <div className="p-8 pb-0 flex justify-between items-center z-10">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 rounded-full transition-all duration-500",
                                i === currentSlide ? "w-8 bg-foreground" : "w-4 bg-foreground/20"
                            )}
                        />
                    ))}
                </div>
                <button onClick={onComplete} className="text-[10px] uppercase font-bold text-foreground/50 tracking-[0.2em] hover:text-foreground">Skip</button>
            </div>

            <div className="flex-grow flex flex-col p-8 overflow-hidden z-10 w-full">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex-grow flex flex-col justify-center"
                    >
                        {getSlideContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-8 pt-0 z-10 w-full">
                <button
                    onClick={next}
                    className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all group bg-foreground text-background"
                >
                    {currentSlide === 2 ? "Start Training" : "Continue"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}
