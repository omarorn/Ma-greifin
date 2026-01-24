"""
Togaraveldi - Economic Engine

Manages fishing trips, market dynamics, and fish species.
"""

from models import Company, Game, GameConstants
from shipyard import SHIPYARD_CATALOG
import random


# =============================================================================
# FISH SPECIES & CATCHES
# =============================================================================

FISH_SPECIES = ["Cod", "Haddock", "Skate"]


def simulate_fishing_catch(boat_capacity: int, game: Game) -> dict[str, int]:
    """
    Simulate a fishing trip's catch distribution.

    Args:
        boat_capacity: Tons the boat can hold
        game: Current game state (for seasonal modifiers and availability)

    Returns:
        Dictionary of fish species to tonnage caught
    """
    # Base catch is random between 50-100% of capacity
    total_catch = random.randint(
        int(boat_capacity * 0.5),
        boat_capacity
    )

    # Distribute catch across species with seasonal weighting
    catch = {}
    season = game.current_season

    # Weights vary by season
    if season.name == "WINTER":
        # Winter: More Cod, less Skate
        weights = {"Cod": 0.6, "Haddock": 0.3, "Skate": 0.1}
    elif season.name == "SPRING":
        weights = {"Cod": 0.5, "Haddock": 0.3, "Skate": 0.2}
    elif season.name == "SUMMER":
        # Summer: More Haddock
        weights = {"Cod": 0.3, "Haddock": 0.5, "Skate": 0.2}
    else:  # AUTUMN
        # Autumn: More Skate
        weights = {"Cod": 0.3, "Haddock": 0.3, "Skate": 0.4}

    # NEW: Check fish availability (sometimes species just aren't there!)
    for fish, weight in weights.items():
        if game.fish_available.get(fish, True):
            catch[fish] = int(total_catch * weight)
        else:
            # No fish available this season!
            catch[fish] = 0

    return catch


def calculate_catch_value(catch: dict[str, int], game: Game, use_english_market: bool = False) -> int:
    """
    Calculate total value of a catch at current market prices.

    Args:
        catch: Dictionary of fish to tonnage
        game: Current game state (for prices, seasonal modifiers, and DEMAND)
        use_english_market: If True, use English prices (flat rate)

    Returns:
        Total value in kr
    """
    if use_english_market:
        # England pays flat rate for all fish
        total_tons = sum(catch.values())
        return total_tons * game.english_market_price

    # Icelandic market: species-specific pricing with seasonal modifiers AND DEMAND
    total_value = 0
    for fish, tons in catch.items():
        base_price = game.icelandic_market_price.get(fish, 420)
        seasonal_modifier = game.get_seasonal_price_modifier(fish)

        # NEW: Apply demand multiplier
        demand_modifier = get_demand_multiplier(game.market_demand.get(fish, "normal"))

        price = int(base_price * seasonal_modifier * demand_modifier)
        total_value += tons * price

    return total_value


def get_demand_multiplier(demand: str) -> float:
    """
    Convert demand level to price multiplier.

    high demand = 2x price
    normal = 1x
    low = 0.5x
    none = 0.1x (almost worthless)
    """
    multipliers = {
        "high": 2.0,      # EFTIRSPURN! Demand is hot!
        "normal": 1.0,
        "low": 0.5,
        "none": 0.1       # ENGIN EFTIRSPURN! No demand at all!
    }
    return multipliers.get(demand, 1.0)


