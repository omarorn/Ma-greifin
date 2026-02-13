# Repository Guidelines

## Project Structure & Module Organization
This is a lightweight Vite + React + TypeScript app with a mostly flat layout.

- `index.tsx`: main app logic, game state, and UI components.
- `index.html`: host page, import map, Tailwind CDN, and theme CSS.
- `vite.config.ts`: dev server and env wiring.
- `tsconfig.json`: TypeScript compiler configuration.
- `features.md`, `gameplay.md`, `history_features.md`: gameplay and product notes.

There is currently no `src/` or `tests/` directory; most behavior lives in `index.tsx`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local dev server (Vite, port 3000).
- `npm run build`: create production bundle; use as the primary validation step.
- `npm run preview`: serve the built app locally for quick smoke checks.

Example flow:
```bash
npm install
npm run build
npm run dev
```

## Coding Style & Naming Conventions
- Language: TypeScript + React function components/hooks.
- Indentation: follow existing file style (4 spaces in current code).
- Naming:
- `PascalCase` for components and type/interface names (`TycoonGame`, `LogEntry`).
- `camelCase` for variables/functions (`startFishing`, `seasonIndex`).
- `UPPER_SNAKE_CASE` for shared constants (`START_MONEY`).
- Keep gameplay labels and domain text consistent with existing Icelandic terminology unless a task requires localization changes.

No lint/formatter scripts are configured; keep edits small and consistent with surrounding code.

## Testing Guidelines
No automated test framework is configured yet. Until one is added:
- run `npm run build` for type/bundle verification;
- manually test affected gameplay flows in `npm run dev` (era select, mode select, core turn/fishing actions).

If adding tests, place them under a new `tests/` directory and use `*.test.ts` / `*.test.tsx` naming.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit-style prefixes (for example `feat:` and `refactor:`). Follow:
- `feat: ...` for user-visible functionality;
- `fix: ...` for bug fixes;
- `refactor: ...` for internal restructures.

PRs should include:
- concise change summary;
- risk/impact notes for gameplay balance or UI behavior;
- screenshots or short clips for UI changes;
- linked issue/task when available.

## Security & Configuration Tips
Set `GEMINI_API_KEY` in `.env.local` for AI features. Never commit secrets or `.env.local` contents.

## Agent-Specific Instructions
- Always use Serena tools first for repository help, project context, and code understanding.
- Always use Context7 for library/framework documentation lookup and search.
- If either tool cannot provide the needed answer, state the gap and then use the next best fallback.
