"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
    User,
    Flame,
    Footprints,
    TrendingUp,
    CheckCircle2,
    LogOut,
    RefreshCw,
    Trophy,
    Lock,
    Zap,
    Star,
    Target,
    Shield,
    Rocket,
    Key,
    Loader2,
    Save
} from "lucide-react";
import { getUserProfile, getWorkoutLogs, updateAccountDetails } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface Achievement {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    unlocked: boolean;
    color: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const [sessionStatus, setSessionStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
    const [username, setUsername] = useState("Athlete");
    const [fitnessMode, setFitnessMode] = useState("active");
    const [planName, setPlanName] = useState("Your Plan");

    // Settings State
    const [nameInput, setNameInput] = useState("");
    const [dobInput, setDobInput] = useState("");
    const [heightInput, setHeightInput] = useState("");
    const [weightInput, setWeightInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [tasksDone, setTasksDone] = useState(0);
    const [totalTasks, setTotalTasks] = useState(0);
    const [calories, setCalories] = useState(0);
    const [steps, setSteps] = useState(0);
    const [streak, setStreak] = useState(0);
    const [goalPercent, setGoalPercent] = useState(0);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setSessionStatus("authenticated");
                    setUsername(user.email?.split('@')[0] || "Athlete");
                } else {
                    setSessionStatus("unauthenticated");
                    router.push("/login");
                    return;
                }

                const profile = await getUserProfile();
                const logs = await getWorkoutLogs();

                if (profile) {
                    const mode = profile.fitnessMode || "active";
                    setFitnessMode(mode);
                    const p = profile as any;
                    setNameInput(p.name || user.email?.split('@')[0] || "");
                    if (p.dateOfBirth) {
                        setDobInput(new Date(p.dateOfBirth).toISOString().split('T')[0]);
                    }
                    if (p.height) setHeightInput(p.height.toString());
                    if (p.weight) setWeightInput(p.weight.toString());

                    let total = 0;
                    if (profile.workoutPlans?.[0]) {
                        const plan = profile.workoutPlans[0];
                        setPlanName(plan.planName || "Your Plan");
                        const allExercises = (plan.weeklyPlan as any[] || []).flatMap((d: any) => d.exercises || []);
                        total = allExercises.length;
                        setTotalTasks(total);
                    }

                    // Process logs
                    const completed = logs.filter((l: any) => l.completed);
                    const done = completed.length;
                    setTasksDone(done);
                    setCalories(done * 35);
                    const estimatedSteps = 2000 + done * 800;
                    setSteps(estimatedSteps);

                    // Goal completion %
                    if (total > 0) {
                        setGoalPercent(Math.min(100, Math.round((done / total) * 100)));
                    }

                    // Streak
                    const daysWithActivity = new Set(completed.map((l: any) => new Date(l.date).toISOString().slice(0, 10)));
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

                    // Achievements
                    setAchievements([
                        {
                            id: "first_rep",
                            label: "First Rep",
                            description: "Complete your first exercise",
                            icon: <Flame className="w-5 h-5" />,
                            unlocked: done >= 1,
                            color: "text-orange-400",
                        },
                        {
                            id: "consistent",
                            label: "Consistent",
                            description: "Achieve a 3-day streak",
                            icon: <Zap className="w-5 h-5" />,
                            unlocked: streakCount >= 3,
                            color: "text-yellow-400",
                        },
                        {
                            id: "week_warrior",
                            label: "Week Warrior",
                            description: "Achieve a 7-day streak",
                            icon: <Shield className="w-5 h-5" />,
                            unlocked: streakCount >= 7,
                            color: "text-blue-400",
                        },
                        {
                            id: "iron_will",
                            label: "Iron Will",
                            description: "Achieve a 30-day streak",
                            icon: <Trophy className="w-5 h-5" />,
                            unlocked: streakCount >= 30,
                            color: "text-amber-400",
                        },
                        {
                            id: "centurion",
                            label: "Centurion",
                            description: "Complete 100 exercises",
                            icon: <Star className="w-5 h-5" />,
                            unlocked: done >= 100,
                            color: "text-purple-400",
                        },
                        {
                            id: "goal_crusher",
                            label: "Goal Crusher",
                            description: "Reach 80% plan completion",
                            icon: <Target className="w-5 h-5" />,
                            unlocked: total > 0 && (done / total) >= 0.8,
                            color: "text-green-400",
                        },
                        {
                            id: "ten_k",
                            label: "10K Steps",
                            description: "Reach 10,000+ estimated steps",
                            icon: <Rocket className="w-5 h-5" />,
                            unlocked: estimatedSteps >= 10000,
                            color: "text-cyan-400",
                        },
                        {
                            id: "locked_in",
                            label: "Locked In",
                            description: "Choose the Locked-In mode",
                            icon: <Key className="w-5 h-5" />,
                            unlocked: mode === "locked-in",
                            color: "text-red-400",
                        },
                    ]);
                }
            } catch (error) {
                console.error("Failed to load profile data", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);


    const unlockedCount = achievements.filter((a) => a.unlocked).length;

    // SVG ring params
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const dashoffset = circumference - (goalPercent / 100) * circumference;

    const modeLabel: Record<string, string> = {
        "active": "Active",
        "intermediate": "Intermediate",
        "locked-in": "Locked In",
    };
    const modeColor: Record<string, string> = {
        "active": "bg-primary/20 text-primary",
        "intermediate": "bg-blue-500/20 text-blue-400",
        "locked-in": "bg-red-500/20 text-red-400",
    };

    return (
        <div className="p-5 space-y-6 pb-32">
            {/* Hero */}
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4 p-5 rounded-[2rem] bg-card border border-card-border relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/30">
                    <User className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1 relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Your Profile</p>
                    <h1 className="text-2xl font-black uppercase tracking-tight leading-none">{username}</h1>
                    <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${modeColor[fitnessMode] || modeColor.active}`}>
                        {modeLabel[fitnessMode] || "Active"} Mode
                    </span>
                </div>
            </motion.section>

            {/* Goal Completion Ring */}
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="p-6 rounded-[2rem] bg-card border border-card-border space-y-4"
            >
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Plan Progress</p>
                    <h2 className="text-lg font-black uppercase">{planName}</h2>
                </div>
                <div className="flex items-center gap-6">
                    {/* Animated Ring */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                            {/* Track */}
                            <circle
                                cx="60" cy="60" r={radius}
                                fill="none"
                                strokeWidth="10"
                                className="stroke-black/10 dark:stroke-white/10"
                            />
                            {/* Progress */}
                            <motion.circle
                                cx="60" cy="60" r={radius}
                                fill="none"
                                strokeWidth="10"
                                strokeLinecap="round"
                                stroke="currentColor"
                                className="text-primary"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: dashoffset }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black">{goalPercent}%</span>
                            <span className="text-[8px] font-black uppercase text-muted tracking-widest">Done</span>
                        </div>
                    </div>
                    {/* Breakdown */}
                    <div className="flex-1 space-y-3">
                        <ProgressRow label="Completed" value={tasksDone} max={Math.max(totalTasks, 1)} color="bg-primary" />
                        <ProgressRow label="Remaining" value={Math.max(0, totalTasks - tasksDone)} max={Math.max(totalTasks, 1)} color="bg-black/15 dark:bg-white/15" />
                        <div className="pt-1">
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted">{tasksDone} of {totalTasks} exercises</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Stats */}
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.14 }}
                className="space-y-3"
            >
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted px-1">All Time Stats</p>
                <div className="grid grid-cols-2 gap-3">
                    <StatCard icon={<CheckCircle2 className="w-4 h-4 text-primary" />} label="Tasks Done" value={tasksDone.toString()} unit="TOTAL" />
                    <StatCard icon={<Flame className="w-4 h-4 text-orange-400" />} label="Calories" value={calories.toString()} unit="KCAL EST." />
                    <StatCard icon={<Footprints className="w-4 h-4 text-blue-400" />} label="Steps" value={steps.toLocaleString()} unit="EST." />
                    <StatCard icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Streak" value={streak.toString()} unit="DAYS" />
                </div>
            </motion.section>

            {/* Achievements */}
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="space-y-3"
            >
                <div className="flex items-center justify-between px-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Achievements</p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">{unlockedCount}/{achievements.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {achievements.map((a, i) => (
                        <motion.div
                            key={a.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.22 + i * 0.05 }}
                            className={`p-4 rounded-2xl border transition-all ${a.unlocked
                                ? "bg-card border-card-border shadow-sm"
                                : "bg-black/3 dark:bg-white/3 border-card-border opacity-50 grayscale"
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.unlocked ? "bg-black/5 dark:bg-white/5" : "bg-black/5 dark:bg-white/5"}`}>
                                    {a.unlocked
                                        ? <span className={a.color}>{a.icon}</span>
                                        : <Lock className="w-4 h-4 text-muted" />
                                    }
                                </div>
                                {a.unlocked && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", delay: 0.3 + i * 0.05 }}
                                        className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                                    >
                                        <CheckCircle2 className="w-3 h-3 text-black" />
                                    </motion.div>
                                )}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">{a.label}</p>
                            <p className="text-[8px] text-muted font-bold mt-0.5 leading-tight">{a.description}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Account Settings */}
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.34 }}
                className="p-6 rounded-[2rem] bg-card border border-card-border space-y-6"
            >
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Account Settings</p>
                    <h2 className="text-xl font-black uppercase tracking-tight">Edit Profile</h2>
                </div>

                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSaving(true);
                        try {
                            await updateAccountDetails({
                                name: nameInput,
                                dateOfBirth: dobInput || undefined,
                                height: heightInput ? parseFloat(heightInput) : undefined,
                                weight: weightInput ? parseFloat(weightInput) : undefined,
                            });
                            setUsername(nameInput);
                        } catch (err) {
                            console.error("Failed to save profile", err);
                        } finally {
                            setIsSaving(false);
                        }
                    }}
                >
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Display Name</label>
                            <input
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Date of Birth</label>
                            <input
                                type="date"
                                value={dobInput}
                                onChange={(e) => setDobInput(e.target.value)}
                                className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    value={heightInput}
                                    onChange={(e) => setHeightInput(e.target.value)}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={weightInput}
                                    onChange={(e) => setWeightInput(e.target.value)}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-4 mt-2 rounded-xl bg-primary text-black font-black uppercase text-sm tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>

                    <div className="pt-4 border-t border-card-border mt-6">
                        <button
                            type="button"
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = "/login";
                            }}
                            className="w-full text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-foreground/5 rounded-xl transition-colors flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center">
                                <LogOut className="w-4 h-4" />
                            </div>
                            Session Logout
                        </button>
                    </div>
                </form>
            </motion.section>
        </div>
    );
}

function StatCard({ icon, label, value, unit }: any) {
    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="p-4 rounded-2xl bg-card border border-card-border space-y-2"
        >
            <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-[8px] font-black text-muted uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black tracking-tight leading-none">
                    {value} <span className="text-[8px] text-muted font-black">{unit}</span>
                </p>
            </div>
        </motion.div>
    );
}

function ProgressRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = Math.round((value / max) * 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted">{label}</p>
                <p className="text-[8px] font-black uppercase tracking-widest">{value}</p>
            </div>
            <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.4 }}
                />
            </div>
        </div>
    );
}
