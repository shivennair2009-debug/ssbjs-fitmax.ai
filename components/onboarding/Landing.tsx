"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function Landing({ onStart }: { onStart: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-3xl text-center space-y-12"
        >
            <div className="space-y-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block px-4 py-1.5 mb-2 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-medium tracking-wider uppercase"
                >
                    Your Personal AI Coach
                </motion.div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
                    FITMAX <span className="text-primary italic">AI</span>
                </h1>

                <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
                    The only fitness system that <span className="text-white">watches</span>, <span className="text-white">learns</span>, and <span className="text-white">gets better</span> with you every single day.
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-black transition-all duration-200 bg-primary rounded-full hover:bg-primary/90 focus:outline-none glow-primary"
            >
                <span className="relative flex items-center gap-2 text-xl uppercase tracking-widest">
                    Start My Journey
                    <Play className="w-5 h-5 fill-current" />
                </span>
            </motion.button>

            <div className="grid grid-cols-3 gap-8 pt-12 opacity-40">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-widest mb-1">Learning</p>
                    <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="w-1/2 h-full bg-primary"
                        />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-xs uppercase tracking-widest mb-1">Planning</p>
                    <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                            className="w-1/2 h-full bg-secondary"
                        />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-xs uppercase tracking-widest mb-1">Growing</p>
                    <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="w-1/2 h-full bg-accent"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
