# Maí Greifinn - History Features Audit

## Scope
Inspected repositories:
- `/home/claude/Documents/GitHub/Ma-greifin` (current repo)
- `/home/claude/Documents/GitHub/maigreifinn` (Python simulation branch/repo)
- `/home/claude/Documents/GitHub/maigreifin2` (TypeScript refactor + mixed workspace)

Purpose:
- Identify feature history.
- Flag implemented features that were later overwritten/removed.
- Capture additional features that exist in sibling repos but not in current `Ma-greifin`.

---

## A. Timeline - Current Repo (`Ma-greifin`)

### `f0678de` - Initialize app
- Initial web app scaffold (`index.tsx`, Vite config, metadata).

### `5eb71ba` - Boat types and market mechanics
- Added early boat/market-focused gameplay iteration.

### `0c2119b` - AI assets for board spaces
- Added AI image + Icelandic description generation for board spaces.
- Added AI-generated chance event flow (structured JSON + generated event image).
- Included older board model with `BOAT/RESTAURANT/STORM/JAIL` space taxonomy.
- Included hunger/survival variables and related penalties/recovery.

### `70efd13` / `ac053e7` / `2c1b260` era
- Added/expanded:
- Newspaper flow with AI-generated weekly news modal.
- Management view (`MANAGE`) with captain hiring.
- Captain skill rent multipliers.
- Extended navigation and UI game views.
- `2c1b260` also mentions 1960s theme phase in commit message.

### `e4718fc` / `bbaaf43` / `324a170` / `ab78498`
- Mostly icon/name/UI refactors and content expansions.

### `834f6d1` - Major removal event
- Removed large historical `import/` tree (9,842 deletions).
- Deleted Python gameplay systems and extensive design/docs snapshot.

---

## B. Overwritten/Removed Features In `Ma-greifin`

### Removed from frontend `index.tsx` evolution
- 16-space board variant with `BOAT/RESTAURANT/STORM/JAIL`.
- Hunger and starvation pressure loop.
- AI chance-event modal with generated event art.
- AI-generated per-property art/description pipeline for board spaces.
- Bilingual layer (`IS`/`EN`) in earlier iteration.
- Management mode with captain hiring and rent boosts.
- AI newspaper modal generation workflow.
- 1960-theme development branch/state.

### Removed from repository content
- Entire Python simulation/doc stack under historical `import/` path:
- Dynasty/succession systems.
- Health/nutrition systems.
- Economy/events/politics/scandal modules.
- Historical timeline and roadmap docs.

---

## C. Additional Features Found In `/maigreifinn` (Python)

Evidence files:
- `/home/claude/Documents/GitHub/maigreifinn/src/game_final.py`
- `/home/claude/Documents/GitHub/maigreifinn/src/togaraveldi/config.py`
- `/home/claude/Documents/GitHub/maigreifinn/src/togaraveldi/events.py`
- `/home/claude/Documents/GitHub/maigreifinn/docs/FINAL_GAME_COMPLETE.md`

Implemented systems visible in code/docs:
- Multi-generation dynasty + succession mechanics (`secure_heir`, succession conflict outcomes).
- Inheritance tax and lineage continuation/game-over if no heir.
- Historical event timeline (independence, cod war, bank collapse, etc.).
- Inflation system with era-based rates and crisis overrides.
- Health and nutrition mechanics (B12 depletion, scurvy thresholds, doctor visits).
- Dynamic demand and fish availability migration logic.
- COVID event with pandemic investment payoff.
- Random ancestral/conspiracy events.

Status relative to current repo:
- These systems are **not present** in current `Ma-greifin/index.tsx`.

---

## D. Additional Features Found In `/maigreifin2` (TypeScript)

Evidence files:
- `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx`
- `/home/claude/Documents/GitHub/maigreifin2/BoardGame.tsx`
- `/home/claude/Documents/GitHub/maigreifin2/index.tsx`

Notable gameplay features beyond current `Ma-greifin`:
- Modular split into `TycoonGame.tsx` + `BoardGame.tsx` + shared types/constants.
- Tycoon ship upgrade workflow:
- Repair action with condition-based cost.
- Cargo capacity upgrade affecting fishing payout multiplier.
- Sonar equipment purchase affecting fish/big-catch probabilities.
- Upgrade modal UI for each ship.

Status relative to current repo:
- These upgrade mechanics are **not implemented** in current `Ma-greifin/index.tsx`.

Note:
- `maigreifin2` also contains many unrelated modules/scripts (logistics/CMS/template assets), so only game files were considered for this audit.

---

## E. Practical Recovery Candidates

High-value features to reintroduce into current `Ma-greifin`:
1. Tycoon ship upgrades (repair/capacity/sonar) from `maigreifin2`.
2. AI chance events + event modal from `0c2119b` lineage.
3. Captain management/rent multipliers from `2c1b260` lineage.
4. Optional advanced simulation bridge from `maigreifinn` (dynasty/inflation/health) if moving beyond arcade board gameplay.
