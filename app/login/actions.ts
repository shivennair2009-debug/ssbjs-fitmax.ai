"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/actions";

export async function login(formData: FormData) {
    console.log("Login action started...");
    const supabase = createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    console.log(`Attempting login for: ${data.email}`);

    try {
        const { error } = await supabase.auth.signInWithPassword(data);

        if (error) {
            console.error("Supabase login error:", error.message);
            return { error: error.message };
        } else {
            console.log("Login successful, checking profile routing...");
            const profile = await getUserProfile();
            const hasPlan = profile && profile.workoutPlans && (profile.workoutPlans as any[]).length > 0;

            if (hasPlan) {
                revalidatePath("/", "layout");
                redirect("/dashboard/home");
            } else {
                revalidatePath("/", "layout");
                redirect("/?step=goal");
            }
        }
    } catch (e: any) {
        console.error("Unexpected login error:", e);
        return { error: "Authentication failed. Please try again." };
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signup(formData: FormData) {
    console.log("Signup action started...");
    const supabase = createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const dob = formData.get("dob") as string;
    const height = parseFloat(formData.get("height") as string);
    const weight = parseFloat(formData.get("weight") as string);

    console.log(`Attempting signup for: ${email}`);
    let redirectUrl = "/";

    try {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    dob: dob,
                    height: height,
                    weight: weight,
                }
            }
        });

        if (error) {
            console.error("Supabase signup error:", error.message);
            return { error: error.message };
        } else {
            console.log("Signup successful, redirecting to onboarding...");
            redirectUrl = "/?step=goal";
        }
    } catch (e: any) {
        console.error("Unexpected signup error:", e);
        return { error: "An unexpected error occurred. Please try again." };
    }

    revalidatePath("/", "layout");
    redirect(redirectUrl);
}
