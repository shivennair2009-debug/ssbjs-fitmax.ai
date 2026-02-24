import { NextRequest, NextResponse } from "next/server";
import { generateSmartMealRecommendation } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { goal, mode, recentMeals, recentWorkouts } = body;

        const recommendation = await generateSmartMealRecommendation(
            goal,
            mode,
            recentMeals || [],
            recentWorkouts || []
        );

        return NextResponse.json(recommendation);
    } catch (error: any) {
        console.error("Error generating meal recommendation:", error);
        return NextResponse.json(
            { error: "Failed to generate recommendation", details: error.message },
            { status: 500 }
        );
    }
}
