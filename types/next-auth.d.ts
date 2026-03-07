import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            fitnessMode?: string;
        } & DefaultSession["user"]
    }

    interface User {
        fitnessMode?: string;
    }
}
