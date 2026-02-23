# FitMax AI - AI-Powered Fitness Application

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### 2. Configure Environment Variables

Create/update the `.env.local` file in the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace `your_gemini_api_key_here` with your actual API key from step 1.

### 3. Install Dependencies

Dependencies are already installed via npm. The key package added is:
- `@google/generative-ai` - Google's Generative AI SDK for Gemini

## Features

### AI-Powered Workout Planning
- Users input their fitness goal
- AI analyzes the goal and generates a personalized workout plan
- Plans are tailored to the selected intensity mode (Active, Intermediate, Locked-In)

### Real-Time Coaching
- During workout sessions, the AI provides real-time coaching cues
- Coaching is generated dynamically based on the exercise being performed
- Voice indicators show when AI coaching is active

### Personalized Nutrition Plans
- AI generates diet recommendations based on fitness goals
- Includes macro breakdowns and sample meal plans
- Customizable based on dietary preferences

### Progress Analysis
- AI analyzes workout adherence and progress
- Provides insights on strengths and areas for improvement
- Suggests next steps for continued progress

### Adaptive Workout Modifications
- AI can suggest exercise modifications in real-time
- Provides alternatives if an exercise isn't suitable
- Helps prevent plateaus by suggesting variation

## API Routes

### `/api/generate-plan` (POST)
Generates a personalized workout plan
```json
{
  "goal": "Lose belly fat and tone up",
  "mode": "intermediate",
  "userContext": {
    "age": 28,
    "fitnessLevel": "intermediate",
    "daysPerWeek": 4
  }
}
```

### `/api/generate-coaching` (POST)
Generates real-time coaching cues
```json
{
  "exerciseName": "Push-ups",
  "currentReps": 10,
  "userFeedback": "Feeling good"
}
```

### `/api/generate-diet` (POST)
Generates personalized nutrition plans
```json
{
  "goal": "Build muscle",
  "mode": "locked-in",
  "preferences": {
    "dietType": "high-protein",
    "restrictions": ["vegetarian"]
  }
}
```

### `/api/analyze-progress` (POST)
Analyzes fitness progress
```json
{
  "goal": "Lose weight",
  "currentStats": {
    "workoutsCompleted": 12,
    "daysTracked": 30,
    "averageAdherence": 85
  }
}
```

### `/api/adapt-workout` (POST)
Suggests workout modifications
```json
{
  "currentExercise": "Squats",
  "feedback": "Knee pain",
  "mode": "intermediate"
}
```

## Running the Application

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Workflow

1. **Onboarding**: User enters fitness goal → AI generates personalized plan
2. **Mode Selection**: User selects intensity level (influences plan and coaching)
3. **Plan Preview**: AI-generated plan is displayed with key insights
4. **Workout Session**: User performs exercises with AI coaching cues
5. **Dashboard**: Track progress, adjust diet, monitor metrics
6. **Continuous Loop**: AI adapts based on performance and feedback

## Technologies Used

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **AI**: Google Gemini API (via @google/generative-ai)
- **Styling**: Tailwind CSS with custom design system

## Troubleshooting

### API Key Error
If you see "Failed to generate workout plan" or similar errors:
1. Verify your API key is correct in `.env.local`
2. Check that the key has not been revoked in Google AI Studio
3. Ensure the file is saved and the dev server was restarted after updating

### CORS Issues
The application uses server-side API routes, so CORS should not be an issue

### Model Not Available
If certain Gemini models are not available:
- The library defaults to `gemini-pro`
- Check Google AI Studio for available models
- Update the model name in `lib/gemini.ts` if needed

## Future Enhancements

- Video form checking with computer vision
- Biometric integration (heart rate, sleep, etc.)
- Social features and challenges
- Advanced progress analytics
- Voice-based coaching integration
- Mobile app
