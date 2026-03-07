import { NextRequest, NextResponse } from "next/server";
import { generateDietPlan } from "@/lib/gemini";
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
    const { dietType, allergies, fridgeIngredients } = body;

    // Fetch user context for AI prompt
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true, height: true, weight: true, fitnessGoal: true, fitnessMode: true } as any
    }) as any;

    let calculatedAge;
    if (user?.dateOfBirth) {
      const dob = new Date(user.dateOfBirth);
      const diff_ms = Date.now() - dob.getTime();
      const age_dt = new Date(diff_ms);
      calculatedAge = Math.abs(age_dt.getUTCFullYear() - 1970);
    }

    const plan = await generateDietPlan(
      user?.fitnessGoal || "General Fitness",
      user?.fitnessMode || "active",
      { dietType, allergies, fridgeIngredients },
      { age: calculatedAge, height: user?.height, weight: user?.weight }
    );

    return NextResponse.json(plan);
  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json(
        { error: "The AI is currently busy. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    console.error("Error generating diet plan:", error);
    return NextResponse.json(
      { error: "Failed to generate diet plan" },
      { status: 500 }
    );
  }
}
