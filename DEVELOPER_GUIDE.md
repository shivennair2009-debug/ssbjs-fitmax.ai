# FitMax AI - Developer Quick Reference

## Quick Start

### 1. Set Your Gemini API Key
In `.env.local`:
```
GEMINI_API_KEY=your_key_from_aistudio.google.com
```

### 2. Start the App
```bash
npm run dev
```

### 3. Access at
- http://localhost:3000 (if available)
- http://localhost:3001 (if port 3000 is in use)

---

## Using AI Features in Your Code

### Generate a Workout Plan (Frontend)
```typescript
// From any component
const response = await fetch("/api/generate-plan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    goal: "Lose weight and improve stamina",
    mode: "intermediate",
    userContext: {
      age: 30,
      fitnessLevel: "beginner",
      daysPerWeek: 4
    }
  })
});

const plan = await response.json();
console.log(plan.planName);
console.log(plan.overview);
```

### Get AI Coaching Cues (Frontend)
```typescript
const response = await fetch("/api/generate-coaching", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    exerciseName: "Squats",
    currentReps: 12,
    userFeedback: "Knees feeling strain"
  })
});

const { coachingCue } = await response.json();
console.log(coachingCue); // e.g., "Keep knees behind toes!"
```

### Get Nutrition Plan (Frontend)
```typescript
const response = await fetch("/api/generate-diet", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    goal: "Build muscle",
    mode: "locked-in",
    preferences: {
      dietType: "high-protein",
      restrictions: ["dairy-free"],
      mealsPerDay: 5
    }
  })
});

const diet = await response.json();
console.log(diet.dailyCalories); // e.g., 2500
console.log(diet.macroBreakdown); // e.g., { protein: "40%", carbs: "35%", fats: "25%" }
```

### Analyze Progress (Frontend)
```typescript
const response = await fetch("/api/analyze-progress", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    goal: "Run a marathon",
    currentStats: {
      workoutsCompleted: 20,
      daysTracked: 60,
      averageAdherence: 92
    }
  })
});

const analysis = await response.json();
console.log(analysis.progressSummary);
console.log(analysis.nextSteps); // Array of recommendations
```

### Adapt Workout (Frontend)
```typescript
const response = await fetch("/api/adapt-workout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    currentExercise: "Pull-ups",
    feedback: "Cannot complete full range",
    mode: "intermediate"
  })
});

const adaptation = await response.json();
if (adaptation.shouldModify) {
  console.log(adaptation.suggestion); // e.g., "Try assisted pull-ups"
  console.log(adaptation.alternatives); // Array of alternative exercises
}
```

---

## Direct Backend Usage (Rare)

If you need to call Gemini functions directly in a server component:

```typescript
import { generateWorkoutPlan } from "@/lib/gemini";

// Server component or API route
const plan = await generateWorkoutPlan("Lose fat and build muscle", "locked-in", {
  age: 25,
  fitnessLevel: "advanced",
  daysPerWeek: 6
});
```

---

## Common Patterns

### Loading States
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchPlan = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const res = await fetch("/api/generate-plan", { /* ... */ });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setIsLoading(false);
  }
};
```

### Storing Plan in LocalStorage
```typescript
// Save after generation
if (typeof window !== "undefined") {
  localStorage.setItem("currentWorkoutPlan", JSON.stringify(plan));
  localStorage.setItem("fitnessGoal", goal);
  localStorage.setItem("fitnessMode", mode);
}

// Load when needed
const savedPlan = localStorage.getItem("currentWorkoutPlan");
if (savedPlan) {
  const plan = JSON.parse(savedPlan);
  // Use plan data
}
```

### Error Handling
```typescript
try {
  const response = await fetch("/api/generate-plan", options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }
  
  return await response.json();
} catch (error) {
  if (error instanceof Error) {
    console.error("API Error:", error.message);
    // Check if it's an API key issue
    if (error.message.includes("API")) {
      return showAPIKeySetupGuide();
    }
  }
}
```

---

## Types Available

```typescript
import type {
  WorkoutPlan,
  Phase,
  ExerciseDetail,
  DietPlan,
  Meal,
  FitnessProgress,
  WorkoutAdaptation,
  FitnessMode
} from "@/types/fitness";

// Usage in components
const plan: WorkoutPlan = await fetch(...).then(r => r.json());
const mode: FitnessMode = "locked-in";
```

---

## Debug Tips

### Check API is Working
```bash
# Test workout plan generation
curl -X POST http://localhost:3000/api/generate-plan \
  -H "Content-Type: application/json" \
  -d '{"goal":"Test","mode":"active"}'
```

### Check API Key
```bash
# Verify env var is loaded (in Next.js API routes)
console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
```

### Monitor API Calls
- Open browser DevTools → Network tab
- Look for `/api/*` requests
- Check response status and payload

### Common Issues
1. **401/403 Error**: Invalid or missing API key
2. **Rate Limited**: Too many requests - check quota at ai.google.dev
3. **CORS Error**: Should not happen with API routes - clear browser cache
4. **Timeout**: Gemini might be slow - increase timeout or optimize prompts

---

## Customizing AI Behavior

### Adjust Model
In `lib/gemini.ts`, change `model: "gemini-pro"` to other available models:
```typescript
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
```

### Tweak Prompts
Edit the prompt templates in `lib/gemini.ts` functions to change AI behavior:
```typescript
const prompt = `You are a fitness coach...`; // Modify this
```

### Adjust Generation Settings
```typescript
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.7, // 0-2 (higher = more creative)
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  }
});
```

---

## Performance Optimization

### Caching Plans
```typescript
// Cache generated plans to avoid regenerating
const planCache = new Map<string, WorkoutPlan>();

const getPlan = async (goal: string, mode: string) => {
  const key = `${goal}-${mode}`;
  if (planCache.has(key)) return planCache.get(key);
  
  const plan = await generatePlan(goal, mode);
  planCache.set(key, plan);
  return plan;
};
```

### Rate Limiting Coaching
The app generates coaching every 20 seconds. Adjust in `WorkoutSession.tsx`:
```typescript
const interval = setInterval(generateCue, 20000); // Change 20000 to desired ms
```

---

## Next Phase Features

These are ready to be implemented:
- [ ] Real-time video form checking (add computer vision)
- [ ] Heart rate and biometric integration
- [ ] Social challenges and leaderboards
- [ ] Advanced progress visualizations
- [ ] Voice-based coaching (integrate with Web Audio API)
- [ ] Mobile app version
- [ ] Offline mode with local plan caching
- [ ] Integration with fitness tracking apps (Apple Health, Google Fit)

---

**Questions?** Check `AI_SETUP.md` or `IMPLEMENTATION_SUMMARY.md` for more details.
