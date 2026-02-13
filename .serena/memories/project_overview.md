# Project Overview

- Name: Maí Greifinn
- Purpose: A React + TypeScript fishing/business game inspired by Sægreifinn, with two eras (1920/2020), two game modes (Tycoon and Board), and some Gemini-powered AI-generated assets/content.
- Runtime model: Single-page app mounted from `index.tsx` into `index.html`.
- AI integration: Uses `@google/genai` and `GEMINI_API_KEY` for generated background imagery and some generated in-game content.

## Main user flow
1. Connect/select API key when required.
2. Choose era (1920 or 2020).
3. Choose mode (Tycoon or Board).
4. Play continuous simulation loops (no hard-coded win condition at present).