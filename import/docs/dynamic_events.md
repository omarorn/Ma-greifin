
# Dynamic Event System Design for Togaraveldi

## 1. Introduction

To ensure "Togaraveldi" is a "living world" that never becomes stale, we will implement a system where real-world news events dynamically alter game mechanics. This document outlines the design of this system.

The core components are:
- **The Research Agent (`news_analyzer.py`):** An external module responsible for finding and interpreting real-world news.
- **`GameModifier` Objects:** Standardized data structures that represent the in-game consequences of a news event.
- **The Game Engine Integration:** The process by which the core game loop applies these modifiers.

## 2. Key Real-World Data Points & Corresponding Mechanics

The Research Agent will look for news related to the following categories, which will map to specific game mechanics.

| News Category | Game Mechanic Affected | Example Real-World Event |
| :--- | :--- | :--- |
| **Global Energy Prices** | `base_upkeep` of all boats | "OPEC announces production cuts, oil prices expected to rise." |
| **International Trade/Politics**| `english_market_price` (Hull) | "New UK-EU trade deal includes heavy tariffs on imported fish." |
| **Fisheries Science** | `catch_amount` (local trips) | "Scientific report shows declining cod stocks in the North Atlantic." |
| **Maritime Weather** | `sigling_risk` (storm chance)| "Met Office predicts an unusually stormy season for the North Sea." |
| **Geopolitical Events** | Introduces new, temporary risks | "NATO to conduct naval exercises, closing off key shipping lanes." |

## 3. The `GameModifier` Object Structure

When the Research Agent identifies a relevant news story, it will generate a `GameModifier` object. This provides a clear, machine-readable instruction for the game engine.

**Example `GameModifier`:**
```json
{
  "id": "GM_1678886400_OIL",
  "source_headline": "OPEC+ Agrees to Slash Oil Production",
  "category": "Global Energy Prices",
  "mechanic_affected": "base_upkeep",
  "effect": {
    "type": "multiplier",
    "value": 1.20
  },
  "duration_turns": 10,
  "start_turn": 5
}
```

- **`id`**: A unique identifier.
- **`source_headline`**: The real-world headline that triggered the event.
- **`category`**: The type of news.
- **`mechanic_affected`**: The specific game variable to change.
- **`effect`**: How to change the variable (e.g., multiplier, flat addition/subtraction).
- **`duration_turns`**: How long the modifier lasts.
- **`start_turn`**: The turn the modifier becomes active.

## 4. Game Engine Integration Flow

1.  **Start of Turn:** The main game loop calls `news_analyzer.get_latest_modifiers()`.
2.  **Fetch & Process:** The Research Agent fetches news (initially from a simulated JSON file, later from a live API), processes it, and generates any new `GameModifier` objects.
3.  **Apply Modifiers:** The game engine iterates through the list of active modifiers. For each one, it calculates the dynamic value for the current turn.
    -   *Example:* `current_upkeep = base_upkeep * modifier.effect.value`
4.  **Inform the Player:** The "Reykjavík Grapevine" news system announces the event, using the `source_headline` from the modifier to tell the player what's happening and why their world has changed.
5.  **End of Turn:** The engine decrements the `duration_turns` counter on all active modifiers. Modifiers with a duration of 0 are removed.

This design creates a robust, scalable system for a truly dynamic and endlessly replayable game experience.
