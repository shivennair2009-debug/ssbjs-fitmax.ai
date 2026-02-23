import { NextRequest, NextResponse } from "next/server";
import { analyzeFitnessProgress } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goal, currentStats } = body;

    if (!goal) {
      return NextResponse.json(
        { error: "Missing required field: goal" },
        { status: 400 }
      );
    }

    const analysis = await analyzeFitnessProgress(goal, currentStats || {});

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing fitness progress:", error);
    return NextResponse.json(
      { error: "Failed to analyze fitness progress" },
      { status: 500 }
    );
  }
}
