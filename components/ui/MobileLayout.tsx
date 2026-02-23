"use client";

import React from "react";

export function MobileLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen justify-center bg-black overflow-x-hidden">
            <div className="w-full max-w-[450px] min-h-screen bg-background relative shadow-[0_0_100px_rgba(0,0,0,0.5)] border-x border-white/5 overflow-x-hidden flex flex-col">
                {children}
            </div>
        </div>
    );
}
