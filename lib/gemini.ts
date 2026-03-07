import { GoogleGenerativeAI } from "@google/generative-ai";
import { withBackoff } from "@/lib/utils";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Workout Plan Schemas for Validation
const ExerciseSchema = z.object({
  name: z.string(),
  reps: z.string(),
  sets: z.number(),
  durationSeconds: z.number(),
  rest: z.string(),
  notes: z.string(),
  steps: z.array(z.string()).optional(),
});

const DayPlanSchema = z.object({
  day: z.string(),
  focus: z.string(),
  exercises: z.array(ExerciseSchema),
});

const WeekPlanSchema = z.object({
  week: z.string(),
  days: z.array(DayPlanSchema),
});

export const WorkoutPlanSchema = z.object({
  planName: z.string(),
  duration: z.string(),
  overview: z.string(),
  phases: z.array(z.object({
    name: z.string(),
    duration: z.string(),
    focus: z.string(),
    exercises: z.array(ExerciseSchema),
  })),
  weeklyPlan: z.array(DayPlanSchema),
  monthlyPlan: z.array(WeekPlanSchema).optional(),
  nutritionGuidance: z.string().optional(),
  expectedResults: z.string().optional(),
});

export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

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
    height?: number;
    weight?: number;
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

  const prompt = `You are an elite fitness AI coach. Generate a comprehensive and highly specific workout plan.

USER GOAL: ${goal}
INTENSITY MODE (Experience/Consistency): ${mode.toUpperCase()}
MODE DESCRIPTION: ${modeGuide[mode]}
${userContext?.age ? `Age: ${userContext.age}` : ""}
${userContext?.height ? `Height: ${userContext.height} cm` : ""}
${userContext?.weight ? `Weight: ${userContext.weight} kg` : ""}
${userContext?.fitnessLevel ? `Fitness Level: ${userContext.fitnessLevel}` : ""}
${userContext?.availableEquipment ? `Available Equipment: ${userContext.availableEquipment.join(", ")}` : ""}
${userContext?.daysPerWeek ? `Days Per Week: ${userContext.daysPerWeek}` : ""}

CRITICAL INSTRUCTION: You MUST generate EXACTLY 10 distinct, highly-personalized tasks per day. Do NOT use generic terms like "warmup" or "run". Tailor every single task meticulously to the user's specific goal, age, height, weight, and fitness mode to maximize effectiveness. Crucially, select REAL, anatomically effective exercises (e.g. compound lifts, functional cardio, mobility flows). Do NOT generate placeholder or excessively lightweight routines like "Deep Breathing" unless it is explicitly requested or specifically for a designated recovery day. Explain why the exercise is tailored for them in the notes.

LANGUAGE INSTRUCTION: Use friendly, accessible, supportive, and peaceful language. The tone should be welcoming. ABSOLUTELY DO NOT use aggressive or intense words such as "ultimate", "hardcore", "shred", "core", "extreme", "beast", or "punishing". Keep everything positive and easy to understand.

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
- Design a scalable, ongoing training protocol. Phrase the duration and overview to emphasize continuous progression rather than a terminal, finite plan.
- Implement an adaptive 4-week periodization cycle that loops and scales:
  - Week 1: Foundation / Recalibration (Focus on form, baseline metrics).
  - Week 2: Build (Increased volume, progressive overload).
  - Week 3: Peak (Highest intensity, pushing limits safely).
  - Week 4: Deload (Reduced volume by 40% for recovery before entering the next, harder cycle).
- weeklyPlan MUST contain exactly 7 distinct days (e.g., Day 1 to Day 7).
- Access the user biometrics (height, weight, age) provided to tailor the intensity.
- ABSOLUTELY NO generic placeholders like "Recovery" or "Deep Breathing" unless it is specifically a rest day.
- Ensure durationSeconds is accurately calculated for the intensity level of each specific exercise.

Generate JSON only, no extra text.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    const rawJson = await parseJsonWithRepair(text);
    return WorkoutPlanSchema.parse(rawJson);
  } catch (error) {
    console.error("CRITICAL: Workout Plan Validation Failed. Falling back to Safety Protocol.");
    console.error("Raw AI Output:", text);
    if (error instanceof z.ZodError) {
      console.error("Validation Errors:", JSON.stringify(error.issues, null, 2));
    }

    // High-Fidelity fallback: return a realistic 7-day strength & conditioning plan instead of "Deep Breathing"
    const fallbackDay = (name: string, focus: string) => ({
      day: name,
      focus: focus,
      exercises: [
        {
          name: "Pushups (Tempo)",
          reps: "3 sets of 12-15",
          sets: 3,
          durationSeconds: 45,
          rest: "60s",
          notes: "Focus on slow eccentric (3 seconds down).",
          steps: ["Plank position", "Lower slowly", "Explode up"]
        },
        {
          name: "Bodyweight Squats",
          reps: "3 sets of 20",
          sets: 3,
          durationSeconds: 45,
          rest: "60s",
          notes: "Keep chest up and weight on heels.",
          steps: ["Feet shoulder width", "Hips back", "Drive up"]
        },
        {
          name: "Plank Hold",
          reps: "3 sets of 45s",
          sets: 3,
          durationSeconds: 45,
          rest: "45s",
          notes: "Engage core and glutes. Neutral spine.",
          steps: ["Forearms on floor", "Body straight", "Hold steady"]
        }
      ]
    });

    return {
      planName: "Foundation Strength Protocol",
      duration: "4 weeks",
      overview: "A balanced, high-fidelity corrective plan focusing on fundamental movement patterns and metabolic conditioning.",
      phases: [{
        name: "General Physical Preparedness",
        duration: "4 weeks",
        focus: "Foundation",
        exercises: fallbackDay("Day 1", "Full Body").exercises
      }],
      weeklyPlan: [
        fallbackDay("Day 1", "Full Body Strength"),
        fallbackDay("Day 2", "Core & Cardio"),
        fallbackDay("Day 3", "Active Recovery"),
        fallbackDay("Day 4", "Lower Body Focus"),
        fallbackDay("Day 5", "Upper Body Focus"),
        fallbackDay("Day 6", "Full Body Hypertrophy"),
        fallbackDay("Day 7", "Rest & Reset")
      ]
    };
  }
}

export async function generatePlanOverview(
  goal: string,
  mode: "active" | "intermediate" | "locked-in",
  userContext?: {
    age?: number;
    height?: number;
    weight?: number;
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

LANGUAGE INSTRUCTION: Use friendly, accessible, supportive, and peaceful language. The tone should be welcoming. ABSOLUTELY DO NOT use aggressive or intense words such as "ultimate", "hardcore", "shred", "core", "extreme", "beast", or "punishing". Keep everything positive and easy to understand.

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
    const rawJson = await parseJsonWithRepair(text);
    return WorkoutPlanSchema.pick({
      planName: true,
      duration: true,
      overview: true,
      phases: true,
      nutritionGuidance: true,
      expectedResults: true
    }).parse(rawJson);
  } catch (error) {
    console.error("Failed to parse or validate plan overview:", text);
    return {
      planName: "Adaptive Fitness Plan",
      duration: "4 weeks",
      overview: "A personalized fitness journey focused on your specific goals.",
      phases: [],
      nutritionGuidance: "Focus on whole foods and hydration.",
      expectedResults: "Improved stamina and strength."
    };
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
    const rawJson = await parseJsonWithRepair(text);
    return z.object({ weeklyPlan: z.array(DayPlanSchema) }).parse(rawJson);
  } catch (error) {
    console.error("Failed to parse or validate weekly plan:", text);
    return {
      weeklyPlan: Array(7).fill({
        day: "Day",
        focus: "General Fitness",
        exercises: []
      }).map((d, i) => ({ ...d, day: `Day ${i + 1}` }))
    };
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
    const rawJson = await parseJsonWithRepair(text);
    return z.object({ monthlyPlan: z.array(WeekPlanSchema) }).parse(rawJson);
  } catch (error) {
    console.error("Failed to parse or validate monthly plan:", text);
    return { monthlyPlan: [] };
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

export const DietPlanSchema = z.object({
  planName: z.string(),
  dailyCalories: z.number(),
  macroTargets: z.object({
    protein: z.number(),
    carbs: z.number(),
    fats: z.number()
  }),
  meals: z.array(z.object({
    type: z.string(), // Breakfast, Lunch, Dinner, Snack
    name: z.string(),
    description: z.string(),
    calories: z.number(),
    macros: z.object({ protein: z.number(), carbs: z.number(), fats: z.number() }),
    ingredients: z.array(z.string()),
    prepInstructions: z.array(z.string()).optional()
  })),
  shoppingList: z.array(z.string()),
  hydrationGoal: z.string()
});

export async function generateDietPlan(
  goal: string,
  mode: string,
  preferences: {
    dietType: string;
    allergies: string;
    fridgeIngredients: string;
  },
  userContext?: { age?: number; height?: number; weight?: number; }
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a world-class AI nutritionist. Create a personalized daily meal plan based on the user's goals, stats, and available ingredients.

USER GOAL: ${goal}
INTENSITY MODE: ${mode}
${userContext?.weight ? "Weight: " + userContext.weight + " kg" : ""}
${userContext?.height ? "Height: " + userContext.height + " cm" : ""}

DIETARY PREFERENCES: ${preferences.dietType}
ALLERGIES/RESTRICTIONS: ${preferences.allergies || "None"}
AVAILABLE INGREDIENTS (try to use these): ${preferences.fridgeIngredients || "None specified, generate a full shopping list"}

Generate a detailed 1-day meal plan that hits the optimal macros for their goal.
If they specified "Available Ingredients", prioritize using those items in the recipes.

JSON Output format:
{
  "planName": "string",
  "dailyCalories": 2000,
  "macroTargets": { "protein": 150, "carbs": 200, "fats": 60 },
  "meals": [
    {
      "type": "string (e.g. Breakfast, Lunch, Snack, Dinner)",
      "name": "string",
      "description": "string",
      "calories": 500,
      "macros": { "protein": 30, "carbs": 40, "fats": 15 },
      "ingredients": ["1 cup oats", "etc"],
      "prepInstructions": ["Step 1", "Step 2"]
    }
  ],
  "shoppingList": ["Items needed that aren't in their available ingredients"],
  "hydrationGoal": "string"
}

Generate JSON ONLY. Valid JSON structure conforming exactly to the keys shown.`;

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text();

  try {
    const rawJson = await parseJsonWithRepair(text);
    return DietPlanSchema.parse(rawJson);
  } catch (error) {
    console.error("Failed to parse diet plan:", text, error);
    throw new Error("Failed to generate diet plan");
  }
}
