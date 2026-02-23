import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

export async function withBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    initialDelay: number = 1000
): Promise<T> {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const isRateLimit =
                error?.status === 429 ||
                error?.message?.toLowerCase().includes("rate limit") ||
                error?.message?.toLowerCase().includes("quota");

            if (isRateLimit && i < maxRetries - 1) {
                const jitter = Math.random() * 1000;
                console.warn(`Rate limit hit. Retrying in ${delay + jitter}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay + jitter));
                delay *= 2;
                continue;
            }
            throw error;
        }
    }
    throw new Error("Max retries exceeded");
}
