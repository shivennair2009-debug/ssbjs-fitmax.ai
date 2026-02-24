import { GoogleGenerativeAI } from "@google/generative-ai";
import { withBackoff } from "@/lib/utils";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

function extractJsonCandidate(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

async function repairJson(text: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a JSON repair tool. Fix the following into valid JSON only.
Rules:
- Output ONLY valid JSON. No extra text.
- Preserve all fields and values.

BROKEN JSON:
${text}`;

  const result = await withBackoff(() => model.generateContent(prompt));
  return result.response.text();
}

async function parseJsonWithRepair(text: string) {
  const candidate = extractJsonCandidate(text);
  try {
    return JSON.parse(candidate);
  } catch {
    const repaired = await repairJson(candidate);
    const repairedCandidate = extractJsonCandidate(repaired);
    return JSON.parse(repairedCandidate);
  }
}

export async function generateWorkoutPlan(
  goal: string,
  mode: "active" | "intermediate" | "locked-in",
  userContext?: {
    age?: number;
    fitnessLevel?: string;
    availableEquipment?: string[];
    daysPerWeek?: number;
  }
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const modeGuide = {
    active: "Focus on maintenance, consistency, and building sustainable habits. Moderate intensity.",
    intermediate:
      "Balanced progression with moderate calorie deficits and structured training. Mix cardio and strength.",
    "locked-in":
      "Maximum transformation with aggressive targets, strict tracking, and high intensity protocols.",
  };

  const prompt = `You are an elite fitness AI coach. Generate a comprehensive workout plan based on the following:

USER GOAL: ${goal}
INTENSITY MODE: ${mode.toUpperCase()}
MODE DESCRIPTION: ${modeGuide[mode]}
${userContext?.age ? `Age: ${userContext.age}` : ""}
${userContext?.fitnessLevel ? `Fitness Level: ${userContext.fitnessLevel}` : ""}
${userContext?.availableEquipment ? `Available Equipment: ${userContext.availableEquipment.join(", ")}` : ""}
${userContext?.daysPerWeek ? `Days Per Week: ${userContext.daysPerWeek}` : ""}

Please provide a detailed, JSON-formatted workout plan with the following structure:
{
  "planName": "string",
  "duration": "string (e.g., '12 weeks')",
  "overview": "string describing the overall approach",
  "phases": [
    {
      "name": "string",
      "duration": "string",
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "reps": "string",
          "sets": "number",
          "durationSeconds": "number (the AI-defined duration for this specific exercise in seconds)",
          "rest": "string (e.g., '60 seconds')",
          "notes": "string with form cues",
          "steps": ["Step 1", "Step 2", "Step 3"]
        }
      ]
    }
  ],
  "weeklyPlan": [
    {
      "day": "string (e.g., 'Monday' or 'Day 1')",
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "reps": "string",
          "sets": "number",
          "durationSeconds": "number",
          "rest": "string",
          "notes": "string with form cues",
          "steps": ["Step 1", "Step 2", "Step 3"]
        }
      ]
    }
  ],
  "monthlyPlan": [
    {
      "week": "string (e.g., 'Week 2')",
      "days": [
        {
          "day": "string",
          "focus": "string",
          "exercises": [
            {
              "name": "string",
              "reps": "string",
              "sets": "number",
              "durationSeconds": "number",
              "rest": "string",
              "notes": "string with form cues",
              "steps": ["Step 1", "Step 2", "Step 3"]
            }
          ]
        }
      ]
    }
  ],
  "nutritionGuidance": "string",
  "expectedResults": "string"
}

Requirements:
- weeklyPlan must contain exactly 7 days (one week).
- monthlyPlan must cover the remaining weeks of the current month (3 weeks) with 7 days each.
- Include at least 1 recovery or mobility day per week.

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse workout plan:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to generate workout plan");
  }
}

