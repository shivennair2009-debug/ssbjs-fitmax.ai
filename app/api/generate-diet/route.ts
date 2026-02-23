import { NextRequest, NextResponse } from "next/server";
import { generateDietRecommendation } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goal, mode, preferences } = body;

    if (!goal || !mode) {
      return NextResponse.json(
        { error: "Missing required fields: goal, mode" },
        { status: 400 }
      );
    }

    const dietPlan = await generateDietRecommendation(goal, mode, preferences);

    return NextResponse.json(dietPlan);
  } catch (error) {
    console.error("Error generating diet recommendation:", error);
    return NextResponse.json(
      { error: "Failed to generate diet recommendation" },
      { status: 500 }
    );
  }
}
