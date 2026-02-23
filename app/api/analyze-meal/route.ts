import { NextRequest, NextResponse } from "next/server";
import { analyzeMealFromImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: imageBase64, mimeType" },
        { status: 400 }
      );
    }

    const analysis = await analyzeMealFromImage(imageBase64, mimeType);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing meal:", error);
    return NextResponse.json(
      { error: "Failed to analyze meal" },
      { status: 500 }
    );
  }
}
