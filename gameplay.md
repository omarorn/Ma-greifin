# Maí Greifinn - Gameplay (As Implemented)

## 1. Startup Flow
1. Launch app.
2. If no AI key is selected, player is shown a connect screen.
3. After key connect, app generates a background image once.
4. Player chooses era: `1920` or `2020`.
5. Player chooses mode: `Útgerðarstjórn` (Tycoon) or `Spilaborð` (Board).

## 2. Tycoon Mode Loop (`Útgerðarstjórn`)
1. Start with `500,000` kr.
2. In HQ, player manages money, fleet, and logbook.
3. Player buys ships from the market if affordable.
4. Player selects an owned ship and starts a fishing trip.
5. Fishing trip uses a 3x3 hidden grid:
- Reveal tiles to collect positive catch values.
- Danger tiles reduce catch and damage ship condition.
6. Player ends trip with `Landa & Heim`.
7. Catch total is added to treasury.
8. Selected ship loses condition from usage.
9. Time advances by one season; after winter, year increases.
10. Loop continues from HQ.

## 3. Board Mode Loop (`Spilaborð`)
1. Board initializes with 20 spaces and 4 players (1 human + 3 AI).
2. On each turn, active player rolls a 1-6 die.
3. Player moves forward and wraps around the board.
4. Passing start gives `+20,000` kr.
5. Landing outcomes:
- `PROPERTY`:
- If unowned:
- Human gets buy/skip modal.
- AI may buy based on strategy and funds.
- If owned by another player:
- Active player pays rent to owner.
- `FISHING`:
- Human plays fishing minigame overlay and banks result.
- AI gets random fishing payout.
- `TAX`:
- Active player pays `10,000` kr.
- `START` / `CHANCE`:
- No extra coded effect beyond landing log and turn progression.
6. Turn passes to next player.
7. Each completed full rotation of players increments week count.
8. Every 4th week:
- Year increments.
- Market trend updates (`BULL`/`BEAR`).
- News headline updates.
9. Loop continues indefinitely (no coded win condition).

## 4. Fishing Minigames
- Tycoon and Board each use a separate 3x3 reveal-based fishing minigame.
- Catch is accumulated during tile reveals and paid out on landing/end action.
- Empty tiles do nothing; danger tiles create negative outcomes.

## 5. Current End States / Limits
- No explicit victory condition, bankruptcy elimination, or game-over screen is implemented.
- Sessions continue until player exits back to menu.

## 6. History Audit: Gameplay That Existed Earlier
- Earlier board gameplay revisions used a different rule set (16-space loop with `BOAT/RESTAURANT/STORM/JAIL` tiles), then got replaced by the current 20-space `PROPERTY/FISHING/TAX` model.
- Earlier loop included hunger pressure and starvation penalties; this is no longer part of the live game loop.
- Earlier versions had AI-generated chance events with dedicated event modal flow; current board mode now uses simpler landing outcomes and static weekly news rotation.
- A management gameplay layer (captain hiring to boost rent) existed in earlier revisions and was removed in later rewrites.
- Historical Python gameplay simulation (dynasty, health, advanced events) was removed from the repository in commit `834f6d1`, so those loops are not playable in current frontend code.
