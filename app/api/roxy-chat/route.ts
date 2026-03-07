import { NextRequest, NextResponse } from "next/server";
import { generateRoxyResponse } from "@/lib/gemini";
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
    const { goal, mode, currentPlan, workoutLogs, mealLogs, message, planId } = body;

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

    // If Roxy decides to recalibrate the plan, save the new plan to the database
    if (response.shouldRecalibrate && response.weeklyPlan && planId) {
      await prisma.workoutPlan.update({
        where: {
          id: planId,
          userId: userId // Security check: Ensure the plan belongs to the user
        },
        data: {
          weeklyPlan: response.weeklyPlan as any
        }
      });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Roxy is currently busy. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    console.error("Error generating Roxy response:", error);
    return NextResponse.json(
      { error: "Failed to generate Roxy response" },
      { status: 500 }
    );
  }
}
