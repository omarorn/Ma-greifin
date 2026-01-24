# Card Compendium for Togaraveldi

**Version: 3.0**

This document details the game's event cards, designed to integrate with the complex mechanics of GDD v2.0 and Data Models v2.0. Cards are now dynamic and driven by the player's status (`Fame`, `Reputation`, `Suspicion`, etc.).

---

## 1. Glæpir (Crime) Cards

These cards test the player's morals and risk tolerance.

### Card: Tolleftirlit (Customs Inspection)

*   **Type:** Immediate Effect
*   **Flavor Text:** "As you prepare to unload, you see two grim-faced customs officers walking down the pier. 'Just a routine inspection,' one says. Your pulse quickens."

### Card: Skattarannsókn (The Tax Investigation)

*   **Type:** Triggered Event
*   **Trigger:** Player's `suspicion_score` exceeds 100.
*   **Flavor Text:** "A formal, sealed letter arrives from the tax authorities. They have noted 'irregularities' in your company's filings and are launching a full audit. Your operations are frozen."

---

## 2. Klíkan (The Clique) Cards

These cards are about social maneuvering, from the docks to the halls of power.

### Card: Bróðir um Borð (Brother on Board)

*   **Type:** Choice
*   **Flavor Text:** "Your most loyal skipstjóri comes to you, cap in hand. 'My wife's brother,' he says, 'is looking for a spot... It would mean the world to our family.'"

### Card: Stuðningskvöldverður (Fundraising Dinner)

*   **Type:** Choice (Requires 30+ Fame)
*   **Flavor Text:** "You receive a gilt-edged invitation to a private dinner in support of a promising presidential candidate. It's a chance to turn your fame into real influence."

---

## 3. Saga (Saga) Cards

These are major, world-changing narrative events, often triggered by specific dates.

### **Card: Lýðræðisleg Fyrirmynd (A Democratic Role Model)**

*   **Type:** Saga (Triggered at Game Start, July 1980)
*   **Flavor Text:** "Iceland has elected Vigdís Finnbogadóttir, the world's first democratically elected female head of state. A wave of optimism and national pride sweeps the nation."
*   **Mechanics:** A one-time event. All players gain a permanent +5 boost to `Fame` and +10 to `Health`.

### **Card: Hvalveiðibannið (The Whaling Moratorium)**

*   **Type:** Saga (Triggered after Turn 78 / Year 1986)
*   **Flavor Text:** "The International Whaling Commission has declared a global moratorium on commercial whaling. This presents both a moral and economic dilemma."
*   **Mechanics:** A major, choice-based event for all players.
    *   **Choice A: Defy the Moratorium.** Unlocks extremely lucrative "scientific whaling" at the cost of a catastrophic, permanent -30 `Reputation` hit and recurring "Protest" events.
    *   **Choice B: Respect the Moratorium.** Grants +15 `Reputation` and a small government subsidy.

### Card: Bjórdagurinn (Beer Day)

*   **Type:** Saga (Triggered after Turn 107 / March 1, 1989)
*   **Flavor Text:** "The decades-long prohibition on strong beer has ended! Celebrations erupt across the country."
*   **Mechanics:** A one-time "feel-good" event. Every player gains +15 `health` and +5 `fame`.

### **Card: Innganga í EES (Joining the European Economic Area)**

*   **Type:** Saga (Triggered after Turn 168 / Year 1994)
*   **Flavor Text:** "Iceland has joined the European Economic Area, opening up vast new markets but also imposing new regulations."
*   **Mechanics:** A permanent, game-altering global event.
    *   **Market Expansion:** Base market price for all fish permanently increases by 15%.
    *   **Regulatory Burden:** Base upkeep cost for all boats permanently increases by 20%.
    *   **Quota Shuffle:** A one-time lottery to spend capital for a chance at a significant, permanent quota increase.

### Card: Bankahrunið (The Bank Collapse)

*   **Type:** Saga (Triggered after Turn 336 / Year 2008)
*   **Flavor Text:** "The nation's over-leveraged banks have defaulted. The Krona is worthless. Only hard assets have value now."
*   **Mechanics:** All players lose 60% of their cash. Fish prices are halved for 12 turns. Players with loans may go bankrupt.

### Card: Eldgos í Eyjafjallajökli (Eruption in Eyjafjallajökull)

*   **Type:** Saga (Triggered after Turn 360 / Year 2010)
*   **Flavor Text:** "A volcano erupts under the Eyjafjallajökull glacier, spewing a colossal ash cloud into the atmosphere."
*   **Mechanics:** For 4 turns, all revenue from fishing is zero. High-fame players can run "disaster tourism" trips instead.
