import { NextRequest, NextResponse } from "next/server";
import { generateWorkoutPlan } from "@/lib/gemini";
import { getSession } from "@/lib/actions";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { goal, mode } = body;
    let { userContext } = body;

    if (!goal || !mode) {
      return NextResponse.json(
        { error: "Missing required fields: goal, mode" },
        { status: 400 }
      );
    }

    // Fetch user details from database to ensure AI has them
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true, height: true, weight: true }
    }) as any;

    if (user) {
      // Calculate age from DOB for the AI prompt
      let calculatedAge = userContext?.age;
      if (user.dateOfBirth) {
        const dob = new Date(user.dateOfBirth);
        const diff_ms = Date.now() - dob.getTime();
        const age_dt = new Date(diff_ms);
        calculatedAge = Math.abs(age_dt.getUTCFullYear() - 1970);
      }

      userContext = {
        ...userContext,
        age: calculatedAge,
        height: user.height || userContext?.height,
        weight: user.weight || userContext?.weight,
      };
    }

    let plan: any;

    if (goal.toLowerCase() === 'x') {
      // Demo Mode payload
      plan = {
        planName: "Demo Mode - X Plan",
        duration: "4 weeks",
        overview: "This is a static demo plan triggered by entering 'X'.",
        phases: [
          {
            name: "Phase 1: Foundation",
            duration: "Week 1-2",
            focus: "Establishing form and stamina",
            exercises: [
              { name: "Demo Squats", reps: "12-15", sets: 3, durationSeconds: 60, rest: "60s", notes: "Keep chest up.", steps: ["Stand straight", "Lower hips"] }
            ]
          }
        ],
        weeklyPlan: [
          {
            day: "Day 1",
            focus: "Full Body Demo",
            exercises: Array.from({ length: 10 }).map((_, i) => ({
              name: `Demo Exercise ${i + 1}`,
              reps: "10-12",
              sets: 3,
              durationSeconds: 45,
              rest: "45s",
              notes: "Maintain steady breathing.",
              steps: ["Step 1", "Step 2", "Step 3"]
            }))
          },
        ],
        monthlyPlan: [],
        nutritionGuidance: "Eat balanced meals.",
        expectedResults: "You will experience the app UI."
      };
    } else {
      plan = await generateWorkoutPlan(goal, mode, userContext);
    }

    // Save plan to DB
    await prisma.workoutPlan.create({
      data: {
        userId,
        planName: plan.planName,
        duration: plan.duration,
        overview: plan.overview,
        phases: plan.phases || [],
        weeklyPlan: plan.weeklyPlan as any,
        monthlyPlan: plan.monthlyPlan || [],
        nutritionGuidance: plan.nutritionGuidance,
        expectedResults: plan.expectedResults,
        startDate: new Date(),
        isActive: true,
      }
    });

    // Also update user profile with latest goal/mode
    await prisma.user.update({
      where: { id: userId },
      data: {
        fitnessGoal: goal,
        fitnessMode: mode
      }
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json(
        { error: "The AI is currently busy. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    console.error("Error generating workout plan:", error);
    return NextResponse.json(
      { error: "Failed to generate workout plan" },
      { status: 500 }
    );
  }
}

