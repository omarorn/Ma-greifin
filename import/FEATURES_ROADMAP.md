# Features Roadmap - Togaraveldi: Íslensk Sjávarútgerð

## Status Legend
- ✅ **Implemented** - Feature is working in current prototype
- 🚧 **Partial** - Feature is partially implemented
- ❌ **Missing** - Feature is designed but not implemented
- 📋 **Planned** - Feature is in design documents

---

## Core Systems Status

### ✅ Implemented Features

1. **Crew System**
   - CrewMember dataclass with roles and shares
   - Automatic crew assignment when purchasing boats
   - Role-based share distribution (Captain: 2.0, First Mate: 1.5, Engineer: 1.2, Deckhand: 1.0)

2. **AI Personality System**
   - Guðrún (cautious): 0.2 risk tolerance, 250k expansion threshold
   - Björn (risk-taker): 0.8 risk tolerance, 180k expansion threshold
   - Personality-based decision making

3. **Basic Card System**
   - Card drawing and deck management
   - Deck shuffling and recycling
   - Basic card types: Choice, Immediate Effect, Keepable

4. **Multi-player Turn System**
   - Turn-based gameplay
   - Player rotation
   - Turn counter

5. **Boat Purchasing**
   - Basic shipyard catalog (3 boat types)
   - Purchase validation (money check)
   - Fleet expansion

6. **Basic Fishing Trips**
   - Random catch generation
   - Revenue calculation
   - Owner/crew share split (50/50)

### 🚧 Partially Implemented Features

1. **Card Event System**
   - ✅ Basic Choice cards work
   - ✅ Global effects (strikes) work
   - ❌ Dice roll outcomes not implemented
   - ❌ Keepable card usage not implemented
   - ❌ Smuggling check mechanics incomplete
   - ❌ Reputation checks not implemented

2. **Reputation System**
   - ✅ Reputation value tracked
   - ❌ No gameplay impact from reputation
   - ❌ Reputation checks for card outcomes missing

3. **Smuggling Mechanics**
   - ✅ Smuggling flag tracked
   - ❌ Customs inspection dice rolls not working
   - ❌ No visual feedback on smuggling status

---

## ❌ Missing Core Systems (High Priority)

### 1. Career Progression System
**From:** GDD.md Section 3.1
- [ ] Implement career path: Nemi → Háseti → Stýrimaður/Vélstjóri → Skipstjóri → Útgerðarmaður
- [ ] Career advancement triggers (trips completed, money earned, reputation)
- [ ] Career-specific abilities and bonuses
- [ ] Visual progression (room → office)
- [ ] Starting as 16-year-old student

### 2. Quota System (Post-1984)
**From:** GDD.md Section 3.5, mechanics.md
- [ ] Individual Transferable Quota (ITQ) tracking
- [ ] Quota per fish species
- [ ] Overfishing detection
- [ ] Quota management choices:
  - [ ] Discard excess (risk detection)
  - [ ] Land illegal catch (risk fine)
  - [ ] Lease quota from market/players
- [ ] Quota trading/buying mechanics
- [ ] Quota price fluctuations

### 3. GILDRA (Trap) Card System
**From:** GDD.md Section 3.6
- [ ] Add GILDRA cards to deck when player makes risky choices
- [ ] Design GILDRA card deck (loan shark, debt collector, etc.)
- [ ] Delayed consequence mechanics
- [ ] Trap card resolution

### 4. Game Board & Movement System
**From:** GDD.md Section 3.4, mechanics.md
- [ ] Board representation of Icelandic fishing grounds
- [ ] Dice-based movement (boat size determines dice count)
- [ ] Square types:
  - [ ] Miði (Fishing Ground) 🐟
  - [ ] Saga (Historical Event) 🎴
  - [ ] Kvóti (Quota) ⚖️
  - [ ] Glæpir (Crime) 🔫
  - [ ] Klíkan (Clique) 👔
  - [ ] Höfn (Harbor) ⚓
  - [ ] Hættusvæði (Hazard Zone) ⚠️
- [ ] Board navigation UI

### 5. Time Period System
**From:** GDD.md Section 5.1
- [ ] Implement historical eras:
  - [ ] 1950-1969: No safety, high death rate
  - [ ] 1970-1983: Sæbjörg rescue ship
  - [ ] 1984+: Quota system introduced
  - [ ] 1990+: Free quota transfer
  - [ ] 2000+: Modern safety
- [ ] Era-specific rules and mechanics
- [ ] Progressive unlocking of features
- [ ] Historical event triggers

### 6. Weather & Hazard System
**From:** GDD.md
- [ ] Dynamic weather generation
- [ ] Weather effects on fishing
- [ ] Storm mechanics
- [ ] Shipwreck probability
- [ ] Hazard zones on board
- [ ] Seasonal weather patterns

### 7. Safety & Rescue System
**From:** GDD.md Section 5.2, mechanics.md
- [ ] Shipwreck events
- [ ] Survival probability calculation
- [ ] Rescue modifiers:
  - [ ] Sæbjörg presence (+10-15%)
  - [ ] Helicopter availability (+10-15%)
  - [ ] Survival suits (+5-10%)
- [ ] Death consequences by career level:
  - [ ] Deckhand/Student: New character
  - [ ] Officer/Captain: Lose all progress
  - [ ] Fleet Owner: Ship lost, debt, insurance

### 8. Harbor & Port System
**From:** GDD.md Section 5.3
- [ ] Multiple ports (Vestmannaeyjar, Reykjavík, Ísafjörður)
- [ ] Port-specific advantages
- [ ] Harbor landing choices
- [ ] Catch processing options:
  - [ ] Sell fresh
  - [ ] Freeze
  - [ ] Process
