
import random
import time
from dataclasses import dataclass, field
from typing import List, Dict, Any
from datetime import datetime, timedelta

# --- CONFIGURATION ---
START_DATE = datetime(1980, 1, 1)
END_DATE = datetime(2025, 1, 1)
STARTING_MONEY = 1000000
STARTING_HEALTH = 100
HEIR_COST = 500000
HEIR_SUCCESS_CHANCE = 0.75
INHERITANCE_TAX = 0.20

# --- DATA MODELS ---
@dataclass
class BoatType:
    id: str
    model_name: str
    cost: int
    capacity: int
    base_upkeep: int
    risk_factor: float # Base chance of a dangerous event

@dataclass
class OwnedBoat:
    instance_id: str
    boat_type_id: str
    name: str
    status: str = "In Harbor"

@dataclass
class Player:
    name: str
    money: int = STARTING_MONEY
    health: int = STARTING_HEALTH
    reputation: int = 0
    fame: int = 0
    klikusambond: int = 0 # Political Capital
    has_heir: bool = False
    is_ai: bool = True
    owned_boats: List[OwnedBoat] = field(default_factory=list)

# --- GAME DATA ---
SHIPYARD_CATALOG = {
    "smabatur_01": BoatType("smabatur_01", "Freyja 8m", 50000, 10, 1500, 0.01),
    "togari_01": BoatType("togari_01", "Sæfari 35m", 450000, 80, 10000, 0.02),
    "frystitogari_01": BoatType("frystitogari_01", "Jökull 50m", 2000000, 150, 35000, 0.005), # Lower risk due to size/safety
}

FISH_TYPES = {
    "Cod": {"base_price": 500, "availability": 1.0},
    "Herring": {"base_price": 300, "availability": 1.0},
}