def local_fishing_trip(company: Company, game: Game):
    """
    Execute a local fishing trip (Icelandic waters).

    This is the HONEST, SAFE way to make money - but it's slow.
    NEW: Also degrades health from poor nutrition at sea!
    """
    # NEW: Health degradation from being at sea
    from health import process_health_degradation, apply_cognitive_decline_effects

    # Check for cognitive decline penalty
    efficiency = apply_cognitive_decline_effects(company)

    total_earnings = 0
    total_upkeep = 0

    for boat in company.owned_boats:
        blueprint = SHIPYARD_CATALOG[boat.blueprint_id]

        # Only small boats do local trips
        if blueprint.boat_type != "Inshore":
            continue

        # Simulate catch (reduced by cognitive decline)
        base_catch = simulate_fishing_catch(int(blueprint.capacity * efficiency), game)

        # Check if any fish were unavailable
        if any(tons == 0 for tons in base_catch.values()):
            if company.ai_controller is None:
                unavailable = [fish for fish, tons in base_catch.items() if tons == 0]
                if unavailable:
                    print(f"  ⚠️  No {', '.join(unavailable)} in the waters this season!")

        catch = base_catch

        # Calculate value (with demand multipliers!)
        revenue = calculate_catch_value(catch, game, use_english_market=False)

        # Subtract upkeep
        upkeep = blueprint.base_upkeep
        net = revenue - upkeep

        total_earnings += revenue
        total_upkeep += upkeep

        # Store catch in hold
        for fish, tons in catch.items():
            company.catch_in_hold[fish] = company.catch_in_hold.get(fish, 0) + tons

    # NEW: Process health degradation
    if process_health_degradation(company):
        # Company owner died!
        return

    # Apply crew share (50% to crew, 50% to owner)
    net_profit = total_earnings - total_upkeep
    if net_profit > 0:
        owner_share = net_profit * GameConstants.CREW_NORMAL_SHARE
        company.money += int(owner_share)

        # Low morale might trigger crew greed (they take MORE than their share)
        if company.crew_morale < GameConstants.LOW_MORALE_THRESHOLD:
            if random.random() < 0.2:  # 20% chance when morale is low
                # CREW GREED EVENT - they skim extra
                stolen = int(owner_share * (GameConstants.CREW_GREED_MULTIPLIER - 1))
                company.money -= stolen
                print(f"  ⚠️  Crew of {company.name} skimmed extra {stolen} kr!")
    else:
        company.money += int(net_profit)  # Cover the loss


def england_fishing_trip(company: Company, game: Game) -> bool:
    """
    Execute risky "sigling" to England.

    HIGH RISK, HIGH REWARD:
    - Much higher prices in Hull
    - But risk of storms/sinking
    - Only trawlers can make the journey

    Returns:
        True if trip succeeded, False if disaster struck
    """
    # Check for suitable boat
    trawler = None
    for boat in company.owned_boats:
        blueprint = SHIPYARD_CATALOG[boat.blueprint_id]
        if blueprint.boat_type in ["Trawler", "Factory"]:
            trawler = boat
            break

    if not trawler:
        print(f"  {company.name} has no trawler for England trip!")
        return False

    blueprint = SHIPYARD_CATALOG[trawler.blueprint_id]

    # RISK CHECK - might sink!
    disaster_chance = blueprint.base_risk_factor
    # TODO: Safety upgrades reduce this risk

    if random.random() < disaster_chance:
        # DISASTER - boat lost!
        print(f"  💀 TRAGEDY: {trawler.custom_name} was lost at sea!")
        company.owned_boats.remove(trawler)
        company.reputation -= 10
        company.crew_morale -= 20
        return False

    # SUCCESS - high-value trip
    catch = simulate_fishing_catch(blueprint.capacity, game)
    revenue = calculate_catch_value(catch, game, use_english_market=True)
    upkeep = blueprint.base_upkeep * 2  # England trip costs more

    net = revenue - upkeep
    owner_share = net * GameConstants.CREW_NORMAL_SHARE
    company.money += int(owner_share)

    # Opportunity for smuggling on return...
    # (Handled by event system)

    return True


def update_market_prices(game: Game):
    """
    Update market prices with realistic volatility.

    Icelandic market fluctuates moderately.
    English market is more volatile.

    NEW: Also updates DEMAND and FISH AVAILABILITY!
    """
    # Icelandic market
    for fish in game.icelandic_market_price:
        change = random.randint(-42, 50)  # Subtle reference
        new_price = game.icelandic_market_price[fish] + change
        game.icelandic_market_price[fish] = max(200, min(800, new_price))

    # English market (more volatile)
    change = random.randint(-84, 100)
    game.english_market_price = max(600, min(1200, game.english_market_price + change))

    # NEW: Update demand levels (happens every turn)
    for fish in FISH_SPECIES:
        # 10% chance demand changes
        if random.random() < 0.1:
            old_demand = game.market_demand.get(fish, "normal")
            new_demand = random.choice(["high", "normal", "low", "none"])
            game.market_demand[fish] = new_demand

            # Notify about dramatic demand changes
            if new_demand == "high" and old_demand != "high":
                print(f"  📈 {fish} demand SURGES! (eftirspurn!)")
            elif new_demand == "none" and old_demand != "none":
                print(f"  📉 {fish} market COLLAPSES! (engin eftirspurn!)")

    # NEW: Update fish availability (some seasons fish just aren't there!)
    for fish in FISH_SPECIES:
        # 5% chance fish disappears or reappears
        if random.random() < 0.05:
            old_available = game.fish_available.get(fish, True)
            game.fish_available[fish] = not old_available

            if not game.fish_available[fish]:
                print(f"  🐟 {fish} have migrated away! (no loðna!)")
            else:
                print(f"  🐟 {fish} have returned to the waters!")
