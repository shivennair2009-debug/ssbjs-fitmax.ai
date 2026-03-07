"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Landing } from "@/components/onboarding/Landing";
import { GoalInput } from "@/components/onboarding/GoalInput";
import { ModeSelection } from "@/components/onboarding/ModeSelection";
import { PlanPreview } from "@/components/onboarding/PlanPreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, LogIn, Sparkles } from "lucide-react";
import { getUserProfile } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
    const [step, setStep] = useState<"landing" | "goal" | "mode" | "preview">("landing");
    const [goal, setGoal] = useState("");
    const [userDetails, setUserDetails] = useState<{ age: number; height: number; weight: number } | null>(null);
    const [mode, setMode] = useState("");
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);
    const [hasActivePlan, setHasActivePlan] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    setStatus("authenticated");
                    const profile = await getUserProfile();
                    if (profile && profile.workoutPlans && (profile.workoutPlans as any[]).length > 0) {
                        setHasActivePlan(true);
                    }
                    setIsCheckingProfile(false);
                } else {
                    setStatus("unauthenticated");
                    setIsCheckingProfile(false);
                }
            } catch (e) {
                console.error("Profile check failed", e);
                setStatus("unauthenticated");
                setIsCheckingProfile(false);
            }
        };

        checkAuth();
    }, []);

    const nextStep = () => {
        if (step === "landing") setStep("goal");
        else if (step === "goal") setStep("mode");
        else if (step === "mode") setStep("preview");
    };

    const prevStep = () => {
        if (step === "goal") setStep("landing");
        else if (step === "mode") setStep("goal");
        else if (step === "preview") setStep("mode");
    };

    if (status === "loading" || isCheckingProfile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted">Syncing Neural Identity...</p>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1),transparent_70%)]" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm p-10 rounded-[2.5rem] bg-card border border-card-border shadow-2xl relative z-10 space-y-8 text-center"
                >
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="w-8 h-8 text-black" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black uppercase tracking-tight">FitMax AI</h1>
                            <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em]">Neural Fitness Intelligence</p>
                        </div>
                    </div>

                    <p className="text-sm font-bold text-muted leading-relaxed">
                        To synchronize your fitness data across devices, please sign in with your account.
                    </p>

                    <button
                        onClick={() => router.push("/login")}
                        className="w-full py-5 rounded-2xl bg-primary text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <LogIn className="w-5 h-5" />
                        Sign In / Register
                    </button>

                    <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-50">
                        Secure OAuth Authentication Active
                    </p>
                </motion.div>

                <div className="mt-8 text-center z-10">
                    <ThemeToggle />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col items-center justify-center relative p-6 overflow-hidden min-h-screen bg-background">
            {/* Onboarding Back Button */}
            {step !== "landing" && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={prevStep}
                    className="fixed top-8 left-8 p-3 rounded-full bg-black/ dark:bg-white/ border border-black/ dark:border-white/ hover:bg-black/ dark:bg-white/ transition-colors z-[60]"
                >
                    <ArrowLeft className="w-6 h-6" />
                </motion.button>
            )}

            <div className="fixed top-8 right-8 z-[60]">
                <ThemeToggle />
            </div>

            <AnimatePresence mode="wait">
                {step === "landing" && (
                    <Landing key="landing" onStart={nextStep} hasActivePlan={hasActivePlan} />
                )}
                {step === "goal" && (
                    <GoalInput
                        key="goal"
                        onNext={(goalText) => {
                            setGoal(goalText);
                            nextStep();
                        }}
                    />
                )}
                {step === "mode" && (
                    <ModeSelection
                        key="mode"
                        goal={goal}
                        onComplete={(m) => {
                            setMode(m);
                            nextStep();
                        }}
                    />
                )}
                {step === "preview" && (
                    <PlanPreview
                        key="preview"
                        goal={goal}
                        mode={mode}
                        onComplete={() => {
                            router.push("/dashboard/home");
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