- [ ] Port facilities (shipyard, processing plant, freezer)

### 9. Equipment & Gear System
**From:** mechanics.md
- [ ] Fishing gear catalog
- [ ] Gear purchase mechanics
- [ ] Gear bonuses to fishing rolls:
  - [ ] Dýptarmælir (Depth sounder): +1 die
  - [ ] Troll (Trawl): +1 die
  - [ ] Hlerar (Sonar): +1 die
  - [ ] Nemar: +1 die
- [ ] Maintenance items (nylon, wire, dynamo)
- [ ] Equipment degradation

### 10. Market Price System
**From:** GDD.md
- [ ] Fish species pricing
- [ ] Price fluctuations
- [ ] Supply/demand mechanics
- [ ] Seasonal price variations
- [ ] Processing multipliers

---

## 📋 Missing Secondary Systems (Medium Priority)

### 11. Family & Legacy System
**From:** GDD.md Section 3.2
- [ ] Multi-generational gameplay
- [ ] Inheritance mechanics (assets + debts)
- [ ] Family reputation tracking
- [ ] Starting scenarios:
  - [ ] Clean start
  - [ ] Inheritance with complications

### 12. Victory Conditions
**From:** GDD.md Section 3.3
- [ ] Kvótakóngur (Quota King): 5%+ national quota
- [ ] Útgerðarveldi (Fleet Empire): 3+ ships, freezer, processing plant
- [ ] Duglegur Sjómaður (Hardworking Seaman): 50 trips, no deaths, good rep
- [ ] Smyglarinn (The Smuggler): 100k kr from smuggling
- [ ] Byggðarhetja (Hometown Hero): Keep quota local, create jobs
- [ ] Victory condition tracking UI

### 13. Fish Species System
**From:** data_models.md
- [ ] Fish dataclass (species, base_price, season, processing_multiplier)
- [ ] Multiple fish species:
  - [ ] Þorskur (Cod)
  - [ ] Ýsa (Haddock)
  - [ ] Síld (Herring) - seasonal
- [ ] Species-specific quotas
- [ ] Seasonal availability

### 14. Enhanced Crew System
**From:** GDD.md
- [ ] Individual crew member traits
- [ ] Crew experience tracking
- [ ] Crew fatigue mechanics
- [ ] Crew stories and events
- [ ] Crew hiring/firing
- [ ] Crew loyalty

### 15. Loan & Banking System
**From:** card_compendium.md
- [ ] Bank loan mechanics
- [ ] Interest rates
- [ ] Loan reputation checks
- [ ] Debt tracking
- [ ] Loan shark events (GILDRA)

### 16. Insurance System
**From:** GDD.md Section 5.2
- [ ] Ship insurance purchase
- [ ] Insurance claims on loss
- [ ] Insurance cost based on risk
- [ ] Insurance fraud mechanics

### 17. Prison Mechanics
**From:** data_models.md
- [ ] Prison sentence events
- [ ] Turn skipping while in prison
- [ ] Prison duration tracking
- [ ] Post-prison reputation effects

### 18. Processing & Infrastructure
**From:** GDD.md Section 3.3
- [ ] Processing plant ownership
- [ ] Freezer ownership
- [ ] Infrastructure costs
- [ ] Processing revenue bonuses

---

## 📋 Card System Enhancements (Low Priority)

### 19. Complete Card Mechanics
**From:** card_compendium.md
- [ ] Full dice roll implementation for all cards
- [ ] Reputation modifiers for card outcomes
- [ ] Keepable card hand management
- [ ] Keepable card activation mechanics
- [ ] More card variety (currently 6 cards, need 20+)

### 20. Additional Card Types
- [ ] Kvóti (Quota) cards
- [ ] More Glæpir (Crime) cards
- [ ] More Klíkan (Clique) cards
- [ ] More Saga (Historical) cards
- [ ] GILDRA (Trap) cards

---

## 🐛 Known Issues

### Game Balance Issues
1. **Fishing Economics Broken**
   - Small boats lose money on most trips
   - Freyja 8m: 1,500-3,000 kr revenue vs 3,000 kr upkeep
   - Players hemorrhage money
   - **Fix Required:** Adjust catch amounts, prices, or upkeep

2. **AI Expansion Impossible**
   - Neither player can afford to expand fleet
   - Expansion thresholds unreachable with current economics

3. **No Recovery from Strike**
   - 15,000 kr strike cost is devastating
   - Players can't recover financially

### Implementation Issues
1. **Smuggling Check Not Working**
   - Card GLAEPIR_01 has smuggling_check but doesn't execute dice rolls
   - No outcomes are applied

2. **Keepable Cards Not Usable**
   - KLIKAN_01 is saved but player can never use it

3. **Reputation Has No Effect**
   - Reputation changes but doesn't affect gameplay

---

## Recommended Implementation Order

### Phase 1: Fix Critical Issues (Immediate)
1. Fix game balance (catch/price/upkeep)
2. Implement dice roll mechanics for cards
3. Implement smuggling inspection properly

### Phase 2: Core Gameplay (Next)
1. Quota system
2. Equipment/gear system
3. Market price fluctuations
4. GILDRA trap cards

### Phase 3: Depth & Variety (Later)
1. Career progression
2. Time periods
3. Multiple ports/harbors
4. Fish species variety
5. Weather system

### Phase 4: Long-term Goals (Future)
1. Game board & movement
2. Victory conditions
3. Family & legacy
4. Visual progression
