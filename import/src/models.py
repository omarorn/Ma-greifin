"""
Togaraveldi - Core Data Models (v2.0)

This module contains all game data structures as defined in docs/data_models.md v2.0.

Design Philosophy: "Crime Pays Over Real"
- Legitimate business is steady but slow
- Criminal activity (smuggling, tax evasion, crew exploitation) is MORE profitable
- The game creates moral tension by making unethical choices mechanically superior
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum

# =============================================================================
# CORE ENTITY: COMPANY
# =============================================================================

@dataclass
class Company:
    """
    The central entity - represents player or AI rival company.

    The Company model tracks everything from cold hard cash to hot political capital.
    """
    # --- Core Financials ---
    name: str
    money: int
    net_worth: int = 0  # Calculated: money + boat value + investments

    # Hidden timestamp for last major transaction (easter egg tracking)
    _last_transaction_hour: int = 16
    _last_transaction_minute: int = 20

    # --- Assets ---
    owned_boats: List['OwnedBoat'] = field(default_factory=list)
    investments: Dict[str, int] = field(default_factory=dict)  # {"rikiskuldabref": 500000}

    # --- Social & Political Standing ---
    fame: int = 0           # Public notoriety from scandals (0-100+)
    klikusambond: int = 0   # Hidden political capital for influencing elections
    reputation: int = 50    # General public/business standing (0-100)

    # --- Crew & Operations ---
    crew_morale: int = 70   # Affects performance and skimming (0-100)

    # --- Health & Nutrition (New!) ---
    health: int = 100               # Overall health (0-100)
    b12_level: int = 100            # Vitamin B12 stores (0-100)
    teeth_lost: int = 0             # Lost from scurvy/malnutrition
    turns_since_doctor: int = 0     # Turns since last medical checkup
    has_cognitive_decline: bool = False  # Alzheimer's-like effects from B12 deficiency

    # --- Gameplay Mechanics ---
    ai_controller: Optional[str] = None  # 'Aggressive', 'Conservative', 'Bot', or None for player
    suspicion_score: int = 0             # Hidden score that triggers tax investigations
    is_under_investigation: bool = False
    misses_next_turn: bool = False

    # --- Catch & Inventory ---
    catch_in_hold: Dict[str, int] = field(default_factory=dict)  # {"Cod": 10, "Skate": 2}

    # --- Financial Instruments ---
    visa_credit_limit: int = 0           # Available credit line
    visa_current_debt: int = 0           # Current debt on credit line
    government_bonds: int = 0            # Investment in safe bonds

    # --- Personal Assets (Visual Progression) ---
    house_tier: int = 0  # Used to look up ASSET_TIERS
    car_tier: int = 0

    def calculate_net_worth(self, boat_values: Dict[str, int]) -> int:
        """Calculate total net worth including all assets"""
        boat_value = sum(boat_values.get(boat.blueprint_id, 0) for boat in self.owned_boats)
        return self.money + boat_value + self.government_bonds - self.visa_current_debt


# =============================================================================
# BOATS & SHIPYARD
# =============================================================================

@dataclass
class BoatBlueprint:
    """
    Static definition of a boat model available at shipyard.
    The 'catalog' entry.
    """
    id: str
    model_name: str
    cost: int
    capacity: int      # Tons of fish
    base_upkeep: int   # Operating cost per trip
    boat_type: str     # "Inshore", "Trawler", "Factory"

    # Safety & Risk
    base_risk_factor: float = 0.05  # Base chance of disaster (5%)
    safety_upgrades: List[str] = field(default_factory=list)  # IDs of available upgrades


@dataclass
class OwnedBoat:
    """
    A specific boat instance owned by a Company.
    """
    instance_id: str
    blueprint_id: str
    custom_name: str
    crew_members: List['CrewMember'] = field(default_factory=list)
    current_upgrades: List[str] = field(default_factory=list)  # IDs of purchased safety upgrades
    maintenance_level: float = 1.0  # 0.0 to 1.0, affects performance


@dataclass
class SafetyUpgrade:
    """
    An upgrade available at the shipyard to reduce disaster risk.

    Historical context: Safety equipment evolved dramatically from 1950s-2000s.
    """
    id: str
    name: str
    cost: int
    risk_reduction: float  # Multiplier to reduce boat's risk_factor (e.g., 0.8 = 20% reduction)
    description: str
    era_available: int = 1950  # Year when this technology became available


# =============================================================================
# CREW SYSTEM
# =============================================================================

@dataclass
class CrewMember:
    """
    Individual crew member with personal history.

    Design Note: Crews are not just numbers - they're families, communities, tragedies.
    """
    name: str
    role: str  # "Captain", "First Mate", "Engineer", "Deckhand"
    hometown: str  # "Vestmannaeyjar", "Ísafjörður", "Reykjavík", etc.
    family_name: str  # Used to track family connections
    share: float = 1.0  # Share of crew pot (Captain=2.0, Deckhand=1.0)
    experience: int = 0  # Increases performance over time


# =============================================================================
# GAME STATE
# =============================================================================

class Season(Enum):
    """Seasons affect fish availability and market prices"""
    SPRING = "Spring"
    SUMMER = "Summer"
    AUTUMN = "Autumn"
    WINTER = "Winter"


@dataclass
class Game:
    """
    Manages the global state of the game world.
    """
    companies: List[Company]
    current_turn: int = 1
    year: int = 1900  # Starting year (beginning of modern Iceland)

    # --- Market Prices (Per Ton) ---
    icelandic_market_price: Dict[str, int] = field(default_factory=lambda: {
        "Cod": 420,
        "Haddock": 342,
        "Skate": 620
    })
    english_market_price: int = 842  # Hull, England - higher but riskier

    # --- Verðbólga (Inflation) ---
    annual_inflation_rate: float = 0.04  # 4% base inflation (realistic for Iceland)
    cumulative_inflation: float = 1.0   # Tracks total inflation since 1900

    # --- Market Demand (New!) ---
    market_demand: Dict[str, str] = field(default_factory=lambda: {
        "Cod": "normal",
        "Haddock": "normal",
        "Skate": "normal"
    })  # "high", "normal", "low", "none"

    # --- Fish Availability (New!) ---
    fish_available: Dict[str, bool] = field(default_factory=lambda: {
        "Cod": True,
        "Haddock": True,
        "Skate": True
    })  # Sometimes fish just aren't there!

    # --- Seasonal Context ---
    month: int = 4  # Start in April (4/20 month)
    day: int = 20   # Subtle (also: spring fishing season!)

    # --- Events & Modifiers ---
    active_modifiers: List[Dict] = field(default_factory=list)
    upcoming_events: List[Dict] = field(default_factory=list)
    event_deck: List['GameCard'] = field(default_factory=list)

    # --- Communication & Narrative ---
    chat_log: List[str] = field(default_factory=list)
    news_headlines: List[str] = field(default_factory=list)

    # --- Endgame Tracking ---
    presidential_election_turn: Optional[int] = None  # When next election happens

    @property
    def current_season(self) -> Season:
        """Calculate current season from month"""
        if self.month in [3, 4, 5]:
            return Season.SPRING
        elif self.month in [6, 7, 8]:
            return Season.SUMMER
        elif self.month in [9, 10, 11]:
            return Season.AUTUMN
        else:
            return Season.WINTER

    def get_seasonal_price_modifier(self, fish: str) -> float:
        """
        Returns price multiplier based on season and fish type.

        Authentic Economics:
        - Skate is premium in December (Þorláksmessa tradition)
        - Cod is premium before Þorrablót (late January/February)
        """
        season = self.current_season

        if fish == "Skate" and self.month == 12:
            return 1.8  # 80% premium in December
        elif fish == "Cod" and self.month in [1, 2]:
            return 1.4  # 40% premium before Þorrablót
        elif fish == "Haddock" and season == Season.SUMMER:
            return 1.2  # Slight summer premium

        return 1.0  # No modifier


# =============================================================================
# EVENT SYSTEM
# =============================================================================

@dataclass
class GameCard:
    """
    Dynamic event card with flexible requirements and outcomes.

    This replaces rigid card types with a data-driven system.
    """
    id: str
    title: str
    description: str
    deck: str  # "Glæpir", "Klíkan", "Saga", "Kvóti"

    # --- Dynamic Requirements ---
    requirements: List[Dict] = field(default_factory=list)
    # Example: [{"stat": "fame", "op": "gte", "value": 50}]

    # --- Multiple Outcomes (Player Choices) ---
    outcomes: List[Dict] = field(default_factory=list)
    # Example: [
    #   {"choice": "Hringja í lögfræðinginn",
    #    "cost": {"money": 500000},
    #    "effects": [{"stat": "fame", "op": "add", "value": 20}]
    #   }
    # ]


# =============================================================================
# ASSET PROGRESSION TIERS
# =============================================================================

ASSET_TIERS = {
    0: {
        "house": "Small Apartment in Breiðholt",
        "car": "Lada Sport",
        "threshold": 0
    },
    420000: {
        "house": "Row House in Kópavogur",
        "car": "Toyota Corolla",
        "threshold": 420000
    },
    1620000: {
        "house": "Detached House in Hafnarfjörður",
        "car": "Land Rover Defender",
        "threshold": 1620000
    },
    4200000: {
        "house": "Villa in Garðabær",
        "car": "Range Rover Classic",
        "threshold": 4200000
    },
    16200000: {
        "house": "Mansion in Seltjarnarnes",
        "car": "Rolls Royce Silver Spirit",
        "threshold": 16200000
    }
}


# =============================================================================
# HOMETOWNS & COMMUNITIES
# =============================================================================

ICELANDIC_HOMETOWNS = [
    "Reykjavík",
    "Vestmannaeyjar",
    "Ísafjörður",
    "Akureyri",
    "Grindavík",
    "Bolungarvík",
    "Siglufjörður"
]

# Historic family names by region (for authentic crew generation)
FAMILY_NAMES_BY_HOMETOWN = {
    "Vestmannaeyjar": ["Sigurðsson", "Jónsson", "Pétursson", "Einarsson"],
    "Ísafjörður": ["Ólafsson", "Gunnarsson", "Þórðarson", "Magnússon"],
    "Reykjavík": ["Árnason", "Kristjánsson", "Guðmundsson", "Stefánsson"],
    "Grindavík": ["Halldórsson", "Jóhannesson", "Björnsson", "Elíasson"],
    "Akureyri": ["Pálsson", "Helgason", "Ragnarsson", "Ingólfsson"],
    "Bolungarvík": ["Friðriksson", "Oddsson", "Hannesson", "Vilhjálmsson"],
    "Siglufjörður": ["Baldursson", "Eiríksson", "Benediktsson", "Andrésson"]
}


# =============================================================================
# CONSTANTS: GAME BALANCE
# =============================================================================

class GameConstants:
    """
    Core balance values that encode "Crime Pays Over Real"
    """
    # Legitimate Business (SLOW but SAFE)
    HONEST_FISHING_BASE_PROFIT = 4200    # kr per trip
    GOVERNMENT_BOND_ANNUAL_RETURN = 0.042  # 4.2% annual return

    # Criminal Activity (FAST but RISKY)
    SMUGGLING_BASE_PROFIT = 42000        # 10x more profitable than honest work!
    SMUGGLING_RISK_OF_CAPTURE = 0.16     # 16% chance (4+12=16)
    TAX_EVASION_BONUS = 0.20              # Evading taxes = 20% more profit

    # Crew Exploitation
    CREW_NORMAL_SHARE = 0.50             # Crew gets 50% of net profit (fair)
    CREW_GREED_MULTIPLIER = 1.5          # But when greedy, they take 1.5x more!
    LOW_MORALE_THRESHOLD = 42            # Below this, crew may turn greedy

    # Scandal & Fame
    LAWYER_FEE_BASE = 420000             # Cost to "Hringja í lögfræðinginn"
    FAME_GAIN_FROM_SCANDAL = 20          # Scandal → Fame boost
    SUSPICION_INVESTIGATION_THRESHOLD = 104  # Triggers tax investigation (4+20*5)

    # Political Endgame
    POLITICAL_CAPITAL_FOR_VICTORY = 420  # Klíkusambönd needed to win election
    RESTORATION_OF_HONOR_REQUIREMENT = 1620  # Fame needed for "Uppreisn Æru"

    # Health & Nutrition (New!)
    B12_DEPLETION_PER_TURN = 2           # B12 drops 2 points per turn at sea
    DOCTOR_VISIT_COST = 4200             # Cost to visit doctor
    TEETH_LOSS_THRESHOLD = 42            # Lose teeth when B12 < 42
    COGNITIVE_DECLINE_THRESHOLD = 20     # Alzheimer's-like effects when B12 < 20
    HEALTH_DEGRADATION_RATE = 1          # Health drops when B12 is low


if __name__ == "__main__":
    # Test the models
    player = Company(name="Togaraveldi hf.", money=500000)
    print(f"✓ Models loaded successfully")
    print(f"  Player: {player.name}")
    print(f"  Starting money: {player.money:,} kr")
    print(f"  Reputation: {player.reputation}")
    print(f"  Crime Pays: Smuggling profit is {GameConstants.SMUGGLING_BASE_PROFIT / GameConstants.HONEST_FISHING_BASE_PROFIT:.0f}x honest work!")
