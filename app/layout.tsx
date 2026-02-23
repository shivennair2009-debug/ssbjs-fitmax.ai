import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MobileLayout } from "@/components/ui/MobileLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "FitMax AI | Simple Fitness Coach",
    description: "Your friendly AI fitness coach that helps you get fit.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen antialiased selection:bg-primary selection:text-black`}>
                <ThemeProvider>
                    <MobileLayout>
                        {children}
                    </MobileLayout>
                </ThemeProvider>
            </body>
        </html>
    );
}
