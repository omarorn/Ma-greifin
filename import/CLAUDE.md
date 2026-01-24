# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Togaraveldi: Íslensk Sjávarútgerð** is an Icelandic fishing tycoon game combining fleet management, narrative-driven events, and RPG-like progression. It's grounded in the real Icelandic ITQ (Individual Transferable Quota) system and maritime history.

This is **not** "Fishing Simulator." It's **Capitalism meets North Atlantic survival**.

## Running the Game

Run the Python prototype:
```sh
python src/game_prototype.py
```

The prototype simulates an AI vs AI match between two players (Guðrún and Björn) over 10 turns. Each turn includes:
- AI decision-making for boat purchases based on personality
- Fishing trips with all owned boats
- Revenue distribution (50% owner, 50% crew)
- Event card resolution with AI choices

## Core Architecture

### Data Models (Dataclasses)

All game entities use Python dataclasses defined in [src/game_prototype.py](src/game_prototype.py):

- **Player**: Tracks money, reputation, owned boats, smuggling status, keepable cards, and AI behavior
- **BoatType**: Static blueprints for purchasable boats (stored in `SHIPYARD_CATALOG`)
- **OwnedBoat**: Player-owned boat instances with unique IDs, names, crew, and current catch
- **CrewMember**: Individual crew with name, role, and profit share

### Game Class

The `Game` class manages:
- **Deck Management**: Shuffles, draws, and recycles cards from `GAME_DECK`
- **Turn Simulation**: Orchestrates fishing phase → financial reconciliation → event phase for each player
- **Card Resolution**: Processes different card types (Immediate Effect, Choice, Keepable)
- **Multi-player Support**: Tracks current player and turn progression

### Event Card System

Cards are dictionaries with structured mechanics defined in `GAME_DECK`:

- **Glæpir (Crime)**: Smuggling opportunities, customs inspections, illegal fishing
- **Klíkan (Clique)**: Political connections, union strikes, reputation-based events
- **Saga (Historical)**: Time-period events, technological changes, narrative milestones
- **Kvóti (Quota)**: Post-1984 quota system regulations (planned)

Card types:
- **Immediate Effect**: Resolve on draw (can affect all players globally)
- **Choice**: AI players choose based on risk tolerance personality trait
- **Keepable**: Saved to player's hand for later use

### The GILDRA (Trap) System

When players choose "easy" options (smuggling, shady loans), a trap card is added to the deck representing future consequences. This creates delayed punishment for risky choices.

### AI Personality System

AI players have distinct personalities defined in `AI_PERSONALITIES`:
- **Guðrún** (Cautious): risk_tolerance=0.2, expansion_threshold=250000
  - Rarely takes smuggling jobs or risky choices
  - Conservative with fleet expansion
- **Björn** (Risk-taker): risk_tolerance=0.8, expansion_threshold=180000
  - Frequently accepts smuggling and high-risk opportunities
  - Aggressive fleet expansion strategy

Personality traits:
- **risk_tolerance**: Probability (0.0-1.0) of choosing risky "A" options in Choice cards
- **expansion_threshold**: Money threshold for buying additional boats

### Crew Share System

Revenue from fishing trips is distributed:
- 50% to the boat owner
- 50% divided among crew based on role shares:
  - Captain: 2.0 shares
  - First Mate: 1.5 shares
  - Engineer: 1.2 shares
  - Deckhand: 1.0 shares

## Key Game Concepts

### Career Progression
Nemi (Student) → Háseti (Deckhand) → Stýrimaður (First Mate) / Vélstjóri (Engineer) → Skipstjóri (Captain) → Útgerðarmaður (Fleet Owner)

### Historical Time Periods
The game spans distinct eras with different rules:
- **1950-1969**: No safety systems, high death rate
- **1970-1983**: Rescue ship *Sæbjörg* improves survival
- **1984+**: ITQ quota system introduced
- **1990+**: Free quota transfer legalized
- **2000+**: Modern safety standards

### Quota System (Post-1984)
Players must manage fish quotas. Catching beyond quota requires:
- Discarding excess (risk of detection)
- Landing illegally (risk of fines)
- Leasing quota from others

## Documentation Structure

- [docs/GDD.md](docs/GDD.md): Master game design document
- [docs/data_models.md](docs/data_models.md): Detailed data structure specifications
- [docs/card_compendium.md](docs/card_compendium.md): Full card descriptions with flavor text and mechanics
- [docs/mechanics.md](docs/mechanics.md): Initial mechanics (merged into GDD)
- [docs/history-research.md](docs/history-research.md): Icelandic maritime history research

## Code Patterns

### Adding New Boats
Add to `SHIPYARD_CATALOG` dictionary with:
- `id`: Unique identifier
- `model_name`: Display name
- `type`: Boat category (Smábátur, Togari, etc.)
- `cost`: Purchase price
- `capacity`: Tonnage capacity
- `base_upkeep`: Fixed costs per trip
- `default_crew_roles`: Dictionary of role names to crew count

### Adding New Cards
Add dictionary to `GAME_DECK` with:
- `id`: Unique identifier (e.g., "GLAEPIR_01")
- `type`: "Immediate Effect", "Choice", or "Keepable"
- `title`: Display name (Icelandic preferred)
- `flavor_text`: Narrative description
- `mechanics`: Dictionary defining card effects

### Card Mechanics Structure
```python
"mechanics": {
    "choices": {"A": {...}, "B": {...}},  # For Choice cards
    "smuggling_check": True,              # For inspection cards
    "roll_required": "1d6",               # Dice notation
    "outcomes": {...},                    # Roll-based results
    "global_effect": "strike",            # Affects all players
    "lose_turn": True                     # Player skips next turn
}
```

## Development Environment

This project runs in Firebase Studio (Google IDX) with Nix configuration in [.idx/dev.nix](.idx/dev.nix):
- Python 3.11
- No external dependencies (uses standard library only)
- Google Cloud SDK available
