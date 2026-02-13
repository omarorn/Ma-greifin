# Style and Conventions

## Language and framework
- TypeScript + React (function components, hooks-heavy style).
- ESM modules (`"type": "module"`).

## Code conventions observed
- Uses `const` broadly for immutable values.
- Uses explicit TS types/interfaces for game entities and state-related shapes.
- Component/style naming is descriptive and domain-oriented (e.g., `TycoonGame`, `LogEntry`, `FishingTile`).
- Large in-file constant tables for content (ship names, events, etc.).
- Tailwind utility classes are used directly in JSX; theme-specific CSS classes are declared in `index.html`.

## UI/theming conventions
- Two main theme roots: `.theme-vintage` and `.theme-modern`.
- Reusable class names for surface/components: `paper-card`, `btn-paper`, `bg-header`, `text-accent`, `text-money`.

## Editing guidance for this repo
- Keep gameplay behavior changes explicit and small; this project has frequent rule-set iteration.
- Prefer preserving Icelandic labels/text already used in UI unless a task explicitly requires localization changes.
- If adding major features, consider extracting modules from `index.tsx` incrementally to avoid regressions.