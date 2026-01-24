"""
Togaraveldi - Shipyard & Boat Management

Manages boat blueprints, ownership, and the shipyard catalog.
"""

from models import BoatBlueprint, OwnedBoat, CrewMember
from typing import Dict
import random

# =============================================================================
# SHIPYARD CATALOG - All available boats
# =============================================================================

SHIPYARD_CATALOG: Dict[str, BoatBlueprint] = {
    # Small Inshore Boats
    "smabatur_01": BoatBlueprint(
        id="smabatur_01",
        model_name="Freyja 8m",
        cost=42000,
        capacity=10,
        base_upkeep=1000,  # Balanced from 1620
        boat_type="Inshore",
        base_risk_factor=0.042
    ),
    "smabatur_02": BoatBlueprint(
        id="smabatur_02",
        model_name="Víkingur 12m",
        cost=84000,
        capacity=20,
        base_upkeep=2100,  # Balanced from 3420
        boat_type="Inshore",
        base_risk_factor=0.032
    ),

    # Medium Trawlers
    "togari_01": BoatBlueprint(
        id="togari_01",
        model_name="Jón af Grímsey 35m",
        cost=420000,
        capacity=100,
        base_upkeep=10000,  # Balanced from 16200
        boat_type="Trawler",
        base_risk_factor=0.062
    ),
    "togari_02": BoatBlueprint(
        id="togari_02",
        model_name="Sæfari 42m",
        cost=842000,
        capacity=150,
        base_upkeep=20700,  # Balanced from 33420
        boat_type="Trawler",
        base_risk_factor=0.052
    ),

    # Factory Ships
    "verksmidjuskip_01": BoatBlueprint(
        id="verksmidjuskip_01",
        model_name="Atlantic Giant 60m",
        cost=4200000,
        capacity=420,
        base_upkeep=52200,  # Balanced from 84200
        boat_type="Factory",
        base_risk_factor=0.042
    )
}

def create_boat_instance(blueprint_id: str, owner_name: str, boat_number: int) -> OwnedBoat:
    """
    Create a new boat instance from a blueprint.

    Args:
        blueprint_id: ID from SHIPYARD_CATALOG
        owner_name: Name of owning company
        boat_number: Sequential number for this owner

    Returns:
        New OwnedBoat instance
    """
    blueprint = SHIPYARD_CATALOG[blueprint_id]

    instance_id = f"{owner_name[:3].upper()}_{random.randint(100, 999)}"
    custom_name = f"{blueprint.model_name} #{boat_number}"

    return OwnedBoat(
        instance_id=instance_id,
        blueprint_id=blueprint_id,
        custom_name=custom_name,
        crew_members=[],
        current_upgrades=[],
        maintenance_level=1.0
    )

def get_boat_value(blueprint_id: str) -> int:
    """Get current market value of a boat (used for net worth calculation)"""
    blueprint = SHIPYARD_CATALOG[blueprint_id]
    return int(blueprint.cost * 0.7)  # 70% depreciation value


def buy_boat(company, blueprint_id: str, custom_name: str = None) -> bool:
    """
    Purchase a boat from the shipyard.

    Args:
        company: The company buying the boat
        blueprint_id: ID of the boat blueprint to purchase
        custom_name: Optional custom name for the boat

    Returns:
        True if purchase successful, False otherwise
    """
    if blueprint_id not in SHIPYARD_CATALOG:
        print(f"  Invalid boat ID: {blueprint_id}")
        return False

    blueprint = SHIPYARD_CATALOG[blueprint_id]

    if company.money < blueprint.cost:
        print(f"  Not enough money! {blueprint.model_name} costs {blueprint.cost:,} kr")
        return False

    # Create boat instance
    boat_number = len(company.owned_boats) + 1
    if custom_name is None:
        custom_name = f"{company.name}'s {blueprint.model_name}"

    boat = create_boat_instance(blueprint_id, company.name, boat_number)
    boat.custom_name = custom_name

    # Complete purchase
    company.money -= blueprint.cost
    company.owned_boats.append(boat)

    print(f"  ⚓ Purchased {blueprint.model_name} for {blueprint.cost:,} kr")
    print(f"  Named: {custom_name}")

    return True


def sell_boat(company, instance_id: str) -> bool:
    """
    Sell a boat (at 50% of original value).

    Args:
        company: The company selling the boat
        instance_id: ID of the specific boat instance to sell

    Returns:
        True if sale successful, False otherwise
    """
    boat = None
    for b in company.owned_boats:
        if b.instance_id == instance_id:
            boat = b
            break

    if boat is None:
        print(f"  Boat not found!")
        return False

    blueprint = SHIPYARD_CATALOG[boat.blueprint_id]
    sale_price = blueprint.cost // 2  # 50% resale value

    company.owned_boats.remove(boat)
    company.money += sale_price

    print(f"  ⚓ Sold {boat.custom_name} for {sale_price:,} kr (50% of original value)")

    return True
