# Data Models for Togaraveldi

**Version: 2.0**

This document outlines the core data structures, reflecting the systems described in GDD v2.0.

## 1. Company

This is the central data model for all active entities in the game, including the player and AI rivals. It has been expanded to include all social, political, and financial metrics.

```python
from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class Company:
    # --- Core Financials ---
    name: str
    money: int
    net_worth: int

    # --- Assets ---
    owned_boats: List[Dict] = field(default_factory=list) # See Boat section
    investments: Dict[str, int] = field(default_factory=dict) # e.g., {"rikiskuldabref": 500000}

    # --- Social & Political Standing ---
    fame: int = 0          # Public notoriety from scandals (Séð og Heyrt).
    klikusambond: int = 0  # Hidden political capital for influencing elections.
    reputation: int = 50   # General public and business standing (0-100).

    # --- Crew & Operations ---
    crew_morale: int = 70 # Affects skimming and performance (0-100).

    # --- Gameplay Mechanics ---
    ai_controller: str | None = None # e.g., 'Aggressive', 'Conservative', 'Bot'
    suspicion_score: int = 0     # Hidden score for triggering tax investigations.
    is_under_investigation: bool = False
    misses_next_turn: bool = False

    # --- Catch & Inventory ---
    catch_in_hold: Dict[str, int] = field(default_factory=dict) # e.g., {"Cod": 10, "Skate": 2}
```

## 2. Boat & Shipyard

The distinction between a `BoatBlueprint` (the catalog entry) and an `OwnedBoat` (the player's instance) is crucial.

### 2.1. BoatBlueprint

Static definition of a boat model available at the shipyard.

```python
@dataclass
class BoatBlueprint:
    id: str
    model_name: str
    cost: int
    capacity: int      # in tons
    base_upkeep: int
    type: str          # e.g., "Inshore", "Trawler"
    # NEW: Safety & Upgrades
    base_risk_factor: float # Base chance of disaster on a trip (e.g., 0.05)
    safety_upgrades: List[str] = field(default_factory=list) # IDs of available upgrades
```

### 2.2. OwnedBoat

A specific instance of a boat owned by a `Company`.

```python
@dataclass
class OwnedBoat:
    instance_id: str
    blueprint_id: str
    custom_name: str
    current_upgrades: List[str] = field(default_factory=list) # IDs of purchased safety upgrades
```

### 2.3. SafetyUpgrade

Represents an upgrade available at the shipyard to mitigate risk.

```python
@dataclass
class SafetyUpgrade:
    id: str
    name: str
    cost: int
    risk_reduction: float # A multiplier to reduce the boat's risk_factor
    description: str
```

## 3. Game State

Manages the global state of the game world.

```python
@dataclass
class Game:
    companies: List[Company]
    current_turn: int
    year: int

    # --- Market Prices ---
    icelandic_market_price: Dict[str, int] # e.g., {"Cod": 450, "Skate": 800}
    english_market_price: int

    # --- Events & Modifiers ---
    active_modifiers: List[Dict] # From news events, strikes, etc.
    upcoming_events: List[Dict]   # For foresight system and narrative hooks

    # --- Communication ---
    chat_log: List[str] = field(default_factory=list)
```

## 4. Game Event & Card Models

The structure of cards must now account for the new, complex mechanics.

```python
@dataclass
class GameCard:
    id: str
    title: str
    description: str
    deck: str # e.g., "Glæpir", "Klíkan", "Saga"

    # --- NEW: Dynamic Requirements & Effects ---
    # Replaces rigid action types with a flexible system.
    
    requirements: List[Dict] | None = None
    # e.g., [{"stat": "fame", "op": "gte", "value": 50},
    #         {"stat": "money", "op": "gte", "value": 1000000}]

    # --- Multiple, conditional outcomes ---
    outcomes: List[Dict]
    # e.g., [{"choice": "Hringja í lögfræðinginn", 
    #         "cost": {"money": 500000},
    #         "effects": [{"stat": "fame", "op": "add", "value": 20},
    #                     {"stat": "suspicion_score", "op": "add", "value": 50}]},
    #        {"choice": "Mæta afleiðingunum",
    #         "effects": [{"stat": "reputation", "op": "sub", "value": 30},
    #                     {"stat": "money", "op": "set_percent", "value": 0.5}]}]
```

This new `GameCard` model is significantly more robust. Instead of hard-coded checks, a card can define its own requirements (e.g., "player must have 50+ Fame"). Its outcomes are a list of choices, each with its own costs and effects, allowing for the complex scenarios we've designed, like the "Call the Lawyer" option. This makes the card system truly dynamic and future-proof.
