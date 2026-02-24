"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Utensils, Plus, ChefHat } from "lucide-react";

export default function MealsPage() {
    const [mealLogs, setMealLogs] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [recommendation, setRecommendation] = useState<any>(null);
    const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("mealLogs");
        if (stored) {
            setMealLogs(JSON.parse(stored));
        }
        fetchRecommendation();
    }, []);

    const fetchRecommendation = async () => {
        setIsLoadingRecommendation(true);
        try {
            const plan = JSON.parse(localStorage.getItem("currentWorkoutPlan") || "{}");
            const res = await fetch("/api/recommend-meal", {
                method: "POST",
                body: JSON.stringify({
                    goal: plan.goal || "Fitness",
                    mode: plan.mode || "intermediate",
                    recentMeals: JSON.parse(localStorage.getItem("mealLogs") || "[]").slice(-3),
                    recentWorkouts: JSON.parse(localStorage.getItem("workoutLogs") || "[]").slice(-1),
                })
            });
            const data = await res.json();
            if (data && !data.error) setRecommendation(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingRecommendation(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(",")[1];
                const res = await fetch("/api/analyze-meal", {
                    method: "POST",
                    body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
                });
                const analysis = await res.json();
                if (analysis && !analysis.error) {
                    const updatedLogs = [...mealLogs, analysis];
                    setMealLogs(updatedLogs);
                    localStorage.setItem("mealLogs", JSON.stringify(updatedLogs));
                    fetchRecommendation(); // Refresh recommendation after logging
                }
            };
            reader.readAsDataURL(file);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-6 space-y-8 pb-32">
            <header className="space-y-2 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Daily Fuel</p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">Fuel Intel</h1>
            </header>

            {/* Main Action Card */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-10 rounded-[2.5rem] bg-card border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all group"
            >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors shadow-2xl">
                    {isAnalyzing ? (
                        <div className="w-10 h-10 rounded-full border-4 border-black/20 border-t-black animate-spin" />
                    ) : (
                        <Camera className="w-10 h-10" />
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-lg font-black uppercase tracking-widest">AI Scanner</p>
                    <p className="text-xs text-muted font-bold">Snap your food to analyze</p>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </motion.div>

            {/* Recommendation Engine */}
            <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2 px-2">
                    <ChefHat className="w-4 h-4" />
                    AI Suggestion: Next Meal
                </h3>

                <AnimatePresence mode="wait">
                    {isLoadingRecommendation ? (
                        <div className="h-40 flex items-center justify-center bg-card rounded-3xl animate-pulse border border-card-border">
                            <Utensils className="w-6 h-6 text-muted animate-bounce" />
                        </div>
                    ) : recommendation && recommendation.sampleMealPlan?.[0] ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-3xl bg-secondary/10 border border-secondary/20 space-y-4 relative overflow-hidden group"
                        >
                            <div className="absolute -top-4 -right-4 opacity-10 blur-2xl w-32 h-32 bg-secondary rounded-full" />
                            <div className="relative z-10 space-y-2">
                                <p className="text-[10px] font-black uppercase text-secondary">Optimal Performance Fuel</p>
                                <h4 className="text-xl font-black uppercase">{recommendation.sampleMealPlan[0].meal}</h4>
                                <p className="text-[10px] text-muted font-medium leading-relaxed">
                                    {recommendation.tips?.[0] || 'Perfect balance for your current recovery phase.'}
                                </p>
                            </div>
                            <button className="relative z-10 px-4 py-2 rounded-xl bg-secondary text-black text-[10px] font-black uppercase tracking-widest">
                                Track Meal
                            </button>
                        </motion.div>
                    ) : (
                        <div className="p-6 rounded-3xl bg-card border border-dashed border-white/10 text-center">
                            <p className="text-[10px] text-muted font-black uppercase">Syncing recovery data...</p>
                        </div>
                    )}
                </AnimatePresence>
            </section>

            {/* Recent Meal Logs */}
            {mealLogs.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted px-2">Historical Data</h3>
                    <div className="space-y-3">
                        {mealLogs.slice(-5).reverse().map((meal, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-card border border-card-border flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase">{meal.mealName || 'Meal'}</p>
                                    <p className="text-[10px] text-muted font-bold italic tracking-tighter">
                                        {meal.macros?.protein_g}g P · {meal.macros?.carbs_g}g C · {meal.macros?.fats_g}g F
                                    </p>
                                </div>
                                <p className="text-sm font-black italic">{meal.calories} kcal</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
