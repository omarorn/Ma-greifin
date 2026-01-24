"""
Togaraveldi - AI Rival Logic

Defines AI personalities and decision-making for rival companies.
"""

from models import Company, Game
from shipyard import SHIPYARD_CATALOG, create_boat_instance
from typing import Optional
import random


# =============================================================================
# AI PERSONALITIES
# =============================================================================

class AIPersonality:
    """Base class for AI decision-making personalities"""

    def __init__(self, name: str):
        self.name = name

    def should_go_to_england(self, company: Company, game: Game) -> bool:
        """Decide whether to take risky England trip"""
        raise NotImplementedError

    def should_buy_boat(self, company: Company, game: Game) -> Optional[str]:
        """Decide whether to buy a boat, returns blueprint_id or None"""
        raise NotImplementedError

    def should_smuggle(self, company: Company) -> bool:
        """Decide whether to accept smuggling opportunity"""
        raise NotImplementedError

    def should_invest_bonds(self, company: Company) -> int:
        """Decide how much to invest in government bonds"""
        raise NotImplementedError


class AggressiveAI(AIPersonality):
    """High-risk, high-reward strategy - "Hafgengill hf."

    Philosophy:
    - Aggressively pursue English market (high prices)
    - Take smuggling opportunities
    - Rapid fleet expansion
    - Low investment in safe bonds
    """

    def should_go_to_england(self, company: Company, game: Game) -> bool:
        # Go if price is decent and has trawler
        has_trawler = any(
            SHIPYARD_CATALOG[boat.blueprint_id].boat_type == "Trawler"
            for boat in company.owned_boats
        )
        return has_trawler and game.english_market_price > 700

    def should_buy_boat(self, company: Company, game: Game) -> Optional[str]:
        # Aggressive expansion - buy when can afford 60% of cost
        if company.money > 500000 and len(company.owned_boats) < 2:
            return "togari_01"  # Buy trawler
        elif company.money > 250000 and len(company.owned_boats) < 1:
            return "smabatur_02"
        return None

    def should_smuggle(self, company: Company) -> bool:
        # Usually smuggles (80% chance)
        return random.random() < 0.8

    def should_invest_bonds(self, company: Company) -> int:
        # Minimal bond investment (10% of excess cash)
        excess = max(0, company.money - 420000)
        return int(excess * 0.1)


class ConservativeAI(AIPersonality):
    """Low-risk, steady growth - "Norðursjórinn ehf."

    Philosophy:
    - Prefer local Icelandic market
    - Only go to England when prices are very high
    - Heavy investment in government bonds
    - Avoid smuggling
    - Cautious fleet expansion
    """

    def should_go_to_england(self, company: Company, game: Game) -> bool:
        # Only go if price is VERY high and weather is good
        has_trawler = any(
            SHIPYARD_CATALOG[boat.blueprint_id].boat_type == "Trawler"
            for boat in company.owned_boats
        )
        return has_trawler and game.english_market_price > 900

    def should_buy_boat(self, company: Company, game: Game) -> Optional[str]:
        # Conservative - needs 150% of cost before buying
        if company.money > 630000 and len(company.owned_boats) < 2:
            return "togari_01"
        elif company.money > 126000 and len(company.owned_boats) < 1:
            return "smabatur_02"
        return None

    def should_smuggle(self, company: Company) -> bool:
        # Rarely smuggles (10% chance)
        return random.random() < 0.1

    def should_invest_bonds(self, company: Company) -> int:
        # Heavy bond investment (40% of excess cash)
        excess = max(0, company.money - 420000)
        return int(excess * 0.4)


class BotAI(AIPersonality):
    """Simple bot - fills the market with competition

    Philosophy:
    - Stick to local fishing
    - Basic decisions
    - Moderate risk
    """

    def should_go_to_england(self, company: Company, game: Game) -> bool:
        return False  # Bots never go to England

    def should_buy_boat(self, company: Company, game: Game) -> Optional[str]:
        # Buy first boat when can afford
        if company.money > 60000 and len(company.owned_boats) < 1:
            return "smabatur_01"
        return None

    def should_smuggle(self, company: Company) -> bool:
        return random.random() < 0.3  # 30% chance

    def should_invest_bonds(self, company: Company) -> int:
        return 0  # Bots don't invest


# =============================================================================
# AI PERSONALITY REGISTRY
# =============================================================================

AI_PERSONALITIES = {
    "Aggressive": AggressiveAI("Aggressive"),
    "Conservative": ConservativeAI("Conservative"),
    "Bot": BotAI("Bot")
}


def create_ai_company(name: str, ai_type: str, starting_money: int = 420000) -> Company:
    """
    Create an AI-controlled company with a specific personality.

    Args:
        name: Company name
        ai_type: "Aggressive", "Conservative", or "Bot"
        starting_money: Initial capital

    Returns:
        New AI company
    """
    if ai_type not in AI_PERSONALITIES:
        raise ValueError(f"Invalid AI type: {ai_type}")

    return Company(
        name=name,
        money=starting_money,
        ai_controller=ai_type,
        reputation=50,
        crew_morale=70
    )


def execute_ai_turn(company: Company, game: Game):
    """Execute a full turn for an AI-controlled company"""

    if not company.ai_controller:
        return  # Not an AI

    personality = AI_PERSONALITIES[company.ai_controller]

    # 1. Investment Decision (bonds)
    bond_investment = personality.should_invest_bonds(company)
    if bond_investment > 0:
        company.money -= bond_investment
        company.government_bonds += bond_investment

    # 2. Fleet Expansion Decision
    boat_to_buy = personality.should_buy_boat(company, game)
    if boat_to_buy and boat_to_buy in SHIPYARD_CATALOG:
        blueprint = SHIPYARD_CATALOG[boat_to_buy]
        if company.money >= blueprint.cost:
            company.money -= blueprint.cost
            new_boat = create_boat_instance(
                boat_to_buy,
                company.name,
                len(company.owned_boats) + 1
            )
            company.owned_boats.append(new_boat)
            print(f"  [AI] {company.name} bought {blueprint.model_name}")

    # 3. Fishing Trip Decision (handled in economy module)
    # This is deferred to the fishing phase

    # 4. Criminal Opportunity (if presented)
    # This is handled by event cards


# Alias for compatibility with game.py
ai_take_turn = execute_ai_turn
