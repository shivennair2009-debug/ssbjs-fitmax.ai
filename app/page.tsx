"use client";

import { useState } from "react";
import { Landing } from "@/components/onboarding/Landing";
import { GoalInput } from "@/components/onboarding/GoalInput";
import { ModeSelection } from "@/components/onboarding/ModeSelection";
import { PlanPreview } from "@/components/onboarding/PlanPreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatePresence } from "framer-motion";

export default function Home() {
    const [step, setStep] = useState<"landing" | "goal" | "mode" | "preview">("landing");
    const [goal, setGoal] = useState("");
    const [mode, setMode] = useState("");

    const nextStep = () => {
        if (step === "landing") setStep("goal");
        else if (step === "goal") setStep("mode");
        else if (step === "mode") setStep("preview");
    };

    return (
        <div className="flex-grow flex flex-col items-center justify-center relative p-6 overflow-hidden">
            <ThemeToggle />
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
                            window.location.href = "/dashboard";
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
