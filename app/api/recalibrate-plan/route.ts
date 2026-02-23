import { NextRequest, NextResponse } from "next/server";
import { recalibrateWeeklyPlan } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goal, mode, currentWeeklyPlan, recentWorkouts, recentMeals } = body;

    if (!goal || !mode || !currentWeeklyPlan) {
      return NextResponse.json(
        { error: "Missing required fields: goal, mode, currentWeeklyPlan" },
        { status: 400 }
      );
    }

    const recalibrated = await recalibrateWeeklyPlan(
      goal,
      mode,
      currentWeeklyPlan,
      recentWorkouts || [],
      recentMeals || []
    );

    return NextResponse.json(recalibrated);
  } catch (error) {
    console.error("Error recalibrating plan:", error);
    return NextResponse.json(
      { error: "Failed to recalibrate plan" },
      { status: 500 }
    );
  }
}
