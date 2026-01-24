import random
import time
from dataclasses import dataclass, field
from typing import List, Dict, Any

# --- Data Models ---

@dataclass
class CrewMember:
    name: str
    role: str
    share: float

@dataclass
class BoatType:
    id: str
    model_name: str
    type: str
    cost: int
    capacity: int
    base_upkeep: int
    default_crew_roles: Dict[str, int]

@dataclass
class OwnedBoat:
    instance_id: str
    boat_type_id: str
    name: str
    crew: List[CrewMember] = field(default_factory=list)
    current_catch: Dict[str, int] = field(default_factory=dict)
    status: str = "In Harbor"

@dataclass
class Player:
    name: str
    money: int = 420000
    reputation: int = 0
    fame: int = 0
    health: int = 100
    has_heir: bool = False
    owned_boats: List[OwnedBoat] = field(default_factory=list)
    quota: Dict[str, int] = field(default_factory=dict)
    investments: Dict[str, int] = field(default_factory=dict)
    has_smuggled_goods: bool = False
    keepable_cards: List[Dict] = field(default_factory=list)
    misses_next_turn: bool = False
    is_ai: bool = True
    strategy_notes: List[str] = field(default_factory=list)  # Track AI decision reasoning

# --- Expanded Shipyard Catalog ---

SHIPYARD_CATALOG = {
    # Small Boats (Smábátur) - Entry level
    "smabatur_01": BoatType(
        id="smabatur_01", model_name="Freyja 8m", type="Smábátur",
        cost=50000, capacity=10, base_upkeep=1000,  # Balanced
        default_crew_roles={"Captain": 1, "Deckhand": 1}
    ),
    "smabatur_02": BoatType(
        id="smabatur_02", model_name="Sól 10m", type="Smábátur",
        cost=85000, capacity=15, base_upkeep=1500,  # Balanced
        default_crew_roles={"Captain": 1, "Deckhand": 1}
    ),
    "smabatur_03": BoatType(
        id="smabatur_03", model_name="Víkingur 12m", type="Smábátur",
        cost=150000, capacity=25, base_upkeep=2500,  # Balanced
        default_crew_roles={"Captain": 1, "First Mate": 1, "Deckhand": 2}
    ),

    # Medium Trawlers (Togari) - Mid game
    "togari_01": BoatType(
        id="togari_01", model_name="Sæfari 35m", type="Togari",
        cost=450000, capacity=65, base_upkeep=8000,  # Balanced
        default_crew_roles={"Captain": 1, "First Mate": 1, "Engineer": 1, "Deckhand": 3}
    ),
    # ... (rest of the catalog)
}

# --- Expanded Game Deck ---

GAME_DECK = [
    # ... (existing cards)
    {
        "id": "KLIKAN_04", "type": "Choice", "title": "Skuggalegar Fjárfestingar (Shady Investments)",
        "flavor_text": "An eccentric broker offers a tip on some... unusual commodities.",
        "mechanics": {
            "choices": {
                "A": {"investment": "Face Masks", "cost": 10000, "message": "You've invested in... face masks. A bold strategy."},
                "B": {"investment": "Toilet Paper", "cost": 10000, "message": "You've cornered the market on toilet paper. The world holds its breath."},
                "C": {"investment": "Hand Sanitizer", "cost": 10000, "message": "You've bought a tanker of hand sanitizer. Your hands have never been cleaner."}
            }
        }
    },
    {
        "id": "SAGA_05", "type": "Immediate Effect", "title": "Heimsfaraldur (Pandemic)",
        "flavor_text": "A novel coronavirus sweeps the globe, bringing the world to a standstill...",
        "mechanics": {"pandemic": True, "message": "The world has changed overnight."}
    },
    {
        "id": "SAGA_06", "type": "Choice", "title": "Læknisheimsókn (Doctor's Visit)",
        "flavor_text": "You've been feeling a bit... off. Maybe it's time for a check-up.",
        "mechanics": {
            "choices": {
                "A": {"health": 10, "cost": 5000, "message": "You visit the doctor and get a clean bill of health."},
                "B": {"health": -15, "message": "You ignore your health. What's the worst that could happen?"}
            }
        }
    },
        {
        "id": "SAGA_07", "type": "Immediate Effect", "title": "Loðnubrestur (Capelin Crash)",
        "flavor_text": "The capelin stocks have collapsed! The fishing grounds are barren.",
        "mechanics": {"loðna_crash": True, "message": "The lucrative capelin season is a total loss."}
    },
]

# --- AI Personality System (Autonomous Agents) ---

AI_PERSONALITIES = {
    # ... (existing personalities)
}

# --- Game Class ---

