import { NextRequest, NextResponse } from "next/server";
import { generateRoxyResponse } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goal, mode, currentPlan, workoutLogs, mealLogs, message } = body;

    if (!goal || !mode || !message) {
      return NextResponse.json(
        { error: "Missing required fields: goal, mode, message" },
        { status: 400 }
      );
    }

    const response = await generateRoxyResponse(
      goal,
      mode,
      currentPlan || {},
      workoutLogs || [],
      mealLogs || [],
      message
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating Roxy response:", error);
    return NextResponse.json(
      { error: "Failed to generate Roxy response" },
      { status: 500 }
    );
  }
}
