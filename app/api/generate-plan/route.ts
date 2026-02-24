import { NextRequest, NextResponse } from "next/server";
import { generateWorkoutPlan } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goal, mode, userContext } = body;

    if (!goal || !mode) {
      return NextResponse.json(
        { error: "Missing required fields: goal, mode" },
        { status: 400 }
      );
    }

    const plan = await generateWorkoutPlan(goal, mode, userContext);

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
