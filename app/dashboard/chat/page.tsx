"use client";

import { RoxyChat } from "@/components/chat/RoxyChat";
import { useRouter } from "next/navigation";
import { getUserProfile, getWorkoutLogs, saveWorkoutPlan } from "@/lib/actions";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
    const router = useRouter();
    const [initialData, setInitialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const profile = await getUserProfile();
                const logs = await getWorkoutLogs();

                if (profile) {
                    setInitialData({
                        goal: profile.fitnessGoal || "General Fitness",
                        mode: profile.fitnessMode || "active",
                        currentPlan: profile.workoutPlans?.[0] || {},
                        workoutLogs: logs || [],
                        mealLogs: [], // Placeholder for now
                    });
                }
            } catch (error) {
                console.error("Failed to load chat context", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [getUserProfile, getWorkoutLogs]);

    const handlePlanUpdate = async (weeklyPlan: any) => {
        if (!initialData?.currentPlan?.id) return;
        try {
            await saveWorkoutPlan({
                ...initialData.currentPlan,
                weeklyPlan
            });
            router.push("/dashboard/home");
        } catch (error) {
            console.error("Failed to save plan from chat", error);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Opening Secure Channel...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 pt-16 z-[100] bg-background">
            <RoxyChat
                onClose={() => router.push("/dashboard/home")}
                onPlanUpdate={handlePlanUpdate}
                initialData={initialData}
            />
        </div>
    );
}
