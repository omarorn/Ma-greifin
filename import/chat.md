title
  Togaraveldi – Dagsskýrsla

output
  [dayIntro]
  [tripPlan]
  [atSea]
  [landing]
  [finance]
  [nextStep]

dayIntro
  ## Dagur í útgerðinni
  **Bátur:** [boat]  
  **Höfn:** [port]  
  **Veðurgluggi:** [weather]

boat
  * Guðrún GK (gömul eik, þrjósk en traust)
  * Sæbjörg RE (nýrri togari, dýr í rekstri)
  * Hrafn ÍS (frystitogari, langferðir)
  * Bjarmi EA (miðlungs, góð áhöfn)

port
  * Reykjavík
  * Vestmannaeyjar
  * Ísafjörður
  * Akureyri
  * Neskaupstaður

weather
  4~Gott (sjór sæmilegur, vinnan flýtur)
  3~Sleitulaust (hægari dráttur, meiri eldsneytisnotkun)
  2~Slæmt (áhætta á bilun og aflabrögðum)
  1~Ofsaveður (þú ýmist frestar eða tekur brjálaða ákvörðun)

tripPlan
  ## Áætlun dagsins
  Þú sendir **[boat]** út frá **[port]** með áherslu á **[targetSpecies]**.  
  Tæki/veiðarfæri: **[gear]**.  
  Áhöfn: **[crewMood]**.

targetSpecies
  * Þorsk
  * Ýsu
  * Ufsa
  * Karfa
  * Grálúðu
  * Síld (tímabil)

gear
  * Botnvörpu
  * Línu (beita + þolinmæði)
  * Nótabúnað (pelagískt, ef þú ert heppinn)
  * Blandað (minni afköst, meiri sveigjanleiki)

crewMood
  3~Áhöfnin er peppuð og samstillt
  2~Áhöfnin er þreytt en vinnur þetta
  1~Áhöfnin er á núllinu (mistök líkleg)

atSea
  ## Á sjó
  [seaEvent]
  **Niðurstaða:** [catchResult]

seaEvent
  3~Þú finnur góða torfu á réttum tíma
  2~Eftirlit kíkir við (allt þarf að vera í lagi)
  2~Netið fær högg (tapar tíma)
  1~Vél lætur illa (þarf að “redda þessu” á sjó)
  1~Ofsaleg ölduhæð (áhætta vs heim)

catchResult
  3~Fínn afli – þú brosir í stýrishúsinu
  2~Meðalafli – þetta borgar sig varla en lifir
  1~Lélegur afli – nú þarf plan B

landing
  ## Löndun
  Þú landar í **[landingPort]** og velur söluleið: **[salesRoute]**.  
  Markaðstónn í dag: **[marketMood]**.

landingPort
  * [port]
  * (annar) Reykjavík
  * (annar) Vestmannaeyjar

salesRoute
  * Fiskmarkaður (sveiflur en mögulegur toppur)
  * Beint í vinnslu (stöðugra, oft lægra)
  * Frysting/útflutningur (seinna uppgjör, stærri pot)
  * Blönduð leið (minni áhætta)

marketMood
  3~Verð er gott (eftirspurn há)
  2~Verð er eðlilegt
  1~Verð er dapurt (þú finnur það á buddunni)

finance
  ## Rekstur
  Eldsneyti: **[fuelPain]**  
  Viðhald: **[maintenance]**  
  Kvóti/heimildir: **[quotaPressure]**

fuelPain
  3~Eldsneytið er sárt í dag
  2~Eðlilegt
  1~Þú slappst vel

maintenance
  3~Smávægilegt (þú sleppur)
  2~Verkstæði kallar á þig fljótlega
  1~Þetta verður dýrt ef þú hunsar það

quotaPressure
  3~Þú ert að nálgast mörk – þarf að leigja/kaupa
  2~Þú ert nokkuð safe
  1~Þú ert vel innan marka

nextStep
  ## Næsta skref
  [decision]

decision
  * Fjárfesta í betra veiðarfæri
  * Ráða reynslumeiri skipstjóra
  * Leigja kvóta til að opna nýja tegund
  * Flytja heimahöfn (ný tækifæri / ný kostnaður)
  * Spara og lifa af næstu viku
