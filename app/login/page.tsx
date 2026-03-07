"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";
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

            if (res?.error) {
                setErrorMsg(res.error);
                setIsLoading(false);
            }
        } catch (e: any) {
            // Next.js redirect throws an error that we must re-throw
            if (e.message && e.message.includes("NEXT_REDIRECT")) {
                throw e;
            }
            console.error(e);
            setErrorMsg("An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center relative overflow-hidden"
            >
                <Zap className="w-10 h-10 text-primary relative z-10" />
                <div className="absolute inset-0 bg-primary blur-2xl opacity-20" />
            </motion.div>

            <div className="space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none italic">
                    FitMax <span className="text-primary italic">AI</span>
                </h1>
                <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Unlock Your Peak Potential</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-[320px] p-6 rounded-[2.5rem] bg-card border border-card-border shadow-2xl shadow-primary/5 space-y-6"
            >
                <div className="space-y-1">
                    <h2 className="text-lg font-black uppercase tracking-tight">
                        {isSignUp ? "Create Your Account" : "Welcome Back"}
                    </h2>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-relaxed">
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

                <form action={handleAction} className="space-y-3">
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
                                    className="w-full py-3 rounded-xl bg-primary text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Signing In..." : "Log In"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(true)}
                                    className="w-full py-3 rounded-xl bg-secondary/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-secondary/20 transition-all border border-card-border"
                                >
                                    Sign Up
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-primary text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Creating Account..." : "Get Started"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(false)}
                                    className="w-full py-3 rounded-xl bg-secondary/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-secondary/20 transition-all border border-card-border"
                                >
                                    Already have an account? Sign In
                                </button>
                            </>
                        )}
                    </div>
                </form>

                <p className="text-[8px] font-bold text-muted/60 uppercase tracking-widest leading-loose">
                    By continuing, you agree to our terms and privacy policy.
                </p>
            </motion.div>

            <div className="absolute bottom-8 left-0 right-0">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted opacity-20">Secure Intelligence Active</p>
            </div>
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
