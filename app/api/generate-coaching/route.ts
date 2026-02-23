import { NextRequest, NextResponse } from "next/server";
import { generateCoachingCue } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exerciseName, currentReps, userFeedback } = body;

    if (!exerciseName) {
      return NextResponse.json(
        { error: "Missing required field: exerciseName" },
        { status: 400 }
      );
    }

    const cue = await generateCoachingCue(
      exerciseName,
      currentReps,
      userFeedback
    );

    return NextResponse.json({ coachingCue: cue });
  } catch (error) {
    console.error("Error generating coaching cue:", error);
    return NextResponse.json(
      { error: "Failed to generate coaching cue" },
      { status: 500 }
    );
  }
}
