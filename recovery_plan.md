# Maí Greifinn - Recovery Plan (Detailed Inspection)

## 1. Inspection Coverage
Inspected codebases:
1. `/home/claude/Documents/GitHub/Ma-greifin` (current active game)
2. `/home/claude/Documents/GitHub/maigreifin2` (TypeScript split-components variant)
3. `/home/claude/Documents/GitHub/maigreifinn` (Python simulation engine and final CLI game)

Primary current integration targets:
1. `index.tsx:95` (`TycoonGame`)
2. `index.tsx:356` (`BoardGame`)
3. `index.tsx:698` (`App`)

---

## 2. Recovery Candidate Matrix

| Feature | Source (where implemented) | Current target | Port effort | Risk | Recommended |
|---|---|---|---|---|---|
| Tycoon ship repairs | `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx:45` `handleRepair` | `index.tsx:95` | Low | Low | Yes |
| Tycoon cargo capacity upgrades | `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx:56` `handleUpgradeCapacity` | `index.tsx:95` | Low | Low | Yes |
| Tycoon sonar equipment economy | `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx:67` `handleEquipSonar` | `index.tsx:95` | Low | Low | Yes |
| Tycoon upgrade modal UX | `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx:217` | `index.tsx:194` HQ view | Low | Low | Yes |
| Fishing payout scales with capacity | `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx:110` | `index.tsx:149` `fishTile` | Low | Low | Yes |
| AI chance event modal + AI art | `0c2119b:index.tsx` (`triggerChanceEvent`) | `index.tsx:492` `handleLand` for CHANCE | Medium | Medium | Yes |
| Per-property AI image+description | `0c2119b:index.tsx` (`generatePropertyImage`) | `index.tsx:379` board initialization + render | Medium | Medium | Optional |
| Captain system (hire + rent boost) | `2c1b260:index.tsx:249` `generateCaptains`, `:259` `hireCaptain`, `:329` `evaluateAIPurchase` | `index.tsx:356` `BoardGame` | Medium | Medium | Yes |
| AI weekly newspaper modal | `2c1b260:index.tsx:180` `fetchAiNews`, `:123` `showNewspaper` | `index.tsx:356` + header area | Medium | Medium | Optional |
| Hunger/storm/jail rule set | `0c2119b:index.tsx` legacy board model | conflicts with current board rules | High | High | No (unless full mode split) |
| Dynasty/succession (web port) | `/home/claude/Documents/GitHub/maigreifinn/src/game_final.py:551` `attempt_heir`, `:591` `trigger_succession_conflict` | new web game subsystem | High | High | Later |
| Inflation + historical events | `/home/claude/Documents/GitHub/maigreifinn/src/game_final.py:104` `apply_annual_inflation`, `:144` `check_historical_events` | board economy layer | High | High | Later |
| Health/B12 loop | `/home/claude/Documents/GitHub/maigreifinn/src/game_final.py:446` `process_health_degradation`, `:473` `visit_doctor` | both modes | High | High | Later |

---

## 3. Detailed Source Notes

## A. Current repo (`Ma-greifin`) constraints
1. Tycoon ship model currently lacks `capacity` field in `ShipItem` (`index.tsx:86`).
2. Tycoon fishing odds are static and only use `equipped` as display state (`index.tsx:128`, `index.tsx:235`).
3. Board CHANCE tile currently has no effect beyond turn progression (`index.tsx:389`, `index.tsx:535`).
4. Board has no property sub-management layer beyond ownership and rent (`index.tsx:540`).

## B. `maigreifin2` immediately reusable logic
1. `capacity` added to `ShipItem` in `/home/claude/Documents/GitHub/maigreifin2/types.ts:20`.
2. Upgrade actions are self-contained:
1. `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx:45`
2. `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx:56`
3. `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx:67`
3. Fishing economy hook is localized to tile reveal logic at `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx:102`.

## C. Historical `index.tsx` branches (commit snapshots)
1. `0c2119b` provides CHANCE event generation and per-space AI art generation with structured responses.
2. `2c1b260` provides captain layer + AI newspaper modal + improved AI buy evaluation.
3. These are closer to your current React architecture than Python systems and should be prioritized.

## D. `maigreifinn` (Python) portability reality
1. Strong mechanics exist, but data model and loop are CLI-centric.
2. Best use is design/spec extraction first, not direct code transplant.
3. Useful module anchors:
1. `/home/claude/Documents/GitHub/maigreifinn/src/togaraveldi/engine.py:49` (inflation framework)
2. `/home/claude/Documents/GitHub/maigreifinn/src/togaraveldi/events.py:18` (historical timeline data format)
3. `/home/claude/Documents/GitHub/maigreifinn/src/togaraveldi/models.py:22` (player fields for legacy systems)

---

## 4. Phase Plan

