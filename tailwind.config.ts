import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#00FF9D", // Cyber green
                    foreground: "#000000",
                },
                secondary: {
                    DEFAULT: "#7000FF", // Neon purple
                    foreground: "#FFFFFF",
                },
                accent: {
                    DEFAULT: "#FF007A", // Neon pink
                    foreground: "#FFFFFF",
                }
            },
        },
    },
    plugins: [],
};
export default config;
