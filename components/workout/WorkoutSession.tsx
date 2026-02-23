"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Play,
    Pause,
    RotateCcw,
    ChevronRight,
    Volume2,
    AlertCircle,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Exercise {
    id: string;
    name: string;
    reps: string;
    instruction: string;
    image: string;
    steps?: string[];
}

// Default exercises if no plan is loaded
const DEFAULT_EXERCISES: Exercise[] = [
    {
        id: "1",
        name: "Dynamic Arm Swings",
        reps: "12 Reps",
        instruction: "Keep your movements smooth.",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
        steps: ["Stand tall with feet apart", "Swing arms forward and back", "Keep breathing naturally"]
    },
    {
        id: "2",
        name: "Shoulder Squeezes",
        reps: "15 Reps",
        instruction: "Focus on your back muscles.",
        image: "https://images.unsplash.com/photo-1583454110551-21f2fa2adfcd?auto=format&fit=crop&q=80&w=400",
        steps: ["Sit or stand straight", "Pull shoulder blades together", "Hold for a second and release"]
    },
    {
        id: "3",
        name: "Floor Stretches",
        reps: "20 Reps",
        instruction: "Keep your back flat on the floor.",
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400",
        steps: ["Lie on your back", "Reach one arm up", "Switch sides slowly"]
    },
];