## Phase 1 (Fast Wins, Low Risk)
Goal: recover visible missing depth in Tycoon without destabilizing board logic.

Implementation set:
1. Add `capacity` to current `ShipItem` in `index.tsx`.
2. Extend purchase flow to set initial capacity from market model.
3. Port upgrade modal and actions:
1. Repair
2. Capacity upgrade
3. Sonar purchase
4. Port capacity multiplier in fishing payout.
5. Update ship card UI to display capacity and upgrade entrypoint.

Acceptance criteria:
1. Player can open upgrade dialog from HQ per ship.
2. Money checks and disabled states prevent invalid purchases.
3. Fishing payouts increase after capacity upgrades.
4. Sonar changes fish odds and is persisted on ship state.

---

## Phase 2 (Board Depth Recovery)
Goal: restore board progression depth while preserving current 20-tile ruleset.

Implementation set:
1. Reintroduce CHANCE tile gameplay via AI event modal:
1. Add `currentEvent`, `isEventLoading`, `showEventModal`.
2. Generate JSON event + optional image (fallback-safe).
3. Resolve event effect to player money and logs.
2. Add captain management layer:
1. Add captain data structure and candidates.
2. Add assign/hire flow for owned properties.
3. Apply captain rent multiplier on rent transfer.
3. Optional AI newspaper overlay:
1. Reuse `fetchAiNews` pattern from `2c1b260`.
2. Trigger once per round.

Acceptance criteria:
1. Landing on CHANCE no longer does nothing.
2. Owned properties can gain captain bonuses.
3. Rent calculation visibly changes when captain assigned.
4. No turn deadlocks with AI + modal flows.

---

## Phase 3 (Spec Bridge to Advanced Simulation)
Goal: capture Python systems as web-ready specs and incremental web mechanics.

Implementation set:
1. Create TS domain models mirroring selected Python mechanics:
1. Inflation state
2. Health/B12 state
3. Historical event timeline
4. Heir/succession state
2. Introduce one mechanic at a time behind feature flags:
1. Inflation first
2. Historical events second
3. Health/B12 third
4. Heir/succession last

Acceptance criteria:
1. Each added mechanic has deterministic fallback behavior.
2. Save/load compatibility is maintained if persistence is added.
3. Each mechanic has a toggle to isolate regressions.

---

## 5. File-Level Port Map

| Source file | Source symbols | Target file | Target insertion |
|---|---|---|---|
| `/home/claude/Documents/GitHub/maigreifin2/TycoonGame.tsx` | `handleRepair`, `handleUpgradeCapacity`, `handleEquipSonar`, `upgradeShipId`, modal block | `index.tsx` | inside `TycoonGame` around `index.tsx:95` |
| `/home/claude/Documents/GitHub/maigreifin2/types.ts` | `ShipItem.capacity` | `index.tsx` | `ShipItem` interface at `index.tsx:86` |
| `0c2119b:index.tsx` | `triggerChanceEvent` | `index.tsx` | `BoardGame` near `handleLand` at `index.tsx:492` |
| `0c2119b:index.tsx` | `generatePropertyImage` | `index.tsx` | board space lifecycle and render paths |
| `2c1b260:index.tsx` | `generateCaptains`, `hireCaptain`, captain rent boost | `index.tsx` | `BoardGame` state and rent computation |
| `2c1b260:index.tsx` | `fetchAiNews`, `showNewspaper` modal | `index.tsx` | board header + round-transition hooks |
| `/home/claude/Documents/GitHub/maigreifinn/src/game_final.py` | inflation/health/dynasty methods | new TS domain module(s) | do not paste directly; translate logic |

---

## 6. Risk Register

| Risk | Why it matters | Mitigation |
|---|---|---|
| AI modal race conditions | `setTimeout` turn flow + async AI responses can overlap | Add explicit modal/blocking state gates before `nextTurn()` |
| State mutation timing bugs | Board logic currently mixes state updates and delayed callbacks | Keep all event-resolution mutations in one transactional helper |
| Scope creep from Python parity | Full parity is a different game scale | Stage by feature flag and limit each PR to one mechanic family |
| UI complexity regression | New modals can clutter current flow | Keep one modal active at a time and centralize modal state |

---

## 7. Recommended Execution Order
1. Implement Phase 1 fully (ship upgrades).
2. Implement CHANCE event system only (Phase 2 subset A).
3. Implement captain system (Phase 2 subset B).
4. Decide whether to add AI newspaper or skip.
5. Create technical design doc for Phase 3 before writing code.

---

## 8. Next Build Slice (Concrete)
If we start immediately, first PR should include only:
1. `ShipItem.capacity` addition.
2. Tycoon upgrade state/actions.
3. Tycoon upgrade modal UI.
4. Fishing payout multiplier from capacity.

This yields visible gameplay depth with minimal regression surface.
