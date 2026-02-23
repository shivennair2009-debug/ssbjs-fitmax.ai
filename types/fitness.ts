export interface WorkoutPlan {
  planName: string;
  duration: string;
  overview: string;
  phases: Phase[];
  weeklyPlan: DailyPlan[];
  monthlyPlan: WeeklyPlan[];
  nutritionGuidance: string;
  expectedResults: string;
}

export interface Phase {
  name: string;
  duration: string;
  focus: string;
  exercises: ExerciseDetail[];
}

export interface ExerciseDetail {
  name: string;
  reps: string;
  sets: number;
  rest: string;
  notes: string;
}

export interface DailyPlan {
  day: string;
  focus: string;
  exercises: ExerciseDetail[];
}

export interface WeeklyPlan {
  week: string;
  days: DailyPlan[];
}

export interface DietPlan {
  dailyCalories: number;
  macroBreakdown: {
    protein: string;
    carbs: string;
    fats: string;
  };
  sampleMealPlan: Meal[];
  supplements: string[];
  hydration: string;
  tips: string[];
}

export interface Meal {
  meal: string;
  foods: string[];
  calories: number;
  macros: string;
}

export interface FitnessProgress {
  progressSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
  motivationalMessage: string;
}

export interface WorkoutAdaptation {
  shouldModify: boolean;
  reason: string;
  suggestion: string;
  alternatives: string[];
}

export type FitnessMode = "active" | "intermediate" | "locked-in";
