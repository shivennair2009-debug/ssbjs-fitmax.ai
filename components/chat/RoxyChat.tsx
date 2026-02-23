"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export function RoxyChat({ onClose, onPlanUpdate }: { onClose: () => void; onPlanUpdate: (weeklyPlan: any) => void }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hey, I’m Roxy. Tell me how you’re feeling or what you want adjusted.",
        },
    ]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isSending) return;
        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsSending(true);

        const goal = localStorage.getItem("fitnessGoal") || "";
        const mode = (localStorage.getItem("fitnessMode") || "intermediate") as
            | "active"
            | "intermediate"
            | "locked-in";
        const currentPlan = JSON.parse(localStorage.getItem("currentWorkoutPlan") || "{}");
        const workoutLogs = JSON.parse(localStorage.getItem("workoutLogs") || "[]");
        const mealLogs = JSON.parse(localStorage.getItem("mealLogs") || "[]");

        try {
            const response = await fetch("/api/roxy-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    goal,
                    mode,
                    currentPlan,
                    workoutLogs,
                    mealLogs,
                    message: userMessage,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get Roxy response");
            }

            const data = await response.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.message || "Got it." }]);

            if (data.shouldRecalibrate && data.weeklyPlan) {
                const updatedPlan = {
                    ...currentPlan,
                    weeklyPlan: data.weeklyPlan,
                };
                localStorage.setItem("currentWorkoutPlan", JSON.stringify(updatedPlan));
                onPlanUpdate(data.weeklyPlan);
            }
        } catch {
            setMessages((prev) => [...prev, { role: "assistant", content: "I ran into a problem. Try again." }]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[140] bg-background/95 backdrop-blur-2xl flex flex-col"
        >
            <header className="p-8 pb-6 flex items-center justify-between border-b border-card-border">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-black text-black shadow-lg shadow-primary/20">
                        RX
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Neural Trainer</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Roxy</h2>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 active:scale-90 transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <motion.div
                        initial={{ opacity: 0, x: msg.role === "assistant" ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx}
                        className={cn(
                            "max-w-[85%] px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm",
                            msg.role === "assistant"
                                ? "bg-card border border-card-border text-foreground self-start rounded-tl-none"
                                : "bg-primary text-black font-medium ml-auto rounded-tr-none shadow-primary/10"
                        )}
                    >
                        {msg.content}
                    </motion.div>
                ))}
                <div ref={endRef} />
            </div>

            <div className="p-8 pt-4 pb-12 border-t border-card-border bg-card/50">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Adjust my protocol..."
                            className="w-full bg-background border border-card-border rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                    </div>
                    <button
                        onClick={sendMessage}
                        disabled={isSending || !input.trim()}
                        className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                            isSending || !input.trim()
                                ? "bg-white/5 text-white/20"
                                : "bg-primary text-black shadow-primary/20 active:scale-90"
                        )}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-[9px] text-center text-muted mt-4 font-bold uppercase tracking-widest opacity-40">
                    AI Recalibration Active
                </p>
            </div>
        </motion.div>
    );
}