Below is a concrete, production-oriented concept for a **Fishing Trawler Tycoon** game grounded in **Icelandic fisheries**, designed so it can realistically be built and expanded.

---

## Working Title

**Togaraveldi: Íslensk Sjávarútgerð**

---

## Core Fantasy

You are an Icelandic fishing entrepreneur starting with a single aging boat and a dream. You build a fleet, manage quotas, crews, weather, ports, politics, and technology—trying to survive storms, markets, and regulations while growing an empire.

---

## Core Game Loop

1. **Plan a trip**

   * Choose boat
   * Assign crew
   * Select fishing grounds
   * Allocate quota
2. **Go fishing**

   * Weather + sea conditions
   * Gear efficiency
   * Crew skill + fatigue
3. **Land catch**

   * Choose harbor (Vestmannaeyjar, Reykjavík, Ísafjörður, Akureyri…)
   * Fresh market vs freezing vs processing
4. **Sell & invest**

   * Fish market prices fluctuate
   * Upgrade boats, buy quota, train crew
5. **Progress**

   * Unlock bigger vessels, tech, regions, politics

---

## Setting & Authentic Icelandic Flavor

This is what makes it unique.

### Boats (Real Types)

* **Smábátar** – line & handline boats
* **Bátar** – coastal trawlers
* **Togarar** – freezer trawlers
* **Verksmiðjuskip** – floating factories (late game)

Each boat has:

* Year built (old boats break more)
* Engine type
* Gear (net, line, pelagic, demersal)
* Ice/freezing capacity

---

## Fish Species (Iceland-Specific)

* Þorskur (Cod)
* Ýsa (Haddock)
* Ufsi (Saithe)
* Karfi (Redfish)
* Grálúða (Greenland halibut)
* Síld & Loðna (pelagic, seasonal)

Each has:

* Seasonal availability
* Market demand
* Quota restrictions
* Processing value chains

---

## Quota System (Key Gameplay Depth)

* ITQ system (buy, sell, lease)
* Political events can change rules
* Overfishing penalties
* Inspection risk

This alone differentiates the game from generic tycoon sims.

---

## Crew Management

Crew are individuals, not stats.

Attributes:

* Experience
* Morale
* Fatigue
* Alcohol problems (yes, realistically optional)
* Loyalty

Events:

* Crew injury
* Walkouts
* Legendary skippers
* Family ties in ports

---

## Weather & Sea

Dynamic North Atlantic conditions:

* Storm systems
* Ice years
* Fog
* Engine failure in bad weather

Weather matters more than in most tycoon games.

---

## Ports & Regions

Each port has advantages:

* Vestmannaeyjar → pelagic strength
* Ísafjörður → long trips, ice fishing
* Reykjavík → markets & politics
* Akureyri → research & innovation

Ports can be upgraded.

---

## Economy & Politics Layer (Mid/Late Game)

* Fuel prices
* EU negotiations
* Environmental pressure
* Strikes
* Export tariffs
* Media scandals

You’re not just running boats—you’re navigating Icelandic society.

---

## Progression Phases

**Early game**

* One boat
* Loans
* Barely surviving

**Mid game**

* Fleet management
* Quota trading
* Processing plants

**Late game**

* Vertical integration
* Factory ships
* Political influence
* Global markets

---

## Visual Style (Recommended)

* Isometric or top-down
* Muted Nordic palette
* Harbors full of life
* Weather as a visual feature

---

## Platform Strategy

* **PC first** (Steam)
* Controller-friendly UI
* Mod support later (custom boats, ports, scenarios)

---

## Unique Selling Points

* Real Icelandic quota system
* Authentic boats & fish
* Harsh weather realism
* Deep crew simulation
* Cultural accuracy

This is **not** “Fishing Simulator.”
It’s **Capitalism meets North Atlantic survival**.

---

## Next Concrete Steps (If You Want)

I can:

1. Create a **GDD (Game Design Document)**
2. Design the **data models** (boats, fish, quotas)
3. Propose a **tech stack** (Unity vs Godot vs Unreal)
4. Prototype the **core loop in code**
5. Design a **vertical slice scenario** (e.g. Vestmannaeyjar, 1985)

Tell me which one to do first.
