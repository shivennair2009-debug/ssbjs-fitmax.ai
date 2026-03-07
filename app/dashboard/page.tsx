"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/home");
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
    );
}
