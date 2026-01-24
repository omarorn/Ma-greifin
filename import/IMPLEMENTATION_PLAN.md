# Togaraveldi v2.0 - Implementation Plan

**Status:** In Progress
**Target:** First Playable Version with Full Systems

---

## Phase 1: Foundation - The Data Layer ✅ NEXT

### Objective
Create the complete data model architecture from `data_models.md v2.0`.

### Tasks
- [x] Create new `src/models.py` with all dataclasses
- [ ] Implement `Company` with all v2.0 attributes
  - Core financials (money, net_worth)
  - Social/Political (fame, klikusambond, reputation)
  - Crew management (crew_morale)
  - Game mechanics (suspicion_score, is_under_investigation)
- [ ] Implement `BoatBlueprint` and `OwnedBoat`
- [ ] Implement `CrewMember` with hometown and family_name
- [ ] Implement `SafetyUpgrade` dataclass
- [ ] Implement `GameCard` with dynamic requirements/outcomes
- [ ] Implement `Game` state class

### Files Created
- `src/models.py` - All game data structures

---

## Phase 2: The Core Loop & The World

### Objective
Build the fundamental turn-based game loop with AI rivals.

### Tasks
- [ ] Create main `Game` class in `src/game.py`
- [ ] Initialize player company
- [ ] Create AI rivals:
  - "Hafgengill hf." (Aggressive)
  - "Norðursjórinn ehf." (Conservative)
  - 5 Bot companies
- [ ] Implement turn structure:
  1. `Morgunblaðið` headline
  2. `Tekjublaðið` ranking display
  3. Personal asset status
  4. Player action menu
  5. AI turn execution
  6. World update (markets, events)
- [ ] Implement `Árskýrsla` (Annual Report) every 12 turns

### Files Modified
- `src/game.py` - Main game loop

---

## Phase 3: The Economic Engine

### Objective
Implement fishing, fish species, and seasonal market dynamics.

### Tasks
- [ ] Implement fish species system:
  - Cod (Þorskur)
  - Haddock (Ýsa)
  - Skate (Skata)
- [ ] Create seasonal market pricing:
  - Skate premium in December
  - Cod premium before Þorrablót
- [ ] Implement Icelandic vs English market
- [ ] Create fishing trip mechanics:
  - Local trips (Icelandic market)
  - "Sigling" to England (high risk/reward)
- [ ] Implement catch distribution by species
- [ ] Add market price volatility

### Files Created/Modified
- `src/economy.py` - Economic systems
- `src/fishing.py` - Fishing mechanics

---

## Phase 4: The Human Element - Crew Management

### Objective
Implement full crew system including morale, families, and tragedy.

### Tasks
- [ ] Crew hiring system with hometowns
- [ ] Family connections (relatives more likely from same hometown)
- [ ] "Andskotans hluturinn" - Crew's automatic share
- [ ] Crew morale tracking (0-100)
- [ ] Hidden "Greed" event when morale is low
- [ ] `[R]annsaka áhöfn` - Investigate crew action
- [ ] Crew firing consequences (morale impact)
- [ ] "Svartur Dagur" (Black Day) - Family tragedy event
  - Multiple family members lost in sinking
  - Massive reputation hit
  - Hometown hiring lockout
  - Demographic impact narrative

### Files Created
- `src/crew.py` - Crew management system

---

## Phase 5: Grand Strategy - Fame, Finance & Politics

### Objective
Implement systems that create narrative emergent gameplay.

### Tasks
- [ ] **Financial Systems:**
  - `Ríkiskuldabréf` (Government Bonds) - safe investment
  - `VISA Credit` - automatic coverage of negative cash
  - Interest calculations
- [ ] **Intelligence System:**
  - `Afla upplýsinga` - Pay for future event hints
  - Reward player knowledge of history
- [ ] **Scandal & Fame:**
  - `suspicion_score` tracking
  - `Skattarannsókn` (Tax Investigation) trigger
  - `Hringja í lögfræðinginn` - Pay to escape scandal
  - "Séð og Heyrt" effect - scandal → fame
  - Fame unlocks political actions
- [ ] **Reputation vs Fame:**
  - Reputation: business/public standing
  - Fame: notoriety from scandals

### Files Created
- `src/finance.py` - Investment and credit systems
- `src/scandal.py` - Fame and scandal mechanics

---

## Phase 6: The Endgame

### Objective
Implement victory conditions and political endgame.

### Tasks
- [ ] **Victory Conditions:**
  - Net worth goal (25,000,000 kr)
  - Time limit (highest net worth)
  - Political victory ("Uppreisn Æru")
- [ ] **Political System:**
  - `Styðja frambjóðanda` - Support political candidate
  - Build `Klíkusambönd` (Political Capital)
  - Presidential Election event
  - "Uppreisn Æru" - Restoration of Honor
    - Wipes criminal record
    - Massive reputation boost
    - Can win the game
- [ ] Victory screen and final rankings

### Files Created
- `src/victory.py` - Victory condition checking
- `src/politics.py` - Political endgame system

---

## Phase 7: Event System & Cards

### Objective
Implement the dynamic event card system.

### Tasks
- [ ] Card loading from definitions
- [ ] Dynamic requirement checking
  - Fame thresholds
  - Money requirements
  - Stat comparisons
- [ ] Multiple outcome system
- [ ] Effect application engine
  - Stat modifications (add, sub, multiply, set_percent)
  - Card type routing (Glæpir, Klíkan, Saga, Kvóti)
- [ ] Special events:
  - "Ástandið Nýja" - Economic boom
  - Union strikes
  - Ship sinkings
  - Family tragedies

### Files Created
- `src/events.py` - Event card system
- `data/cards.json` - Card definitions

---

## Integration & Testing

### Tasks
- [ ] Integrate all systems into main game loop
- [ ] Create save/load system
- [ ] Add comprehensive error handling
- [ ] Test all AI personalities
- [ ] Balance testing (200+ turn simulations)
- [ ] Narrative coherence testing

---

## Success Criteria

The game is "done" when:
1. ✅ All 6 phases are complete
2. ✅ Player can play full game from start to victory
3. ✅ All 3 victory conditions are achievable
4. ✅ AI rivals demonstrate distinct personalities
5. ✅ Crew tragedy events generate emotional impact
6. ✅ Economic boom event dramatically shifts gameplay
7. ✅ Political endgame feels satisfying and earned
8. ✅ Game generates memorable narratives

---

**Current Phase:** ✅ ALL PHASES COMPLETE
**Status:** IMPLEMENTATION FINISHED - Game is playable!
**Completion Date:** 2026-01-24

See [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) for full details.
