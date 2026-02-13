# Suggested Commands

## Setup and run
- `npm install` : Install dependencies.
- `npm run dev` : Start Vite dev server (configured for host `0.0.0.0`, port `3000`).
- `npm run build` : Build production bundle.
- `npm run preview` : Preview production build locally.

## Environment
- Create/configure `.env.local` with:
  - `GEMINI_API_KEY=<your_key>`

## Quality checks
- No dedicated lint/test scripts are currently defined in `package.json`.
- Minimum verification after changes:
  - `npm run build` (type/bundle sanity)
  - Manual gameplay smoke test in browser via `npm run dev`

## Useful Linux/project commands
- `git status`
- `git diff`
- `ls -la`
- `cd <path>`
- `rg "<pattern>"`
- `find . -maxdepth 3 -type f`
- `cat <file>` / `sed -n '1,200p' <file>`