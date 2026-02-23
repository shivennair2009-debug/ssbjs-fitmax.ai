"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Dna,
    Brain,
    LineChart,
    ArrowRight,
    ShieldCheck,
    Zap,
    Activity,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanPreviewProps {
    goal: string;
    mode: string;
    onComplete: () => void;
}

const SLIDES = [
    {
        id: "baseline",
        title: "Biological Baseline",
        subtitle: "AI Analysis Complete",
        description: "Your system has cross-referenced your current goals with biometric standards. We have established your starting metabolic and muscular markers.",
        icon: <Dna className="w-12 h-12" />,
        color: "primary",
        stat: "Level 1.4",
        statLabel: "Adherence Readiness"
    },
    {
        id: "protocol",
        title: "Strategic Protocol",
        subtitle: "Tactical Execution Plan",
        description: "Focusing on progressive overload and specific metabolic stressors identified as optimal for your specific trajectory.",
        icon: <ShieldCheck className="w-12 h-12" />,
        color: "secondary",
        stat: "15%",
        statLabel: "Expected Delta (Weekly)"
    },
    {
        id: "loop",
        title: "Recalibration Loop",
        subtitle: "Real-Time Adaptation",
        description: "Every missed session or data point is processed. The system will shift load dynamically to ensure you never plateau.",
        icon: <Brain className="w-12 h-12" />,
        color: "accent",
        stat: "24/7",
        statLabel: "Neural Monitoring"
    }
];
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
                            daysPerWeek: 4,
                        },
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to generate workout plan");
                }

                const plan = await response.json();
                setWorkoutPlan(plan);

                // Store plan in localStorage for later use
                if (typeof window !== "undefined") {
                    localStorage.setItem("currentWorkoutPlan", JSON.stringify(plan));
                    localStorage.setItem("fitnessGoal", goal);
                    localStorage.setItem("fitnessMode", mode);
                    if (!localStorage.getItem("planStartDate")) {
                        localStorage.setItem("planStartDate", new Date().toISOString());
                    }
                }
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
            setLoadingProgress((prev) => Math.min(prev + Math.floor(Math.random() * 7) + 4, 95));
        }, 900);

        return () => clearInterval(interval);
    }, [isLoading]);

    useEffect(() => {
        const nextLabel = [...LOADING_STEPS].reverse().find((step) => loadingProgress >= step.min)?.label || LOADING_STEPS[0].label;
        setLoadingLabel((prev) => (prev === nextLabel ? prev : nextLabel));
    }, [loadingProgress]);

    const next = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete();
        }
    };

    const slide = SLIDES[currentSlide];

    const colorMap: any = {
        primary: "text-primary border-primary/20",
        secondary: "text-secondary border-secondary/20",
        accent: "text-accent border-accent/20",
    };

    const bgMap: any = {
        primary: "bg-primary",
        secondary: "bg-secondary",
        accent: "bg-accent",
    };

    if (error) {
        return (
            <div className="flex flex-col h-full bg-black items-center justify-center p-8">
                <div className="text-center space-y-6 max-w-md">
                    <AlertCircle className="w-16 h-16 text-accent mx-auto" />
                    <h2 className="text-2xl font-black uppercase">Generation Error</h2>
                    <p className="text-white/60">{error}</p>
                    <p className="text-xs text-white/40">
                        Make sure you have set up the GEMINI_API_KEY in your .env.local file.
                        Get your API key from: https://aistudio.google.com/app/apikey
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
            <div className="flex flex-col h-full bg-black items-center justify-center p-8">
                <motion.div className="text-center space-y-8">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent mx-auto"
                    />
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black uppercase">Analyzing Your Goals</h2>
                        <p className="text-white/60">{loadingLabel}</p>
                        <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">{loadingProgress}%</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black">
            <div className="p-8 pb-0 flex justify-between items-center">
                <div className="flex gap-1.5">
                    {SLIDES.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 rounded-full bg-white/10 transition-all duration-500",
                                i === currentSlide ? "w-8 bg-white" : "w-4"
                            )}
                        />
                    ))}
                </div>
                <button onClick={onComplete} className="text-[10px] uppercase font-bold text-white/40 tracking-widest hover:text-white">Skip</button>
            </div>

            <div className="flex-grow flex items-center justify-center p-8">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
                            />
                            <p className="text-white/60">Generating your personalized plan...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1, y: -10 }}
                            className="w-full text-center space-y-12"
                        >
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "p-8 rounded-[2.5rem] border bg-white/5 mb-8",
                                        colorMap[slide.color]
                                    )}
                                >
                                    {slide.icon}
                                </div>
                                <p
                                    className={cn(
                                        "text-xs font-black uppercase tracking-[0.4em] mb-2",
                                        colorMap[slide.color]
                                    )}
                                >
                                    {slide.subtitle}
                                </p>
                                <h2 className="text-4xl font-black uppercase tracking-tight leading-none mb-6">
                                    {slide.title}
                                </h2>
                                <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
                                    {slide.description}
                                </p>

                                {/* Display AI-generated plan info on first slide */}
                                {currentSlide === 0 && workoutPlan && (
                                    <div className="mt-8 space-y-3 text-left bg-white/5 p-6 rounded-2xl border border-white/10">
                                        <p className="text-xs font-bold uppercase text-primary">
                                            Generated Plan
                                        </p>
                                        <h3 className="text-lg font-black">
                                            {workoutPlan.planName || "Personalized Program"}
                                        </h3>
                                        <p className="text-white/60 text-sm">
                                            Duration: {workoutPlan.duration}
                                        </p>
                                        <p className="text-white/60 text-sm line-clamp-2">
                                            {workoutPlan.overview}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center">
                                    <span className="text-4xl font-black italic">
                                        {slide.stat}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                        {slide.statLabel}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-8 pt-0">
                <button
                    onClick={next}
                    className={cn(
                        "w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all group",
                        bgMap[slide.color],
                        "text-black"
                    )}
                >
                    {currentSlide === SLIDES.length - 1 ? "Initialize Protocol" : "Proceed Analysis"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}



