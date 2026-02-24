# FitMax AI
<!-- deployment-trigger: final-build-v1 -->

FitMax AI is a mobile-first, personal fitness assistant powered by Gemini AI. It provides personalized workout plans, real-time coaching, and meal analysis with a simple, user-friendly interface.

## Features

- **Mobile-First Interface**: Optimized for mobile devices with a clean, focused UI.
- **AI Coaching**: Powered by `gemini-2.5-flash-lite` for high-quality workout generation and cues.
- **Step-by-Step Instructions**: Every exercise includes clear, easy-to-follow steps.
- **Meal Analysis**: Analyze your meals to keep track of your nutrition.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd FitMax-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Built With

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide React](https://lucide.dev/)
- [Google Generative AI SDK](https://github.com/google/generative-ai-js)