export async function generatePlanOverview(
  goal: string,
  mode: "active" | "intermediate" | "locked-in",
  userContext?: {
    age?: number;
    fitnessLevel?: string;
    availableEquipment?: string[];
    daysPerWeek?: number;
  }
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const modeGuide = {
    active: "Focus on maintenance, consistency, and building sustainable habits. Moderate intensity.",
    intermediate:
      "Balanced progression with moderate calorie deficits and structured training. Mix cardio and strength.",
    "locked-in":
      "Maximum transformation with aggressive targets, strict tracking, and high intensity protocols.",
  };

  const prompt = `You are an elite fitness AI coach. Create the high-level plan overview and phases.

USER GOAL: ${goal}
INTENSITY MODE: ${mode.toUpperCase()}
MODE DESCRIPTION: ${modeGuide[mode]}
${userContext?.age ? `Age: ${userContext.age}` : ""}
${userContext?.fitnessLevel ? `Fitness Level: ${userContext.fitnessLevel}` : ""}
${userContext?.availableEquipment ? `Available Equipment: ${userContext.availableEquipment.join(", ")}` : ""}
${userContext?.daysPerWeek ? `Days Per Week: ${userContext.daysPerWeek}` : ""}

Return JSON:
{
  "planName": "string",
  "duration": "string (e.g., '12 weeks')",
  "overview": "string describing the overall approach aligned to the user's goal",
  "phases": [
    {
      "name": "string",
      "duration": "string",
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "reps": "string",
          "sets": "number",
          "durationSeconds": "number",
          "rest": "string (e.g., '60 seconds')",
          "notes": "string with form cues",
          "steps": ["Step 1", "Step 2", "Step 3"]
        }
      ]
    }
  ],
  "nutritionGuidance": "string",
  "expectedResults": "string"
}

Requirements:
- Must clearly align the plan to the user's goal and intensity mode.
- Avoid generic filler; be specific to the goal.

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse plan overview:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to generate plan overview");
  }
}

export async function generateWeeklyPlan(
  goal: string,
  mode: "active" | "intermediate" | "locked-in",
  userContext?: {
    daysPerWeek?: number;
  }
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are an elite fitness AI coach. Create a 7-day workout schedule aligned to the user's goal.

USER GOAL: ${goal}
INTENSITY MODE: ${mode.toUpperCase()}
${userContext?.daysPerWeek ? `Days Per Week: ${userContext.daysPerWeek}` : ""}

Return JSON:
{
  "weeklyPlan": [
    {
      "day": "string (e.g., 'Monday' or 'Day 1')",
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "reps": "string",
          "sets": "number",
          "durationSeconds": "number",
          "rest": "string",
          "notes": "string with form cues",
          "steps": ["Step 1", "Step 2", "Step 3"]
        }
      ]
    }
  ]
}

Requirements:
- weeklyPlan must contain exactly 7 days.
- Include at least 1 recovery or mobility day.
- Each day's exercises must align with the user's goal and intensity mode.

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse weekly plan:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to generate weekly plan");
  }
}

export async function generateMonthlyPlan(
  goal: string,
  mode: "active" | "intermediate" | "locked-in"
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are an elite fitness AI coach. Create a monthly plan that covers days 8 through 31 (24 days) after day 1.

USER GOAL: ${goal}
INTENSITY MODE: ${mode.toUpperCase()}

Return JSON:
{
  "monthlyPlan": [
    {
      "week": "string (e.g., 'Week 2')",
      "days": [
        {
          "day": "string",
          "focus": "string",
          "exercises": [
            {
              "name": "string",
              "reps": "string",
              "sets": "number",
              "durationSeconds": "number",
              "rest": "string",
              "notes": "string with form cues",
              "steps": ["Step 1", "Step 2", "Step 3"]
            }
          ]
        }
      ]
    }
  ]
}

Requirements:
- monthlyPlan must include 24 days total, grouped into weeks (the final week can have fewer than 7 days).
- Each week should have 3-7 days.
- Include at least 1 recovery or mobility day per week.
- Each day's exercises must align with the user's goal and intensity mode.

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse monthly plan:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to generate monthly plan");
  }
}

export async function recalibrateWeeklyPlan(
  goal: string,
  mode: "active" | "intermediate" | "locked-in",
  currentWeeklyPlan: any,
  recentWorkouts: any[],
  recentMeals: any[]
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are an elite fitness AI coach recalibrating a 7-day plan based on adherence and feedback.

USER GOAL: ${goal}
INTENSITY MODE: ${mode.toUpperCase()}

CURRENT WEEKLY PLAN JSON:
${JSON.stringify(currentWeeklyPlan)}

RECENT WORKOUT LOGS (last 7 days):
${JSON.stringify(recentWorkouts)}

RECENT MEAL LOGS (last 7 days):
${JSON.stringify(recentMeals)}

Return JSON:
{
  "weeklyPlan": [
    {
      "day": "string",
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "reps": "string",
          "sets": "number",
          "durationSeconds": "number",
          "rest": "string",
          "notes": "string with form cues",
          "steps": ["Step 1", "Step 2", "Step 3"]
        }
      ]
    }
  ],
  "reason": "string summary of recalibration decisions"
}

Requirements:
- weeklyPlan must contain exactly 7 days.
- Adjust difficulty/volume based on completion and perceived effort.
- Align to the user's goal and intensity mode.

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse recalibrated plan:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to recalibrate plan");
  }
}

export async function analyzeMealFromImage(
  imageBase64: string,
  mimeType: string
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a nutrition AI. Analyze the meal photo and estimate nutrition.

Return JSON:
{
  "mealName": "string",
  "calories": "number",
  "macros": {
    "protein_g": "number",
    "carbs_g": "number",
    "fats_g": "number"
  },
  "micros": ["string"],
  "notes": "string"
}

Generate JSON only, no extra text.`;

  const result = await withBackoff(() =>
    model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ])
  );

  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse meal analysis:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to analyze meal");
  }
}

