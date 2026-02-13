# Codebase Structure

- `index.tsx`: Main application logic, UI state, game rules, and React component tree.
- `index.html`: Host page, import map, Tailwind CDN include, and large theme/style definitions.
- `vite.config.ts`: Vite dev server config, React plugin, env key injection, alias `@ -> .`.
- `tsconfig.json`: TypeScript compiler options (bundler resolution, `react-jsx`, no emit).
- `package.json`: npm scripts and dependency declarations.
- `README.md`: Local run instructions and key prerequisites.
- `features.md`, `gameplay.md`, `history_features.md`: Product/design notes and feature history.

## Architectural notes
- Current code is effectively a single-file app for gameplay (`index.tsx`) with substantial inline constants/types/components.
- Styling is mostly defined in `index.html` style blocks plus Tailwind utility classes in JSX.
- Project is not split into `src/` modules yet; refactors should preserve behavior while extracting cohesive units.