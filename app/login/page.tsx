"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, X } from "lucide-react";
import { login, signup } from "./actions";
import { useSearchParams } from "next/navigation";

function LoginContent() {
    const searchParams = useSearchParams();
    const initialError = searchParams?.get("error");
    const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);

    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (formData: FormData) => {
        setIsLoading(true);
        setErrorMsg(null);

        try {
            const res = isSignUp ? await signup(formData) : await login(formData);

            if (res && 'error' in res && res.error) {
                setErrorMsg(res.error);
                setIsLoading(false);
            } else if (res && 'success' in res && res.success && res.redirectUrl) {
                // Hard redirect to force a full reload and hydrate the browser's Supabase client
                window.location.href = res.redirectUrl;
            }
        } catch (e: any) {
            console.error(e);
            setErrorMsg("An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    const [legalModalOpen, setLegalModalOpen] = useState<"tc" | "privacy" | null>(null);

    const LegalModal = () => (
        <AnimatePresence>
            {legalModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                    onClick={() => setLegalModalOpen(null)}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg p-6 sm:p-8 bg-card border border-card-border rounded-3xl shadow-2xl relative"
                    >
                        <button
                            onClick={() => setLegalModalOpen(null)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="space-y-4 text-left">
                            <h3 className="text-xl font-black uppercase tracking-widest text-primary">
                                {legalModalOpen === "tc" ? "Terms & Conditions" : "Privacy Policy"}
                            </h3>
                            <div className="text-sm text-foreground/80 space-y-4 leading-relaxed">
                                <p>
                                    Welcome to FitMax AI. To provide you with highly personalized fitness and nutrition plans, we collect and process specific data points.
                                </p>
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-2">
                                    <p className="font-bold text-white uppercase tracking-widest text-xs">Data We Collect:</p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted">
                                        <li>Full Name</li>
                                        <li>Email Address</li>
                                        <li>Age / Date of Birth</li>
                                        <li>Height & Weight</li>
                                        <li>Workout Goals</li>
                                        <li>Consistency & Activity Levels</li>
                                    </ul>
                                </div>
                                <p>
                                    We use this data exclusively to power the neural fitness engine, calibrate your daily plans, and synchronize your progress. Your data is securely encrypted and never sold to third parties. By using the app, you consent to this data processing.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
            <LegalModal />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
            >
                <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none italic">
                    FitMax <span className="text-primary italic">AI</span>
                </h1>
                <p className="text-xs sm:text-sm font-bold text-muted uppercase tracking-[0.2em]">Unlock Your Peak Potential</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-lg p-6 sm:p-10 rounded-[2.5rem] bg-card border border-card-border shadow-2xl shadow-primary/5 space-y-8"
            >
                <div className="space-y-1">
                    <h2 className="text-lg font-black uppercase tracking-tight">
                        {isSignUp ? "Create Your Account" : "Welcome Back"}
                    </h2>
                    <p className="text-xs font-bold text-muted uppercase tracking-widest leading-relaxed">
                        {isSignUp
                            ? "Enter your details to start your journey."
                            : "Sign in to synchronize your progress."}
                    </p>
                </div>

                {errorMsg && (
                    <div className="p-3 text-xs text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleAction(formData);
                }} className="space-y-3">
                    <div className="space-y-2">
                        {isSignUp && (
                            <>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Full Name"
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder:text-zinc-500"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        id="dob"
                                        name="dob"
                                        type="date"
                                        required
                                        title="Date of Birth"
                                        className="w-full px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder:text-zinc-500"
                                    />
                                    <input
                                        id="height"
                                        name="height"
                                        type="number"
                                        required
                                        placeholder="H (cm)"
                                        className="w-full px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder:text-zinc-500"
                                    />
                                    <input
                                        id="weight"
                                        name="weight"
                                        type="number"
                                        required
                                        placeholder="W (kg)"
                                        className="w-full px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder:text-zinc-500"
                                    />
                                </div>
                            </>
                        )}
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="Email Address"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder:text-zinc-500"
                        />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="Password"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder:text-zinc-500"
                        />
                    </div>

                    <div className="flex flex-col gap-2 w-full pt-2">
                        {!isSignUp ? (
                            <>
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-primary text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isLoading ? "Synchronizing..." : "Log In"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(true)}
                                    className="w-full py-3 rounded-xl bg-secondary/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-secondary/20 transition-all border border-card-border disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    Sign Up
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-primary text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isLoading ? "Creating Identity..." : "Get Started"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(false)}
                                    className="w-full py-3 rounded-xl bg-secondary/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-secondary/20 transition-all border border-card-border disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    Already have an account? Sign In
                                </button>
                            </>
                        )}
                    </div>
                </form>

                <div className="pt-2 text-[10px] font-bold text-muted/60 uppercase tracking-widest leading-loose">
                    By continuing, you agree to our{" "}
                    <button type="button" onClick={() => setLegalModalOpen("tc")} className="text-primary hover:underline underline-offset-2">Terms & Conditions</button>
                    {" "}and{" "}
                    <button type="button" onClick={() => setLegalModalOpen("privacy")} className="text-primary hover:underline underline-offset-2">Privacy Policy</button>.
                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted">Loading...</p>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
