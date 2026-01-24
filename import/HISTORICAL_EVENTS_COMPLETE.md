# Historical Events - Complete Implementation

## Status: ✅ ALL REAL ICELANDIC HISTORY ADDED

All major historical events from 1958-2020 have been implemented in [src/events.py](src/events.py).

---

## Timeline of Events

### ⚔️ Cod Wars (1958-1976) - Þorskastríðið

**Iceland's Only War - And They Won!**

#### First Cod War (September 1958)
- **Historical Context:** Iceland extends fishing zone to 12 nautical miles
- **British Response:** Protests, tensions escalate
- **Game Effects:**
  - Fish prices increase 20%
  - Reputation +5
  - Less foreign competition

#### Second Cod War (September 1972)
- **Historical Context:** Zone extended to 50 nautical miles
- **British Response:** Royal Navy escorts British trawlers
- **Iceland's Threat:** Leave NATO if UK doesn't back down
- **Game Effects:**
  - Fish prices increase 50%
  - Fame +10 (international attention)
  - Reputation +10

#### Third Cod War (November 1975) - VICTORY! 🏆
- **Historical Context:** 200-nautical-mile exclusive economic zone
- **British Response:** Backs down completely
- **Historical Significance:** Tiny Iceland defeated superpower with fishing boats!
- **Game Effects:**
  - Victory bonus: 420,000 kr (easter egg!)
  - **PERMANENT** 2x fish price boost
  - Fame +20
  - Reputation +20
  - Crew Morale +30
  - "Iceland controls its own waters!"

---

### 🍺 Beer Day (March 1, 1989) - Bjórdagurinn

**End of 74-Year Prohibition**

- **Historical Context:** Strong beer was banned in Iceland from 1915-1989
- **Celebration:** Nationwide parties when ban lifted
- **Game Effects:**
  - Health +15 (celebrations lift spirits)
  - Fame +5
  - Crew Morale +20
  - Upkeep reduction (happy crew works for less)

---

### 💥 Bank Collapse (October 2008) - Bankahrunið

**Iceland's Financial Crisis**

- **Historical Context:** Over-leveraged banks defaulted, Króna crashed
- **Real Impact:** 60% GDP loss, massive protests, government fell
- **Why Fishing Protected:** Hard assets (boats, quotas) retained value
- **Game Effects:**
  - 60% cash loss for all companies
  - Companies with VISA debt may go **BANKRUPT**
  - Reputation -10
  - Market crash (fish prices drop 50% for 12 months)
  - Fishing companies survive better (have boats!)

**Lesson:** Hard assets protect against financial collapse

---

### 🌋 Volcano (April 2010) - Eldgos í Eyjafjallajökli

**Ash Cloud Paralyzes Europe**

- **Historical Context:** Volcano under Eyjafjallajökull erupted
- **Real Impact:** European air travel paralyzed for weeks
- **Iceland Isolated:** Could not export fish to Europe
- **Game Effects:**
  - Exports impossible for 4 months
  - Only local Icelandic market available
  - Catch can be stored but not sold abroad
  - "Air travel is paralyzed!"

**Lesson:** Nature is unpredictable and powerful

---

### 🦠 COVID-19 Pandemic (March 2020)

**Global Pandemic**

- **Historical Context:** COVID-19 global pandemic
- **Panic Buying:** Masks, toilet paper, hand sanitizer
- **Game Mechanic:** Speculative investment opportunity
- **Game Effects:**
  - If invested in pandemic supplies BEFORE March 2020:
    - **10x profit!**
    - Fame +20 ("you predicted it!")
  - Investment types: masks, toilet paper, hand sanitizer
  - Available in investment menu from game start

**Lesson:** Forward-thinking and preparation are rewarded

---

## Random Events

### 🧠 Conspiracy Theories

**Health Hazard - Not Historical, but Thematic**

- **Frequency:** 5% chance per turn
- **Mechanic:** Player chooses to listen or ignore
- **Effects:**
  - Listening damages health and B12
  - After 20 exposures: **DEATH**
  - "þú hlustaðir óvart of lengi á þannig og dóst"
  - Ignoring gives +1 reputation

**Lesson:** "verður að muna að setja mörk" (must set boundaries)

---

## Implementation Details

### File Structure

**File:** [src/events.py](src/events.py) (573 lines)

**Functions:**
- `check_cod_wars()` - Detects which phase
- `trigger_cod_war_first()` - First war (1958)
- `trigger_cod_war_second()` - Second war (1972)
- `trigger_cod_war_third()` - Victory! (1975)
- `check_beer_day()` - Detects March 1, 1989
- `trigger_beer_day()` - Celebration effects
- `check_bank_collapse()` - Detects October 2008
- `trigger_bank_collapse()` - Crisis effects
- `check_volcano()` - Detects April 2010
- `trigger_volcano()` - Ash cloud effects
- `check_covid_pandemic()` - Detects March 2020
- `trigger_covid_pandemic()` - Pandemic effects
- `check_and_trigger_historical_events()` - Main dispatcher

### Integration Points

To integrate into main game loop:

```python
from events import check_and_trigger_historical_events

# In annual events section:
if check_and_trigger_historical_events(game):
    # Historical event triggered!
    pass
```

---

## Historical Accuracy

All events based on **real Icelandic history**:

1. **Cod Wars** - Actual conflict 1958-1976, Iceland won
2. **Beer Day** - Real date: March 1, 1989
3. **Bank Collapse** - Real crisis: October 2008
4. **Volcano** - Real eruption: April 2010, Eyjafjallajökull
5. **COVID-19** - Real pandemic: March 2020

---

## Game Design Philosophy

### "Crime Pays Over Real" + "History Teaches"

Each historical event encodes a **lærdómur** (lesson):

1. **Cod Wars** → Small nations can win through determination
2. **Beer Day** → Celebrate victories, morale matters
3. **Bank Collapse** → Hard assets protect you
4. **Volcano** → Nature is unpredictable, adapt
5. **COVID** → Preparation and foresight pay off
6. **Conspiracies** → Set boundaries or suffer

---

## Easter Eggs

All historical events maintain 4:20/16:20 references:

- Cod War Third victory bonus: **420,000 kr**
- Conspiracy death threshold: **20 exposures**
- Bank collapse loss: **60%** (4+20*2+20 pattern)
- Volcano duration: **4 months**

---

## Future Events to Consider

Based on user suggestions:

1. **Vestmannaeyjar Boom** - Local prosperity during crisis
2. **EU Fishing Quotas** - Iceland stays out
3. **Herring Boom/Bust** - Major fish stock collapse
4. **Aluminium Smelters** - Industrial diversification

---

## Testing

All events can be tested by setting game year/month:

```python
game.year = 1975
game.month = 11
check_and_trigger_historical_events(game)  # Triggers Cod War victory!
```

---

**Status:** Ready for integration into main game loop!
**File:** [src/events.py](src/events.py)
**Lines:** 573
**Complete:** ✅
