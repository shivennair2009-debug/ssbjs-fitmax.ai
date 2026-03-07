"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Utensils, Plus, ChefHat, Loader2 } from "lucide-react";
import { getMealLogs, logMeal, getUserProfile, getWorkoutLogs } from "@/lib/actions";

export default function MealsPage() {
    const [mealLogs, setMealLogs] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
    const [recommendation, setRecommendation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // AI Diet Planner State
    const [dietType, setDietType] = useState("Balanced");
    const [allergies, setAllergies] = useState("");
    const [fridgeIngredients, setFridgeIngredients] = useState("");
    const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
    const [generatedDiet, setGeneratedDiet] = useState<any>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [logs, profile] = await Promise.all([
                    getMealLogs(),
                    getUserProfile()
                ]);
                setMealLogs(logs || []);
                if (profile) {
                    await fetchRecommendation(profile);
                }
            } catch (error) {
                console.error("Failed to load meal data", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const fetchRecommendation = async (profile: any) => {
        setIsLoadingRecommendation(true);
        try {
            const workoutLogs = await getWorkoutLogs();
            const res = await fetch("/api/recommend-meal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    goal: profile.fitnessGoal || "Fitness",
                    mode: profile.fitnessMode || "active",
                    recentMeals: mealLogs.slice(-3),
                    recentWorkouts: workoutLogs.slice(-1),
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
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
                });
                const analysis = await res.json();
                if (analysis && !analysis.error) {
                    await logMeal({
                        mealName: analysis.mealName,
                        calories: analysis.calories,
                        macros: analysis.macros,
                        notes: analysis.notes
                    });

                    // Refresh logs
                    const updatedLogs = await getMealLogs();
                    setMealLogs(updatedLogs);

                    // Refresh recommendation
                    const profile = await getUserProfile();
                    if (profile) fetchRecommendation(profile);
                }
            };
            reader.readAsDataURL(file);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateDiet = async () => {
        setIsGeneratingDiet(true);
        try {
            const res = await fetch("/api/generate-diet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dietType,
                    allergies,
                    fridgeIngredients
                })
            });
            const data = await res.json();
            if (data && !data.error) {
                setGeneratedDiet(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingDiet(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Analyzing Nutrition Intake...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 pb-32">
            <header className="space-y-2 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Daily Fuel</p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground dark:text-white">Fuel Intel</h1>
            </header>

            {/* Main Action Card */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-10 rounded-[2.5rem] bg-card border-2 border-dashed border-card-border flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all group"
            >
                <div className="w-20 h-20 rounded-full bg-black/ dark:bg-white/ flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors shadow-2xl">
                    {isAnalyzing ? (
                        <Loader2 className="w-10 h-10 animate-spin" />
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

            {/* AI Diet Planner Engine */}
            <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2 px-2">
                    <ChefHat className="w-4 h-4" />
                    AI Diet Generator
                </h3>

                <div className="p-6 rounded-3xl bg-secondary/10 border border-secondary/20 space-y-4">
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-1">Diet Type</label>
                            <select
                                value={dietType}
                                onChange={(e) => setDietType(e.target.value)}
                                className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
                            >
                                <option value="Balanced">Balanced</option>
                                <option value="High Protein">High Protein</option>
                                <option value="Vegetarian">Vegetarian</option>
                                <option value="Vegan">Vegan</option>
                                <option value="Keto">Keto</option>
                                <option value="Paleo">Paleo</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-1">Allergies / Dislikes</label>
                            <input
                                value={allergies}
                                onChange={(e) => setAllergies(e.target.value)}
                                placeholder="e.g. Peanuts, Gluten, Dairy"
                                className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-1">Fridge Ingredients (Optional)</label>
                            <textarea
                                value={fridgeIngredients}
                                onChange={(e) => setFridgeIngredients(e.target.value)}
                                placeholder="What do you have? e.g. Chicken breast, rice, broccoli"
                                className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
                                rows={2}
                            />
                        </div>
                        <button
                            onClick={handleGenerateDiet}
                            disabled={isGeneratingDiet}
                            className="w-full py-3.5 mt-2 rounded-xl bg-secondary text-black font-black uppercase text-sm tracking-widest shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isGeneratingDiet ? <Loader2 className="w-5 h-5 animate-spin" /> : "Synthesize Plan"}
                        </button>
                    </div>

                    <AnimatePresence>
                        {generatedDiet && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-4 border-t border-secondary/20 space-y-4"
                            >
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black uppercase tracking-tight">{generatedDiet.planName}</h4>
                                    <p className="text-[10px] text-muted font-bold tracking-widest">
                                        TARGET: {generatedDiet.dailyCalories} KCAL · {generatedDiet.macroTargets.protein}g P · {generatedDiet.macroTargets.carbs}g C · {generatedDiet.macroTargets.fats}g F
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {generatedDiet.meals.map((meal: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-background border border-card-border">
                                            <p className="text-[9px] font-black uppercase text-secondary tracking-widest">{meal.type}</p>
                                            <p className="font-bold text-sm tracking-tight">{meal.name}</p>
                                            <p className="text-xs text-muted mb-2">{meal.description}</p>

                                            <div className="flex gap-2 flex-wrap mb-3">
                                                {meal.ingredients.map((ing: string, i: number) => (
                                                    <span key={i} className="text-[9px] px-2 py-1 rounded-md bg-secondary/10 text-secondary tracking-widest font-bold">
                                                        {ing}
                                                    </span>
                                                ))}
                                            </div>

                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                                                {meal.calories} KCAL | {meal.macros.protein}P {meal.macros.carbs}C {meal.macros.fats}F
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                    <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1">Needs Integration / Shopping</p>
                                    <ul className="text-xs text-muted space-y-1 list-disc list-inside">
                                        {generatedDiet.shoppingList.map((item: string, idx: number) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

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
                        <div className="p-6 rounded-3xl bg-card border border-dashed border-card-border text-center">
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