export function WorkoutSession({ onExit, initialExercises, initialExerciseIndex = 0 }: { onExit: () => void; initialExercises?: Exercise[]; initialExerciseIndex?: number }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
    const [isActive, setIsActive] = useState(false);
    const [showVoiceIndicator, setShowVoiceIndicator] = useState(false);
    const [coachingCue, setCoachingCue] = useState<string | null>(null);
    const [isLoadingCue, setIsLoadingCue] = useState(false);
    const [exercises, setExercises] = useState<Exercise[]>(initialExercises?.length ? initialExercises : DEFAULT_EXERCISES);
    const [fitnessMode, setFitnessMode] = useState<"active" | "intermediate" | "locked-in">("intermediate");
    const [perceivedEffort, setPerceivedEffort] = useState(3);

    const currentExercise = exercises[currentIdx];
    useEffect(() => {
        if (initialExercises && initialExercises.length > 0) {
            setExercises(initialExercises);
            setCurrentIdx(Math.min(initialExerciseIndex, initialExercises.length - 1));
        }
    }, [initialExercises, initialExerciseIndex]);

    // Load plan from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedPlan = localStorage.getItem("currentWorkoutPlan");
            const savedMode = localStorage.getItem("fitnessMode");

            if (savedMode) {
                setFitnessMode(savedMode as any);
            }

            if (savedPlan) {
                try {
                    const plan = JSON.parse(savedPlan);
                    // Extract exercises from the plan
                    if (plan.phases && plan.phases[0] && plan.phases[0].exercises) {
                        const loadedExercises: Exercise[] = plan.phases[0].exercises.map((ex: any, idx: number) => ({
                            id: String(idx + 1),
                            name: ex.name || "Exercise",
                            reps: ex.reps || "10 Reps",
                            instruction: ex.notes || ex.name,
                            steps: ex.steps || [],
                            image: `https://images.unsplash.com/photo-${1571019613454 + idx}?auto=format&fit=crop&q=80&w=400`,
                        }));
                        if (loadedExercises.length > 0) {
                            setExercises(loadedExercises);
                        }
                    }
                } catch (e) {
                    console.log("Could not parse saved plan");
                }
            }
        }
    }, []);

    // Generate coaching cue every 20 seconds
    useEffect(() => {
        const generateCue = async () => {
            if (!isActive) return;

            try {
                setIsLoadingCue(true);
                const response = await fetch("/api/generate-coaching", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        exerciseName: currentExercise.name,
                        currentReps: Math.floor(Math.random() * 15) + 1,
                        userFeedback: "Performing well",
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setCoachingCue(data.coachingCue);
                    setShowVoiceIndicator(true);
                    setTimeout(() => setShowVoiceIndicator(false), 4000);
                }
            } catch (error) {
                console.error("Error generating coaching cue:", error);
            } finally {
                setIsLoadingCue(false);
            }
        };

        const interval = setInterval(generateCue, 20000);
        if (isActive) {
            generateCue(); // Generate immediately on start
        }
        return () => clearInterval(interval);
    }, [isActive, currentExercise, currentIdx]);

    // Timer countdown
    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const logExercise = (completed: boolean) => {
        if (typeof window === "undefined") return;
        const logEntry = {
            date: new Date().toISOString().slice(0, 10),
            exerciseName: currentExercise.name,
            reps: currentExercise.reps,
            completed,
            perceivedEffort,
        };
        try {
            const existing = JSON.parse(localStorage.getItem("workoutLogs") || "[]");
            existing.push(logEntry);
            localStorage.setItem("workoutLogs", JSON.stringify(existing));
        } catch {
            localStorage.setItem("workoutLogs", JSON.stringify([logEntry]));
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col p-6 md:p-12 overflow-hidden">
            {/* Voice Coach Overlay */}
            <AnimatePresence>
                {showVoiceIndicator && coachingCue && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-black font-black uppercase tracking-widest text-sm z-[60] shadow-2xl shadow-primary/40 max-w-md text-center"
                    >
                        <Volume2 className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-2">{coachingCue}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter italic">Step 1: <span className="text-primary">Getting Ready</span></h2>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Exercise {currentIdx + 1} of {exercises.length}</p>
                    </div>
                </div>
                <button
                    onClick={onExit}
                    className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 items-center overflow-y-auto pb-12">
                {/* Visual Reference */}
                <div className="relative aspect-video lg:aspect-square rounded-[3rem] overflow-hidden border-2 border-white/5 bg-white/5">
                    <img
                        src={currentExercise.image}
                        alt={currentExercise.name}
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">AI Coach Helper</span>
                            <h3 className="text-2xl md:text-3xl font-black uppercase leading-tight">{currentExercise.name}</h3>
                        </div>
                        <div className="bg-black/80 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 text-center min-w-[100px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Do this</p>
                            <p className="text-xl font-black italic">{currentExercise.reps}</p>
                        </div>
                    </div>
                </div>

                {/* Controls and Feedback */}
                <div className="space-y-8 flex flex-col justify-center h-full">
                    <div className="space-y-6">
                        <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">How to do it:</span>
                            </div>
                            <div className="space-y-3">
                                {currentExercise.steps && currentExercise.steps.length > 0 ? (
                                    currentExercise.steps.map((step, sIdx) => (
                                        <div key={sIdx} className="flex gap-3 items-start">
                                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                                                {sIdx + 1}
                                            </span>
                                            <p className="text-sm text-white/80 leading-snug">{step}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-white/80 leading-snug">{currentExercise.instruction}</p>
                                )}
                            </div>
                        </div>

                        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 flex flex-col items-center gap-8">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Protocol Clock</p>
                                <p className="text-6xl md:text-8xl font-black tracking-tighter tabular-nums">{formatTime(timeLeft)}</p>
                            </div>

                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setTimeLeft(15 * 60)}
                                    className="p-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
                                >
                                    <RotateCcw className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => setIsActive(!isActive)}
                                    className={cn(
                                        "w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95",
                                        isActive ? "bg-white text-black" : "bg-primary text-black shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] glow-primary"
                                    )}
                                >
                                    {isActive ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1.5" />}
                                </button>
                                <button
                                    onClick={() => setCurrentIdx((prev) => Math.min(prev + 1, exercises.length - 1))}
                                    className="p-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="w-full space-y-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">
                                        Perceived Effort
                                    </p>
                                    <div className="flex items-center justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setPerceivedEffort(level)}
                                                className={cn(
                                                    "w-10 h-10 rounded-full text-sm font-black border transition-all duration-300",
                                                    perceivedEffort === level
                                                        ? "bg-primary text-black border-primary scale-110 shadow-lg shadow-primary/20"
                                                        : "border-white/10 text-white/60 hover:border-white/30"
                                                )}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => {
                                            logExercise(true);
                                            if (currentIdx === exercises.length - 1) {
                                                onExit();
                                            } else {
                                                setCurrentIdx((prev) => prev + 1);
                                            }
                                        }}
                                        className="py-5 rounded-2xl bg-primary text-black font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-[0.98] transition-all"
                                    >
                                        {currentIdx === exercises.length - 1 ? "Finish Protocol" : "Complete & Next"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            logExercise(false);
                                            if (currentIdx === exercises.length - 1) {
                                                onExit();
                                            } else {
                                                setCurrentIdx((prev) => prev + 1);
                                            }
                                        }}
                                        className="py-3 rounded-2xl border border-white/10 text-white/40 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 active:scale-[0.98] transition-all"
                                    >
                                        Skip Exercise
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Current Strain</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black">4.2</span>
                                <Activity className="w-4 h-4 text-accent animate-pulse" />
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Estimated Burn</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black">128</span>
                                <span className="text-xs font-bold text-white/30">KCAL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

