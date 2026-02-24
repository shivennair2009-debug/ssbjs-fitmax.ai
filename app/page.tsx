"use client";

import { useState } from "react";
import { Landing } from "@/components/onboarding/Landing";
import { GoalInput } from "@/components/onboarding/GoalInput";
import { ModeSelection } from "@/components/onboarding/ModeSelection";
import { PlanPreview } from "@/components/onboarding/PlanPreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function Home() {
    const [step, setStep] = useState<"landing" | "goal" | "mode" | "preview">("landing");
    const [goal, setGoal] = useState("");
    const [mode, setMode] = useState("");

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

    return (
        <div className="flex-grow flex flex-col items-center justify-center relative p-6 overflow-hidden">
            <ThemeToggle />

            {/* Onboarding Back Button */}
            {step !== "landing" && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={prevStep}
                    className="fixed top-8 left-8 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors z-[60]"
                >
                    <ArrowLeft className="w-6 h-6" />
                </motion.button>
            )}

            <AnimatePresence mode="wait">
                {step === "landing" && (
                    <Landing key="landing" onStart={nextStep} />
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
                            window.location.href = "/dashboard/home";
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
