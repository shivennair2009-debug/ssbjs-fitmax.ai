"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar as CalendarIcon,
    ChevronRight,
    Activity as ActivityIcon,
    Target as TargetIcon,
    Zap as ZapIcon,
    Clock as ClockIcon,
    Utensils as UtensilsIcon,
    Plus,
    Camera,
    ChevronRight as ChevronRightIcon,
    CheckCircle2,
    Clock,
    Flame,
    LineChart,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkoutSession } from "@/components/workout/WorkoutSession";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoxyChat } from "@/components/chat/RoxyChat";

type Tab = "dashboard" | "planning" | "diet" | "performance";
type SessionExercise = {
    id: string;
    name: string;
    reps: string;
    instruction: string;
    image: string;
};

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [dailyExercises, setDailyExercises] = useState<any[]>([]);
    const [dailyFocus, setDailyFocus] = useState<string | null>(null);
    const [selectedExercises, setSelectedExercises] = useState<SessionExercise[] | null>(null);
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
    const [showWeekPreview, setShowWeekPreview] = useState(false);
    const [weekPreviewDays, setWeekPreviewDays] = useState<any[]>([]);
    const [mealLogs, setMealLogs] = useState<any[]>([]);
    const [isAnalyzingMeal, setIsAnalyzingMeal] = useState(false);
    const [showRoxy, setShowRoxy] = useState(false);
    const mealInputRef = useRef<HTMLInputElement>(null);

    const triggerToast = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const buildFullSchedule = (plan: any) => {
        const weekly = Array.isArray(plan?.weeklyPlan) ? plan.weeklyPlan : [];
        const monthlyWeeks = Array.isArray(plan?.monthlyPlan) ? plan.monthlyPlan : [];
        const monthlyDays = monthlyWeeks.flatMap((week: any) =>
            Array.isArray(week?.days) ? week.days : []
        );
        const combined = [...weekly, ...monthlyDays];
        if (combined.length < 31 && weekly.length > 0) {
            let idx = 0;
            while (combined.length < 31) {
                combined.push(weekly[idx % weekly.length]);
                idx += 1;
            }
        }
        return combined;
    };

    const computeDateIndex = (startDateISO: string | null) => {
        if (!startDateISO) return 0;
        const start = new Date(startDateISO);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    };

    const applyPlanToDailyView = (plan: any) => {
        let schedule = buildFullSchedule(plan);
        if (schedule.length === 0 && plan?.phases?.[0]?.exercises) {
            schedule = Array.from({ length: 7 }, (_, idx) => ({
                day: DAY_LABELS[idx % 7],
                focus: "Primary Session",
                exercises: plan.phases[0].exercises,
            }));
        }
        const startDate = localStorage.getItem("planStartDate");
        const todayIndex = computeDateIndex(startDate);
        const todayPlan = schedule[todayIndex];

        if (todayPlan) {
            setDailyExercises(todayPlan.exercises || []);
            setDailyFocus(todayPlan.focus || null);
        }

        const next7 = schedule.slice(todayIndex, todayIndex + 7);
        setWeekPreviewDays(next7);
    };

    const applyWeeklyPlan = (weeklyPlan: any) => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem("currentWorkoutPlan");
        if (!stored) return;
        const plan = JSON.parse(stored);
        const updated = { ...plan, weeklyPlan };
        localStorage.setItem("currentWorkoutPlan", JSON.stringify(updated));
        applyPlanToDailyView(updated);
    };

    const loadMealLogs = () => {
        try {
            const storedMeals = JSON.parse(localStorage.getItem("mealLogs") || "[]");
            setMealLogs(storedMeals);
        } catch {
            setMealLogs([]);
        }
    };

    const handleMealInputChange = async (event: any) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsAnalyzingMeal(true);

        const reader = new FileReader();
        reader.onload = async () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            try {
                const response = await fetch("/api/analyze-meal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
                });

                if (!response.ok) {
                    throw new Error("Failed to analyze meal");
                }

                const data = await response.json();
                const logEntry = {
                    date: new Date().toISOString(),
                    ...data,
                };
                const updatedLogs = [...mealLogs, logEntry];
                setMealLogs(updatedLogs);
                localStorage.setItem("mealLogs", JSON.stringify(updatedLogs));
            } catch (error) {
                console.error("Meal analysis failed", error);
            } finally {
                setIsAnalyzingMeal(false);
            }
        };

        reader.readAsDataURL(file);
    };
    const buildSessionExercises = (exercises: any[]): SessionExercise[] =>
        exercises.map((exercise, idx) => ({
            id: String(idx + 1),
            name: exercise.name || "Exercise",
            reps: exercise.reps || "10 Reps",
            instruction: [
                exercise.notes,
                exercise.sets ? `${exercise.sets} sets` : "",
                exercise.rest ? `Rest ${exercise.rest}` : "",
            ]
                .filter(Boolean)
                .join(" · "),
            image: `https://images.unsplash.com/photo-${1571019613454 + idx}?auto=format&fit=crop&q=80&w=400`,
        }));

    const openWorkout = (index = 0, exercisesOverride?: any[]) => {
        const sourceExercises = exercisesOverride || dailyExercises;
        const mapped = buildSessionExercises(sourceExercises);
        if (mapped.length > 0) {
            setSelectedExercises(mapped);
            setSelectedExerciseIndex(index);
        } else {
            setSelectedExercises(null);
            setSelectedExerciseIndex(0);
        }
        setIsWorkoutActive(true);
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const storedPlan = localStorage.getItem("currentWorkoutPlan");
        if (!storedPlan) return;

        try {
            const plan = JSON.parse(storedPlan);
            applyPlanToDailyView(plan);
            loadMealLogs();

            const lastRecalibrated = localStorage.getItem("lastRecalibratedDate");
            const todayKey = new Date().toISOString().slice(0, 10);
            const workoutLogs = JSON.parse(localStorage.getItem("workoutLogs") || "[]");
            const mealLogData = JSON.parse(localStorage.getItem("mealLogs") || "[]");

            if (lastRecalibrated !== todayKey && workoutLogs.length > 0 && plan.weeklyPlan) {
                const goal = localStorage.getItem("fitnessGoal") || "";
                const mode = (localStorage.getItem("fitnessMode") || "intermediate") as
                    | "active"
                    | "intermediate"
                    | "locked-in";
                const recentWorkouts = workoutLogs.slice(-30);
                const recentMeals = mealLogData.slice(-30);

                fetch("/api/recalibrate-plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        goal,
                        mode,
                        currentWeeklyPlan: plan.weeklyPlan,
                        recentWorkouts,
                        recentMeals,
                    }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data?.weeklyPlan) {
                            applyWeeklyPlan(data.weeklyPlan);
                            localStorage.setItem("lastRecalibratedDate", todayKey);
                        }
                    })
                    .catch(() => null);
            }
        } catch (error) {
            console.error("Failed to parse stored plan", error);
        }
    }, []);

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            <ThemeToggle />
            <input
                ref={mealInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMealInputChange}
            />

            {/* Global Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-full shadow-2xl shadow-primary/40 flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        AI Logic Operational
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isWorkoutActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <WorkoutSession
                            onExit={() => {
                                setIsWorkoutActive(false);
                                setSelectedExercises(null);
                            }}
                            initialExercises={selectedExercises || undefined}
                            initialExerciseIndex={selectedExerciseIndex}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showRoxy && (
                    <RoxyChat
                        onClose={() => setShowRoxy(false)}
                        onPlanUpdate={(weeklyPlan) => applyWeeklyPlan(weeklyPlan)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showWeekPreview && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-sm p-8 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Outlook</p>
                                <h2 className="text-2xl font-black uppercase">Next 7 Days</h2>
                            </div>
                            <button
                                onClick={() => setShowWeekPreview(false)}
                                className="p-2 rounded-full hover:bg-white/10"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {weekPreviewDays.map((day: any, idx: number) => (
                                <div key={`${day.day}-${idx}`} className="p-4 rounded-2xl border border-white/10 bg-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                                                {day.day || `Day ${idx + 1}`}
                                            </p>
                                            <p className="text-sm font-black uppercase">{day.focus || "Session"}</p>
                                        </div>
                                        <button
                                            onClick={() => openWorkout(0, day.exercises || [])}
                                            className="px-3 py-2 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Open
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {(day.exercises || []).slice(0, 4).map((exercise: any, exIdx: number) => (
                                            <p key={`${exercise.name}-${exIdx}`} className="text-xs text-white/60">
                                                {exercise.name} · {exercise.reps}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar pb-32">
                <header className="p-8 pt-12 flex items-start justify-between">
                    <div className="flex-grow space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-black shadow-lg shadow-primary/20">FM</div>
                            <span className="font-black tracking-tighter text-xl uppercase">FitMax <span className="text-primary italic">AI</span></span>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === "dashboard" && (
                                <motion.div key="dash-hero" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                    <div className="space-y-4 mb-8">
                                        <h1 className="text-4xl font-black uppercase tracking-tight leading-none">Ready to <br /> <span className="text-primary tracking-widest">train!</span></h1>
                                        <p className="text-muted text-sm flex items-start gap-2 max-w-[200px]">
                                            <ZapIcon className="w-4 h-4 text-primary fill-current flex-shrink-0 mt-1" />
                                            I've updated your plan for today.
                                        </p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => openWorkout()}
                                        className="w-full py-5 bg-primary text-black font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-2 glow-primary"
                                    >
                                        Start Workout
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </motion.button>
                                </motion.div>
                            )}

                            {activeTab !== "dashboard" && (
                                <motion.div key="tab-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                    <h1 className="text-3xl font-black uppercase tracking-tight text-white">
                                        {activeTab === 'planning' ? 'My Plan' : activeTab === 'diet' ? 'My Food' : 'Progress'}
                                    </h1>
                                    <p className="text-muted text-xs font-bold uppercase tracking-widest">AI Assistant Ready</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <ThemeToggle />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowRoxy(true)}
                            className="relative w-12 h-12 rounded-2xl bg-card border border-card-border flex items-center justify-center group overflow-hidden shadow-xl shadow-primary/5"
                        >
                            <div className="absolute inset-0 bg-primary/5 animate-pulse group-hover:bg-primary/10" />
                            <ZapIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        </motion.button>
                    </div>
                </header>

                <div className="px-8 space-y-12">
                    {activeTab === "dashboard" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                <StatCard label="Steps" value="8,432" target="/ 12k" color="primary" progress={70} />
                                <StatCard label="Energy" value="1,840" target="/ 2.4k" color="secondary" progress={76} />
                                <StatCard label="Strain" value="6.4" target="/ 10" color="accent" progress={64} />
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4" />
                                        Today's Plan
                                    </h2>
                                    <button
                                        onClick={() => setShowWeekPreview(true)}
                                        className="p-2 rounded-full border border-white/10 hover:border-white/30"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {dailyExercises.length > 0 ? (
                                        <div className="space-y-3">
                                            {dailyFocus && (
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">
                                                    {dailyFocus}
                                                </p>
                                            )}
                                            {dailyExercises.map((exercise, idx) => (
                                                <BriefingItem
                                                    key={`${exercise.name}-${idx}`}
                                                    title={exercise.name}
                                                    desc={[
                                                        exercise.reps,
                                                        exercise.sets ? `${exercise.sets} sets` : "",
                                                        exercise.rest ? `Rest ${exercise.rest}` : "",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                    actionLabel="Open"
                                                    onClick={() => openWorkout(idx)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <BriefingItem title="Calibration" desc="Protocol shifted due to metabolic readings." />
                                            <BriefingItem title="Strategy" desc="High-leucine intake prioritized tonight." />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "planning" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="p-8 rounded-[2rem] bg-card border border-card-border space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Next 24 Hours</p>
                                    <h3 className="text-2xl font-black uppercase">Metabolic Stress Session</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted uppercase">Duration</p>
                                        <p className="font-black italic">22 MIN</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted uppercase">Intensity</p>
                                        <p className="font-black text-secondary uppercase italic">Elite</p>
                                    </div>
                                </div>
                                <button onClick={triggerToast} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10">Adjust Schedule</button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "diet" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div
                                onClick={() => mealInputRef.current?.click()}
                                className="p-12 rounded-[2.5rem] border-2 border-dashed border-card-border bg-card flex flex-col items-center justify-center gap-6 group cursor-pointer hover:border-primary/20 hover:bg-primary/5 transition-all"
                            >
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                                    <Camera className="w-10 h-10" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-black uppercase tracking-widest">AI Scanner</p>
                                    <p className="text-xs text-muted font-bold">
                                        {isAnalyzingMeal ? "Analyzing meal..." : "Log meals via photo"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <StatRow label="Protein" value="142g" target="/ 180g" color="primary" />
                                <StatRow label="Carbs" value="210g" target="/ 250g" color="secondary" />
                                <StatRow label="Fats" value="58g" target="/ 75g" color="accent" />
                            </div>

                            {mealLogs.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Recent Meals</p>
                                    {mealLogs.slice(-3).reverse().map((meal: any, idx: number) => (
                                        <div key={`${meal.mealName}-${idx}`} className="p-4 rounded-2xl bg-card border border-card-border">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-black uppercase">{meal.mealName || "Meal"}</p>
                                                <span className="text-xs text-muted font-bold">{meal.calories} kcal</span>
                                            </div>
                                            <p className="text-xs text-muted">
                                                P {meal.macros?.protein_g}g · C {meal.macros?.carbs_g}g · F {meal.macros?.fats_g}g
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "performance" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="p-8 rounded-[2.5rem] bg-card border border-card-border">
                                <div className="flex justify-between items-center mb-8">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Weekly Delta</p>
                                    <span className="text-primary font-black">+12.4%</span>
                                </div>
                                <div className="h-48 flex items-end gap-2">
                                    {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                        <div key={i} className="flex-grow bg-white/5 rounded-t-lg relative group">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                className={cn("absolute bottom-0 left-0 right-0 rounded-t-lg", i === 3 ? "bg-primary" : "bg-white/10")}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <StatCard label="Neural Readiness" value="Good" target="8.2 Signal" color="secondary" progress={82} />
                        </motion.div>
                    )}
                </div>
            </div>


            {/* Mobile Bottom Nav */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-background/80 backdrop-blur-xl border-t border-card-border z-50">
                <nav className="flex items-center justify-between max-w-[450px] mx-auto px-4">
                    <BottomNavItem
                        icon={<ActivityIcon className="w-5 h-5" />}
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                        label="Core"
                    />
                    <BottomNavItem
                        icon={<CalendarIcon className="w-5 h-5" />}
                        active={activeTab === 'planning'}
                        onClick={() => setActiveTab('planning')}
                        label="Plan"
                    />

                    {/* Centered Elevated Action Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            if (activeTab === "diet") {
                                mealInputRef.current?.click();
                            } else {
                                openWorkout();
                            }
                        }}
                        className="flex items-center justify-center -mt-12 bg-card text-foreground w-16 h-16 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.3)] border-4 border-background"
                    >
                        <Plus className="w-8 h-8 font-bold" />
                    </motion.button>

                    <BottomNavItem
                        icon={<UtensilsIcon className="w-5 h-5" />}
                        active={activeTab === 'diet'}
                        onClick={() => setActiveTab('diet')}
                        label="Fuel"
                    />
                    <BottomNavItem
                        icon={<TargetIcon className="w-5 h-5" />}
                        active={activeTab === 'performance'}
                        onClick={() => setActiveTab('performance')}
                        label="Stats"
                    />
                </nav>
            </footer>
        </div>
    );
}

function BottomNavItem({ icon, active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-300",
                active ? "text-primary" : "text-muted hover:text-foreground"
            )}
        >
            <div className={cn("transition-all duration-300", active ? "scale-110" : "scale-100 opacity-60")}>
                {icon}
            </div>
            <span className={cn("text-[8px] font-black uppercase tracking-widest transition-opacity duration-300", active ? "opacity-100" : "opacity-40")}>
                {label}
            </span>
        </button>
    );
}

function StatCard({ label, value, target, color, progress }: any) {
    const bgColors: any = {
        primary: "bg-primary",
        secondary: "bg-secondary",
        accent: "bg-accent",
        white: "bg-foreground",
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-3xl bg-card border border-card-border space-y-4 min-w-[160px] flex-shrink-0 relative overflow-hidden group shadow-lg shadow-black/20"
        >
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity blur-xl", bgColors[color])} />
            <p className="text-[10px] uppercase tracking-widest text-muted font-black relative z-10">{label}</p>
            <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-2xl font-black tracking-tight">{value}</span>
                <span className="text-[10px] text-muted font-black">{target}</span>
            </div>
            <div className="h-1 bg-muted/10 rounded-full overflow-hidden relative z-10">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full", bgColors[color])}
                />
            </div>
        </motion.div>
    );
}

function StatRow({ label, value, target, color }: any) {
    const bgColors: any = {
        primary: "bg-primary",
        secondary: "bg-secondary",
        accent: "bg-accent",
    };
    return (
        <motion.div
            whileHover={{ x: 5 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-card-border group"
        >
            <div className={cn("w-1.5 h-8 rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] transition-all group-hover:h-10", bgColors[color])} />
            <div className="flex-grow">
                <p className="text-[10px] font-black uppercase text-muted tracking-widest">{label}</p>
                <div className="flex justify-between items-baseline">
                    <span className="text-xl font-black">{value}</span>
                    <span className="text-[10px] font-bold text-muted">{target}</span>
                </div>
            </div>
        </motion.div>
    );
}

function BriefingItem({ title, desc, type, onClick, actionLabel }: any) {
    const Wrapper: any = onClick ? "button" : "div";

    return (
        <Wrapper
            onClick={onClick}
            type={onClick ? "button" : undefined}
            className={cn(
                "p-4 rounded-2xl border transition-all",
                type === "alert" ? "border-accent/20 bg-accent/5" : "border-card-border bg-card",
                onClick ? "w-full text-left hover:border-primary/30" : ""
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h4 className={cn("text-xs font-black uppercase tracking-wide mb-1", type === "alert" ? "text-accent" : "text-foreground")}>
                        {title}
                    </h4>
                    <p className="text-[11px] text-muted leading-relaxed font-medium">{desc}</p>
                </div>
                {onClick && (
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                        {actionLabel || "Open"}
                    </span>
                )}
            </div>
        </Wrapper>
    );
}