# --- GAME CLASS ---
class Game:
    def __init__(self, players: List[Player]):
        self.players = players
        self.current_date = START_DATE
        self.current_player_index = 0
        self.global_fish_stocks = {"Cod": 2500000, "Herring": 6000000}
        self.herring_collapse_triggered = False
        self.market_prices = {ft: data["base_price"] for ft, data in FISH_TYPES.items()}
        self.inflation_rate = 0.05

    def get_current_player(self) -> Player:
        return self.players[self.current_player_index]

    def advance_turn(self):
        # Check for player death and succession
        player = self.get_current_player()
        if player.health <= 0:
            self.handle_player_death(player)

        # Advance to next player
        self.current_player_index = (self.current_player_index + 1) % len(self.players)
        if self.current_player_index == 0:
            self.advance_month()

    def advance_month(self):
        last_year = self.current_date.year
        self.current_date += timedelta(days=28)
        if self.current_date.year > last_year:
            self.apply_annual_inflation()
        
        self.regenerate_fish_stocks()
        self.check_for_collapse()
        for p in self.players: # Health degrades over time
            p.health -= 1

    def apply_annual_inflation(self):
        self.inflation_rate = random.uniform(0.02, 0.15)
        print(f"\n~~~ VERÐBÓLGA! Annual Inflation for {self.current_date.year}: {self.inflation_rate:.2%} ~~~")
        for boat_type in SHIPYARD_CATALOG.values():
            boat_type.cost = int(boat_type.cost * (1 + self.inflation_rate))
            boat_type.base_upkeep = int(boat_type.base_upkeep * (1 + self.inflation_rate))

    def regenerate_fish_stocks(self):
        for fish, stock in self.global_fish_stocks.items():
            regen_rate = 1.01 if fish == "Cod" else 1.05
            if self.herring_collapse_triggered and fish == "Herring":
                regen_rate = 1.001 # Very slow recovery
            self.global_fish_stocks[fish] = min(stock * regen_rate, (2500000 if fish == 'Cod' else 6000000))

    def check_for_collapse(self):
        if not self.herring_collapse_triggered and self.global_fish_stocks["Herring"] < 500000:
            self.herring_collapse_triggered = True
            print("\n" + "="*70)
            print("### 💥 SÍLDARHRUNIÐ! The Herring stock has collapsed! ###")
            print("="*70)
            for p in self.players:
                p.money *= 0.7 # Economic shock
                p.reputation = max(0, p.reputation - 20)

    def handle_player_death(self, player: Player):
        print(f"\n--- ✝️  A Titan Falls: {player.name} has died. ---")
        if player.has_heir:
            new_money = int(player.money * (1 - INHERITANCE_TAX))
            print(f"  The dynasty continues! An heir inherits the empire.")
            print(f"  Erfðaskattur (Inheritance Tax) of {INHERITANCE_TAX:.0%} costs the family {int(player.money * INHERITANCE_TAX):,} kr.")
            # Reset player state for the heir
            player.health = STARTING_HEALTH
            player.money = new_money
            player.reputation = 0 # Heir must build their own reputation
            player.fame = int(player.fame / 2) # Legacy fame
            player.has_heir = False # The new generation needs their own heir
        else:
            print("  With no heir, the dynasty ends. The company is dissolved, its assets scattered.")
            self.players.remove(player)

    # --- PLAYER ACTIONS ---
    def simulate_player_turn(self, player: Player):
        print(f"\n--- {self.current_date.strftime('%B %Y')}, Magnate: {player.name} ---")
        print(f"  Health: {player.health} | Money: {int(player.money):,} kr | Rep: {player.reputation} | Fame: {player.fame} | Klik: {player.klikusambond}")
        
        # Strategic Decision Making (AI)
        if player.is_ai:
            self.ai_decision_making(player)
        else:
            self.player_decision_making(player)

    def ai_decision_making(self, player: Player):
        # Simple AI: Always fish, try for heir if rich and unhealthy
        if player.money > HEIR_COST * 2 and player.health < 40 and not player.has_heir:
            self.attempt_heir(player)
        else:
            self.go_fishing(player, player.owned_boats[0])
    
    def player_decision_making(self, player: Player):
        # For the human player, we'd present choices. Here we simulate one path.
        if player.money > HEIR_COST and player.health < 50 and not player.has_heir:
             self.attempt_heir(player)
        else:
            self.go_fishing(player, player.owned_boats[0])

    def attempt_heir(self, player: Player):
        print(f"  !! {player.name} is focusing on securing the dynasty...")
        player.money -= HEIR_COST
        if random.random() < HEIR_SUCCESS_CHANCE:
            player.has_heir = True
            player.health += 10 # Renewed vigor!
            print("  -- SUCCESS! An heir is born! The future is secure.")
        else:
            print("  -- TRAGEDY! Efforts to produce an heir have failed this time.")

    def go_fishing(self, player: Player, boat: OwnedBoat):
        boat_type = SHIPYARD_CATALOG[boat.boat_type_id]

        # Safety & Risk
        if random.random() < boat_type.risk_factor:
            self.handle_disaster_at_sea(player, boat)
            return
        
        target_fish = "Herring" if not self.herring_collapse_triggered else "Cod"
        catch_amount = int(boat_type.capacity * random.uniform(0.7, 1.3))
        revenue = catch_amount * self.market_prices[target_fish]
        net_profit = revenue - boat_type.base_upkeep
        player.money += net_profit

        print(f"  🎣 Fishing trip successful. Target: {target_fish}. Net Profit: {int(net_profit):,} kr.")

    def handle_disaster_at_sea(self, player: Player, boat: OwnedBoat):
        print(f"  >>> ☠️ DISASTER! The {boat.name} is lost at sea! <<<")
        player.owned_boats.remove(boat)
        player.reputation -= 10
        player.fame += 5 # Tragedies make you famous
        player.health -= 25 # The stress takes a heavy toll
        # Financial impact mitigated by Klikusambond (insurance fraud, etc.)
        loss_percent = 0.10 - (player.klikusambond * 0.01)
        money_lost = int(player.money * loss_percent)
        player.money -= money_lost
        print(f"  The tragedy costs {player.name} {money_lost:,} kr and a piece of their soul.")
        if not player.owned_boats:
             print("  With no boats left, they are ruined!")
             self.players.remove(player)


# --- MAIN GAME LOOP ---
def main():
    players = [
        Player(name="You", is_ai=False, klikusambond=5),
        Player(name="Guðrún", money=800000), # Conservative
        Player(name="Björn", money=1200000, klikusambond=10), # Aggressive & Connected
    ]

    game = Game(players)

    for p in players:
        boat_id = "togari_01" if p.money > 1000000 else "smabatur_01"
        boat_type = SHIPYARD_CATALOG[boat_id]
        p.money -= boat_type.cost
        p.owned_boats.append(OwnedBoat(instance_id=f"boat_{p.name}", boat_type_id=boat_id, name=boat_type.model_name))

    print("\n" + "="*70)
    print("      TOGARAVELDI: Dynasty & Disaster")
    print(f"                   The year is {game.current_date.year}. A new age of capitalism begins.")
    print("="*70 + "\n")

    while game.current_date < END_DATE and len(game.players) > 1:
        player = game.get_current_player()
        game.simulate_player_turn(player)
        game.advance_turn()
        time.sleep(0.1)

    print("\n" + "="*70)
    print("FINAL STANDINGS")
    print(f"The simulation ended in {game.current_date.strftime('%B %Y')}.")
    print("="*70)
    # Sort remaining players by money
    sorted_players = sorted(game.players, key=lambda x: x.money, reverse=True)
    for i, p in enumerate(sorted_players, 1):
        print(f"{i}. {p.name}: {int(p.money):,} kr | Health: {p.health} | Heir: {p.has_heir}")

if __name__ == "__main__":
    main()
