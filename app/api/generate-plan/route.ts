import { NextRequest, NextResponse } from "next/server";
import {
  generatePlanOverview,
  generateWeeklyPlan,
  generateMonthlyPlan,
} from "@/lib/gemini";

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

    const overview = await generatePlanOverview(goal, mode, userContext);
    const weekly = await generateWeeklyPlan(goal, mode, userContext);
    const monthly = await generateMonthlyPlan(goal, mode);

    const plan = {
      ...overview,
      ...weekly,
      ...monthly,
    };

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error generating workout plan:", error);
    return NextResponse.json(
      { error: "Failed to generate workout plan" },
      { status: 500 }
    );
  }
}
