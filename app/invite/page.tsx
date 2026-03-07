"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Loader2, Key } from "lucide-react";
import { verifyInviteCode } from "./actions";
import { useSearchParams } from "next/navigation";

function InviteContent() {
    const searchParams = useSearchParams();
    const error = searchParams?.get("error");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            await verifyInviteCode(formData);
        } catch (err: any) {
            if (err.message && err.message.includes("NEXT_REDIRECT")) {
                throw err;
            }
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
                <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Exclusive Access</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] bg-card border border-card-border shadow-2xl shadow-primary/5 space-y-6"
            >
                <div className="space-y-1">
                    <h2 className="text-lg font-black uppercase tracking-tight">
                        Invitation Required
                    </h2>
                    <p className="text-xs font-bold text-muted uppercase tracking-widest leading-relaxed">
                        Please enter your unique invitation code to continue.
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-xs text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-2 relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            id="code"
                            name="code"
                            type="text"
                            required
                            placeholder="Enter Code"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-primary transition-colors text-white placeholder:text-zinc-500 text-center uppercase tracking-widest"
                        />
                    </div>

                    <div className="flex flex-col gap-2 w-full pt-2">
                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-primary text-black font-black uppercase text-sm tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? "Verifying..." : "Access Platform"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default function InvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted">Verifying Identity...</p>
            </div>
        }>
            <InviteContent />
        </Suspense>
    );
}