class Game:
    def __init__(self, players: List[Player]):
        self.players = players
        self.current_turn = 1
        self.current_player_index = 0
        self.game_deck = []
        self.discard_pile = GAME_DECK.copy()
        self.market_prices = {"Cod": 450, "Haddock": 350, "Skate": 200, "Loðna": 150}
        self.bonus_catch_multiplier = 1.0
        self.is_pandemic = False
        self.loðna_crash = False
        self.shuffle_deck()
        self._distribute_initial_quota()

    def _distribute_initial_quota(self):
        for player in self.players:
            player.quota = {"Cod": 100, "Haddock": 50, "Skate": 25, "Loðna": 200}

    def shuffle_deck(self):
        print("--- Event deck shuffled ---")
        # Add pandemic card after turn 468 (Year 2019)
        if self.current_turn > 468 and not any(c['id'] == 'SAGA_05' for c in self.game_deck):
            self.game_deck.append(next(c for c in GAME_DECK if c['id'] == 'SAGA_05'))

        random.shuffle(self.discard_pile)
        self.game_deck.extend(self.discard_pile)
        self.discard_pile = []

    def update_market_prices(self):
        if self.is_pandemic:
            for fish_type in self.market_prices:
                self.market_prices[fish_type] = max(50, self.market_prices[fish_type] - 100)
            return
        if self.loðna_crash:
            self.market_prices["Loðna"] = 10 # Effectively worthless

        for fish_type in self.market_prices:
            # More volatile swings
            change = random.randint(-150, 160)
            self.market_prices[fish_type] = max(100, min(1200, self.market_prices[fish_type] + change))

    # ... (other game methods)

    def _simulate_fishing_trip(self, player: Player, boat: OwnedBoat):
        # ... (previous logic)

        # Check against quota
        for fish, amount in boat.current_catch.items():
            if amount > player.quota.get(fish, 0):
                if player.is_ai and random.random() < AI_PERSONALITIES[player.name]["risk_tolerance"]:
                    print(f"  {player.name} is overfishing {fish}! A risky move.")
                    player.reputation -=1
                else:
                    boat.current_catch[fish] = player.quota.get(fish, 0)
                    print(f"  {player.name} respects the {fish} quota.")

            player.quota[fish] = player.quota.get(fish, 0) - boat.current_catch[fish]

        # Seasonal Catch (Loðna in winter)
        if self.current_turn % 12 in [0, 1, 2]: # Jan, Feb, Dec
            if not self.loðna_crash:
                lodna_catch = random.randint(boat_type.capacity, boat_type.capacity * 3)
                boat.current_catch["Loðna"] = lodna_catch

        trip_revenue = sum(self.market_prices[fish] * amount for fish, amount in boat.current_catch.items())
        print(f"  🎣 {boat.name}: {sum(boat.current_catch.values())}t catch worth {trip_revenue:,} kr")
        self._calculate_and_distribute_shares(player, boat, trip_revenue)

    def resolve_card(self, player: Player):
        card = self.draw_card()
        print(f"\n  🎴 Event: {card['title']}")
        mechanics = card.get("mechanics", {})

        if card['id'] == 'SAGA_05': # Pandemic
            self.is_pandemic = True
            for p in self.players:
                p.health -= 20
                p.reputation -= 5
                for investment, amount in p.investments.items():
                    if investment in ["Face Masks", "Toilet Paper", "Hand Sanitizer"]:
                        payout = amount * 100
                        p.money += payout
                        print(f"  💸 {p.name}'s investment in {investment} paid off! +{payout:,} kr")
            print(f"  Pandemic has hit! Fish prices are crashing, and all players suffer health and reputation damage.")

        if card['id'] == 'SAGA_07': # Capelin Crash
            self.loðna_crash = True
            print(f"  The capelin have vanished! The market has crashed.")

        if card['id'] == 'KLIKAN_04': # Shady Investments
            # AI logic for choosing an investment
            choice = random.choice(['A', 'B', 'C'])
            outcome = mechanics["choices"][choice]
            investment = outcome["investment"]
            cost = outcome["cost"]
            if player.money >= cost:
                player.money -= cost
                player.investments[investment] = player.investments.get(investment, 0) + cost
                print(f"  {player.name} invests in {investment}.")

        if card['id'] == 'SAGA_06': # Doctor's Visit
            # AI logic for health choices
            choice = 'A' if player.health < 50 else 'B'
            outcome = mechanics["choices"][choice]
            player.health += outcome.get("health", 0)
            player.money -= outcome.get("cost", 0)
            print(f"  {player.name} chooses to {('visit the doctor.' if choice == 'A' else 'tough it out.')}")

        # ... (rest of the card resolution logic)

    def _check_for_death(self, player: Player):
        if player.health <= 0:
            print(f"\n💀 {player.name} has died of neglect. Their empire rusts. ")
            self.players.remove(player)

# --- Main Simulation ---

if __name__ == "__main__":
    players = []
    # ... (player initialization)
    game = Game(players=players)

    # ... (simulation loop)
    # At the end of each year (12 turns), check for death and other year-end events
    if game.current_turn % 12 == 0:
        for p in list(game.players):
            game._check_for_boredom(p)
            game._check_for_death(p)

