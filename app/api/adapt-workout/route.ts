import { NextRequest, NextResponse } from "next/server";
import { adaptWorkoutBasedOnFeedback } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentExercise, feedback, mode } = body;

    if (!currentExercise || !feedback || !mode) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: currentExercise, feedback, mode",
        },
        { status: 400 }
      );
    }

    const adaptation = await adaptWorkoutBasedOnFeedback(
      currentExercise,
      feedback,
      mode
    );

    return NextResponse.json(adaptation);
  } catch (error) {
    console.error("Error adapting workout:", error);
    return NextResponse.json(
      { error: "Failed to adapt workout" },
      { status: 500 }
    );
  }
}
