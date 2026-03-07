import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="space-y-4 flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted animate-pulse">
                    Synchronizing Neural Identity...
                </p>
                <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress-loading" />
                </div>
            </div>
        </div>
    );
}
