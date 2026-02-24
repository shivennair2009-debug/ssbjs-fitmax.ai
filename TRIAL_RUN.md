# How to Trial Run FitMax AI on Your Phone

You can test your app on a phone using two main methods.

## Method 1: Local Network (Fastest)

If your phone and Mac are on the same Wi-Fi:

1.  **Find your IP address**: I found yours is `192.168.1.138`.
2.  **Run the app**: Make sure `npm run dev` is running on your Mac.
3.  **Open on Phone**: Open Safari or Chrome on your phone and go to:
    `http://192.168.1.138:3002` (the current dev port).
4.  **Add to Home Screen**: For the best "app" experience, tap the **Share** button in Safari and select **"Add to Home Screen"**.

## Method 2: Vercel (Professional & Remote)

This makes the app accessible anywhere in the world and handles the mobile experience perfectly.

1.  Go to [Vercel.com](https://vercel.com) and sign in with your GitHub.
2.  Click **"Add New"** > **"Project"**.
3.  Import your `FITMAX-AI` repository.
4.  **CRITICAL**: Under **"Environment Variables"**, add:
    *   **Key**: `GEMINI_API_KEY`
    *   **Value**: (Paste your Gemini API Key)
5.  Click **"Deploy"**.
6.  Once finished, Vercel will give you a public URL (e.g., `fitmax-ai.vercel.app`) that you can open on any phone!

## Pro Tip: PWA Experience
Since we've simplified the UI for mobile-only, it will feel like a native app once "Added to Home Screen".
