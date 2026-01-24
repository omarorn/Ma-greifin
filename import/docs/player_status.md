
# Player Status & Rival AI System Design

## 1. Introduction

To enhance player motivation and create a more dynamic world, we are introducing a comprehensive player status screen and a system of AI-controlled rival companies. This document outlines the design for these features.

## 2. Enhanced Player Status Screen

At the start of each turn, the player will be presented with a more detailed overview of their standing.

### 2.1. Personal Assets

Assets reflect the player's personal wealth and success. They do not have a direct gameplay function but serve as a key progression metric.

| Asset Tier | House | Car |
| :--- | :--- | :--- |
| 1 (Start) | Small Apartment in Breiðholt | Lada Sport |
| 2 | Row House in Kópavogur | Toyota Corolla |
| 3 | Detached House in Hafnarfjörður | Land Rover Defender |
| 4 | Villa in Garðabær | Range Rover Classic |

- The player's assets will upgrade automatically when their company's net worth crosses certain thresholds.

### 2.2. Competitive Ranking

A simple leaderboard will display the player's rank relative to the other major players in the game.

**Example:**
```
--- ICELANDIC FISHING RANKINGS ---
1. Hafgengill hf. (Net Worth: 1,500,000 kr)
2. Togaraveldi hf. (Net Worth: 1,250,000 kr) < YOU
3. Norðursjórinn ehf. (Net Worth: 980,000 kr)
...
```

## 3. Rival AI System

The game will feature two primary, named AI rivals and several smaller, random bots.

### 3.1. Named Rivals

These will be `Company` objects, just like the player, but with a simple AI controller.

- **Hafgengill hf. ("The Aggressor")**
  - **Logic:** High risk tolerance. Will prioritize buying a `Togari` as soon as possible. If it owns a `Togari`, it will almost always choose the `go_on_sigling` action, especially if the `english_market_price` is high. It will spend money on new boats aggressively, even if its cash reserves are low.

- **Norðursjórinn ehf. ("The Conservative")**
  - **Logic:** Low risk tolerance. Will focus on building a fleet of `Inshore` boats first. It will only buy a `Togari` when it has a very large cash surplus. It will favor `take_local_fishing_trip` unless the `english_market_price` is exceptionally high and the risk is low.

### 3.2. Random Bots

To simulate a busier market, 5-10 smaller, unnamed companies will also exist. Their logic will be very simple:

- **Logic:** Each turn, they perform a `take_local_fishing_trip` action with a small, random fleet. Their net worth will fluctuate but generally grow slowly. They will not buy new boats or make strategic decisions.

## 4. Implementation Plan

1.  **`Company` Class Update:** Add `net_worth` and `personal_assets` attributes to the `Company` data class.
2.  **AI Controller Logic:** Create a new function, `run_ai_turn(company, game)`, that executes the logic defined above for the AI rivals.
3.  **Ranking System:** Create a new function, `display_rankings(player_company, all_companies)`, that calculates and displays the leaderboard.
4.  **Game Loop Integration:** The main game loop will be updated to:
    - Create the player, AI rivals, and bot companies at the start.
    - Call `run_ai_turn` for each AI-controlled company at the end of each turn.
    - Call `display_rankings` and show personal assets at the start of each player turn.
