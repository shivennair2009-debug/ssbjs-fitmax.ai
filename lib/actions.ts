"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSession() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Extract metadata from Supabase user
    const metadata = user.user_metadata || {};
    const name = metadata.full_name || user.email?.split('@')[0] || "Athlete";
    const dateOfBirth = metadata.dob ? new Date(metadata.dob) : null;
    const height = metadata.height ? parseFloat(metadata.height) : null;
    const weight = metadata.weight ? parseFloat(metadata.weight) : null;

    // Ensure user exists in our Prisma database
    let dbUser = await prisma.user.findUnique({
        where: { id: user.id }
    });

    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                id: user.id, // Store the Supabase UUID as the primary key
                email: user.email,
                name: name,
                dateOfBirth: dateOfBirth,
                height: height,
                weight: weight
            } as any
        });
    } else {
        // Optionally update metadata if it changes or was missing
        dbUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: dbUser.name || name,
                dateOfBirth: (dbUser as any).dateOfBirth || dateOfBirth,
                height: (dbUser as any).height || height,
                weight: (dbUser as any).weight || weight
            } as any
        });
    }

    return { user: { id: dbUser.id, email: dbUser.email, name: dbUser.name } };
}

export async function getUserProfile() {
    const session = await getSession();
    if (!session?.user?.id) return null;

    return await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            workoutPlans: {
                where: { isActive: true },
                take: 1,
                orderBy: { startDate: 'desc' }
            }
        }
    });
}

export async function updateUserProfile(data: { fitnessMode?: string, onboardingData?: any }) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            fitnessMode: data.fitnessMode,
            onboardingData: data.onboardingData,
        },
    });

    revalidatePath("/dashboard/profile");
    return updated;
}

export async function updateAccountDetails(data: { name?: string, dateOfBirth?: string, height?: number, weight?: number }) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Also update Supabase metadata for persistence across sessions
    const supabase = createClient();
    await supabase.auth.updateUser({
        data: {
            full_name: data.name,
            dob: data.dateOfBirth,
            height: data.height?.toString(),
            weight: data.weight?.toString(),
        }
    });

    const parsedDob = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;

    // Update Prisma DB
    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: data.name,
            dateOfBirth: parsedDob !== undefined ? parsedDob : undefined,
            height: data.height,
            weight: data.weight,
        } as any,
    });

    revalidatePath("/dashboard/profile");
    return updated;
}

export async function saveWorkoutPlan(plan: any) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Deactivate old plans
    await prisma.workoutPlan.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false },
    });

    const saved = await prisma.workoutPlan.create({
        data: {
            userId: session.user.id,
            planName: plan.planName,
            duration: plan.duration,
            overview: plan.overview,
            phases: plan.phases,
            weeklyPlan: plan.weeklyPlan,
            monthlyPlan: plan.monthlyPlan || [],
            nutritionGuidance: plan.nutritionGuidance,
            expectedResults: plan.expectedResults,
            isActive: true,
        },
    });

    revalidatePath("/dashboard/home");
    return saved;
}

export async function logWorkout(data: { exercises: any[], durationMins?: number, calories?: number }) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const log = await prisma.workoutLog.create({
        data: {
            userId: session.user.id,
            exercises: data.exercises,
            durationMins: data.durationMins,
            calories: data.calories,
        },
    });

    revalidatePath("/dashboard/stats");
    revalidatePath("/dashboard/profile");
    return log;
}

export async function getWorkoutLogs() {
    const session = await getSession();
    if (!session?.user?.id) return [];

    return await prisma.workoutLog.findMany({
        where: { userId: session.user.id },
        orderBy: { date: "desc" },
    });
}

export async function logMeal(data: { mealName: string, calories?: number, macros?: any, notes?: string }) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const log = await prisma.mealLog.create({
        data: {
            userId: session.user.id,
            mealName: data.mealName,
            calories: data.calories,
            macros: data.macros,
            notes: data.notes,
        },
    });

    revalidatePath("/dashboard/meals");
    revalidatePath("/dashboard/home");
    return log;
}

export async function getMealLogs() {
    const session = await getSession();
    if (!session?.user?.id) return [];

    return await prisma.mealLog.findMany({
        where: { userId: session.user.id },
        orderBy: { date: "desc" },
    });
}

