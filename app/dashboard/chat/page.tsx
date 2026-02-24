"use client";

import { RoxyChat } from "@/components/chat/RoxyChat";
import { useRouter } from "next/navigation";

export default function ChatPage() {
    const router = useRouter();

    const handlePlanUpdate = (weeklyPlan: any) => {
        const stored = localStorage.getItem("currentWorkoutPlan");
        if (stored) {
            const plan = JSON.parse(stored);
            const updated = { ...plan, weeklyPlan };
            localStorage.setItem("currentWorkoutPlan", JSON.stringify(updated));
            router.push("/dashboard/home");
        }
    };

    return (
        <div className="fixed inset-0 pt-16 z-[100] bg-background">
            <RoxyChat
                onClose={() => router.push("/dashboard/home")}
                onPlanUpdate={handlePlanUpdate}
            />
        </div>
    );
}