export async function generateRoxyResponse(
  goal: string,
  mode: "active" | "intermediate" | "locked-in",
  currentPlan: any,
  workoutLogs: any[],
  mealLogs: any[],
  userMessage: string
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are Roxy, a personal trainer who guides the user throughout their journey.

USER GOAL: ${goal}
INTENSITY MODE: ${mode.toUpperCase()}
CURRENT PLAN JSON:
${JSON.stringify(currentPlan)}

RECENT WORKOUT LOGS:
${JSON.stringify(workoutLogs)}

RECENT MEAL LOGS:
${JSON.stringify(mealLogs)}

USER MESSAGE:
${userMessage}

Return JSON:
{
  "message": "string response to the user (supportive, concise)",
  "shouldRecalibrate": "boolean",
  "weeklyPlan": [ ... ] // only if shouldRecalibrate is true, with 7 days like weeklyPlan
}

Rules:
- Be practical and personalized to the goal and recent performance.
- If the user asks to change tomorrow/next days, set shouldRecalibrate true and provide an updated weeklyPlan.

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse Roxy response:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to generate Roxy response");
  }
}

export async function generateCoachingCue(
  exerciseName: string,
  currentReps?: number,
  userFeedback?: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You are a professional fitness coach providing real-time feedback during a workout.

EXERCISE: ${exerciseName}
${currentReps ? `Current Rep Count: ${currentReps}` : ""}
${userFeedback ? `User Feedback: ${userFeedback}` : ""}

Provide a motivating, concise coaching cue (1-2 sentences max) that:
1. Corrects form if needed
2. Provides encouragement
3. Is actionable and specific to this exercise

Keep it under 20 words. Be direct and motivating without being condescending.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  return result.response.text();
}

