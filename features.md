# Maí Greifinn - Implemented Features

## Core Structure
- Two eras selectable at start: `1920` and `2020`.
- Two game modes: `TYCOON` and `BOARD`.
- Mode selection screen between era selection and gameplay.
- Shared wrapper that applies era-based theming and optional AI-generated background.

## AI / Integrations
- AI key connect flow via `window.aistudio.openSelectKey()`.
- API key presence check via `window.aistudio.hasSelectedApiKey()`.
- AI-generated background image using Gemini image model (`gemini-3-pro-image-preview`).
- AI-generated names for the 3 board-mode opponents using Gemini text model (`gemini-3-flash-preview`) with JSON schema output.

## Tycoon Mode (`Útgerðarstjórn`)
- Starting cash: `500,000`.
- Seasonal calendar progression: `Vor`, `Sumar`, `Haust`, `Vetur`.
- Year initialized from selected era and advances after full season cycle.
- HQ view with:
- Fleet panel.
- Money display.
- Action to open ship market.
- Logbook panel for game events.
- Ship market with 4 predefined ship models and buy action.
- Purchased ships get:
- Unique runtime id.
- Randomized Icelandic ship name + numeric suffix.
- Type, condition (100), equipment flag.
- Fishing trip per owned ship.
- Ship condition gate: cannot fish if condition < 20.
- Fishing minigame:
- 3x3 hidden tile grid.
- Tile outcomes: `FISH`, `BIG_CATCH`, `DANGER`, `EMPTY`.
- Catch value tracking.
- DANGER penalties:
- Immediate catch reduction.
- Ship condition damage.
- End-trip settlement:
- Adds trip earnings to money.
- Applies additional ship wear.
- Logs outcome.
- Advances season/year.

## Board Mode (`Spilaborð`)
- 20-space board generated at runtime.
- Space types implemented:
- `START` (index 0)
- `CHANCE` (index 5)
- `FISHING` (index 10)
- `TAX` (index 15)
- `PROPERTY` (all other spaces)
- Property pricing/rent model:
- Price: `50,000 + index * 10,000`.
- Rent: `10%` of property price.
- 4 players initialized:
- 1 human player.
- 3 AI players with strategies: `AGGRESSIVE`, `CONSERVATIVE`, `AFK`.
- Turn system with active-player rotation.
- Dice roll (`1-6`) with rolling state.
- Movement around looped board.
- Passing `START` grants `20,000`.
- Property purchase system:
- Human purchase modal (buy/skip).
- AI auto-buy logic with strategy-specific behavior (AFK often skips).
- Ownership tracking by `ownerId`.
- Rent transfer when landing on another player's property.
- Tax tile effect: `-10,000`.
- Fishing tile effect:
- Human enters fishing minigame overlay.
- AI gets random catch payout.
- Board-mode fishing minigame:
- 3x3 tile reveal.
- Outcomes include fish/empty/danger style effects.
- Catch applied to current fishing player on landing.
- Weekly progression:
- Turn counter shown as week.
- Every full round updates week.
- Every 4th week:
- Year increments.
- Market trend randomizes (`BULL` or `BEAR`).
- News headline rotates from predefined pool.
- Sidebar UI on desktop:
- Player list with active indicator.
- Compact event log.

## UI / Presentation
- Era-specific visual themes (`theme-vintage`, `theme-modern`).
- Distinct entry screens:
- API connect gate.
- World generation loading state.
- Era split screen.
- Game mode selection.
- Reusable iconography with `lucide-react`.
- Exit/back navigation from each game mode to mode select.

## History Audit: Overwritten / Removed Features

### Removed from earlier `index.tsx` revisions
- A prior board design with 16 spaces and types like `BOAT`, `RESTAURANT`, `STORM`, `JAIL` (seen in `0c2119b`).
- Hunger/survival loop (`hunger`, starvation penalty, restaurant recovery).
- Per-space AI asset generation (`generatePropertyImage`) for board spaces.
- AI-generated chance card event system with structured JSON + generated event art (`triggerChanceEvent`).
- Bilingual UI layer (`IS`/`EN` translation map) present in earlier revisions.
- A `1960`-theme development phase (mentioned in commit history) that is not in current era options.
- Management sub-view (`MANAGE`) with captain hiring and captain-based rent multipliers (seen in `2c1b260`).
- Weekly newspaper modal with AI-generated long-form headline/body (`fetchAiNews` + modal flow).

### Removed from repository history (non-frontend simulation)
- Commit `834f6d1` removed a large `import/` codebase (9,842 deletions) including Python simulation systems and design docs.
- Deleted modules included systems such as dynasty/succession, health/nutrition, economy/events/politics/scandal, and extensive roadmap/design documentation.
- Historical note from deleted docs (`import/NEW_FEATURES_SUMMARY.md`): explicit warning that a main `game.py` had previously been overwritten by an older prototype.
