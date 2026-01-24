# Game Design Document: Togaraveldi

**Version: 2.0**

## 1. Core Concept

**Working Title:** Togaraveldi

**Core Fantasy:** Players step into the boots of an Icelandic fishing entrepreneur in the 1980s. Starting with a single small boat, they must build a fishing empire by navigating a complex web of business, politics, and personal ambition. The goal is not just to get rich, but to become a legend—either as a respected captain of industry or an infamous tabloid king.

**Pillars of Design:**

*   **Authentic Icelandic Capitalism:** The game is a simulation of the Icelandic economic and social environment of the late 20th century. It's about fish, but it's also about ambition, envy, politics, and the unique cultural context of Iceland.
*   **Narrative Strategy:** Every system is designed to generate stories. The player's choices have meaningful, often unexpected, consequences that shape their personal saga.
*   **Calculated Risks:** Success hinges on balancing high-risk, high-reward ventures (like smuggling or a trip to England in a storm) with safer, long-term strategies (like government bonds).

## 2. Core Gameplay Loop

The game is a turn-based simulation. Each turn represents approximately one month.

1.  **Start of Turn:** The turn begins with a headline from `Morgunblaðið`, announcing major world events (e.g., union strikes, market shifts, historical moments like the arrival of Keiko).
2.  **Review Status:** The player reviews the `Tekjublaðið` (The Income Paper) to see their net worth ranked against their AI rivals. They also see their personal asset status (house, car) and any messages in the "chat room."
3.  **Take Actions:** The player chooses from a menu of actions, including:
    *   Going on a fishing trip (local or to England).
    *   Visiting the shipyard to buy/sell/upgrade boats.
    *   Accessing the `Fjárfestingar` (Investments) menu.
    *   Investigating the crew.
    *   Sending a message to the chat.
4.  **End of Turn:** The player ends their turn.
5.  **AI Turns & World Update:** The AI rivals take their turns based on their personalities. The game world updates: markets fluctuate, crew morale is adjusted, and event timers tick down. If it is the end of a 12-turn year, the `Árskýrsla` (Annual Report) is generated.

## 3. Game Systems

### 3.1. The Player Company

The central entity, defined by the following key attributes:
*   `money`: Liquid cash.
*   `net_worth`: Total value (cash + assets). The primary metric for success.
*   `owned_boats`: A list of the company's vessels.
*   `crew_morale`: Affects crew performance and loyalty.
*   `suspicion_score`: A hidden stat representing how much "unnatural foresight" the player is exhibiting. Triggers tax investigations.
*   `fame`: Public notoriety, gained from scandals. Provides social perks and drawbacks.
*   `klikusambond`: Political capital, used to influence the endgame.

### 3.2. Rival AI

The world is populated by AI-controlled rival companies with distinct personalities and strategies.
*   **"Hafgengill hf." (The Aggressor):** Takes big risks, aggressively pursues the high-priced English market, and expands its fleet quickly.
*   **"Norðursjórinn ehf." (The Conservative):** Prefers safe, local fishing. Invests heavily in government bonds and avoids debt.
*   **Bots:** Numerous smaller AI companies that create a dynamic and competitive market.

### 3.3. The Authentic Economy

*   **Specific Fish Species:** The catch is broken down into `Cod`, `Haddock`, and `Skate`.
*   **Seasonal Markets:** Market prices for fish are not random; they are driven by seasonal demand. Selling `Skate` in December or `Cod` to the `Frystihús` (Freezing Plant) before `Þorrablót` is a key strategic element.

### 3.4. Crew Management: "Andskotans hluturinn"

*   **The Crew's Share:** A small, accepted portion of revenue is automatically deducted each trip ("one box per man").
*   **The Greed Event:** Low morale or high profits can trigger a hidden "Greed" event, where the crew skims much more than is accepted.
*   **Investigation & Action:** The player must notice the discrepancy and choose to `[R]annsaka áhöfn` (Investigate Crew). If greed is confirmed, they must choose between sacking the ringleaders (hurting morale) or looking the other way (encouraging more theft).

### 3.5. Financial & Political Systems

*   **`Fjárfestingar` (Investments):** The player can choose to grow their wealth through means other than fishing.
    *   `Ríkiskuldabréf` (Government Bonds): Safe, low-yield, long-term investments.
    *   `VISA` Credit: A line of credit that automatically covers negative cash flow at a high interest rate.
    *   `Afla upplýsinga` (Gather Intelligence): The "Framsýni" system. Players can pay to get hints about future game events, rewarding their real-world knowledge.
*   **`Skattarannsókn` (Tax Investigation):** Triggered by a high `suspicion_score`. The player loses a turn and risks major fines, acting as a penalty for "perfect" play.

### 3.6. Scandal & The Endgame: "Uppreisn Æru"

*   **Crime & Consequence:** When caught for smuggling or tax evasion, players with enough money can `Hringja í lögfræðinginn` (Call the Lawyer) to buy their way out of trouble.
*   **The "Séð og Heyrt" Effect:** Doing so turns the scandal into a media spectacle, increasing the player's `Fame` stat.
*   **Political Victory:** High `Fame` unlocks the ability to `Styðja frambjóðanda` (Support a Candidate), which builds `Klíkusambönd` (Political Capital). If the player has the most political capital during a presidential election event, their candidate wins, and they are granted `Uppreisn Æru` (Restoration of Honor), wiping their slate clean and potentially winning the game.

## 4. Victory Conditions

*   **Net Worth Goal:** Be the first company to reach a pre-determined net worth (e.g., 25,000,000 kr).
*   **Time Limit:** Have the highest net worth after a set number of years.
*   **Influence Victory:** Successfully be granted `Uppreisn Æru`.

## 5. Historical & Narrative Systems

*   **Living History:** Core historical realities are woven directly into the mechanics.
    *   **Safety Upgrades:** Investing in safety equipment (`Björgunarbúnaður`) is crucial to surviving storms, reflecting the historical evolution of maritime safety.
    *   **Union Strikes (`Verkaföll`):** Random events that halt all fishing operations for several turns.
    *   **Smuggling (`Smygl`):** A high-risk, high-reward action available after returning from England.
    *   **Unique Events:** One-time historical events like the arrival of Keiko will cause major, temporary shifts in the game economy.