export async function generateDietRecommendation(
  goal: string,
  mode: "active" | "intermediate" | "locked-in",
  preferences?: {
    dietType?: string;
    restrictions?: string[];
    mealsPerDay?: number;
    cuisinePreferences?: string[];
  }
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a nutrition AI specialist. Create a nutrition plan for a client with the following profile:

FITNESS GOAL: ${goal}
INTENSITY MODE: ${mode.toUpperCase()}
${preferences?.dietType ? `Diet Type: ${preferences.dietType}` : ""}
${preferences?.restrictions ? `Restrictions: ${preferences.restrictions.join(", ")}` : ""}
${preferences?.mealsPerDay ? `Meals Per Day: ${preferences.mealsPerDay}` : ""}
${preferences?.cuisinePreferences ? `Cuisine Preferences: ${preferences.cuisinePreferences.join(", ")}` : ""}

Provide a JSON-formatted nutrition plan:
{
  "dailyCalories": "number",
  "macroBreakdown": {
    "protein": "string (percentage and grams)",
    "carbs": "string (percentage and grams)",
    "fats": "string (percentage and grams)"
  },
  "sampleMealPlan": [
    {
      "meal": "string",
      "foods": ["string"],
      "calories": "number",
      "macros": "string"
    }
  ],
  "supplements": ["string"],
  "hydration": "string",
  "tips": ["string"]
}

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse diet recommendation:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to generate diet recommendation");
  }
}

export async function analyzeFitnessProgress(
  goal: string,
  currentStats: {
    workoutsCompleted?: number;
    daysTracked?: number;
    averageAdherence?: number;
    progressNotes?: string;
  }
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a fitness progress analyst. Analyze the following progress data and provide insights:

ORIGINAL GOAL: ${goal}
WORKOUTS COMPLETED: ${currentStats.workoutsCompleted || 0}
DAYS TRACKED: ${currentStats.daysTracked || 0}
AVERAGE ADHERENCE: ${currentStats.averageAdherence || 0}%
${currentStats.progressNotes ? `Progress Notes: ${currentStats.progressNotes}` : ""}

Provide actionable insights in JSON format:
{
  "progressSummary": "string",
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "nextSteps": ["string"],
  "motivationalMessage": "string"
}

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse progress analysis:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to analyze fitness progress");
  }
}

export async function adaptWorkoutBasedOnFeedback(
  currentExercise: string,
  feedback: string,
  mode: "active" | "intermediate" | "locked-in"
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a smart fitness coach adapting a workout in real-time.

CURRENT EXERCISE: ${currentExercise}
USER FEEDBACK: ${feedback}
INTENSITY MODE: ${mode}

Based on the user's feedback, suggest a modification or alternative. Return a JSON object:
{
  "shouldModify": boolean,
  "reason": "string explaining why",
  "suggestion": "string describing the modification or alternative",
  "alternatives": ["string"]
}

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse workout adaptation:", text);
    console.error("Parse error details:", error);
    throw new Error("Failed to adapt workout");
  }
}

export async function generateSmartMealRecommendation(
  goal: string,
  mode: "active" | "intermediate" | "locked-in",
  recentMeals: any[],
  recentWorkouts: any[]
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are an elite nutrition AI specialist. Suggest the NEXT optimal meal for this user based on their goals and recent activity.
  
USER GOAL: ${goal}
INTENSITY MODE: ${mode.toUpperCase()}

RECENT MEAL HISTORY:
${JSON.stringify(recentMeals)}

RECENT WORKOUT HISTORY:
${JSON.stringify(recentWorkouts)}

Provide a JSON-formatted smart recommendation for the NEXT meal:
{
  "sampleMealPlan": [
    {
      "meal": "string (name of the meal)",
      "foods": ["string"],
      "calories": "number",
      "macros": "string (e.g. '30g P, 40g C, 10g F')"
    }
  ],
  "tips": ["string explaining why this meal is optimal right now (e.g. post-workout recovery or pre-workout fuel)"]
}

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    return await parseJsonWithRepair(text);
  } catch (error) {
    console.error("Failed to parse smart meal recommendation:", text);
    throw new Error("Failed to generate smart recommendation");
  }
}
