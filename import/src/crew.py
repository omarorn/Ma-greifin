"""
Togaraveldi - Crew Management System

The human element: morale, greed, families, and tragedy.
"""

from models import CrewMember, Company, OwnedBoat, ICELANDIC_HOMETOWNS, FAMILY_NAMES_BY_HOMETOWN
import random


# =============================================================================
# CREW GENERATION
# =============================================================================

ICELANDIC_FIRST_NAMES = [
    "Jón", "Guðmundur", "Sigurður", "Gunnar", "Ólafur",
    "Einar", "Kristján", "Magnús", "Björn", "Þór",
    "Helgi", "Hafsteinn", "Ragnar", "Vilhjálmur", "Baldur"
]


def generate_crew_member(hometown: str, role: str = "Deckhand") -> CrewMember:
    """
    Generate a random crew member from a specific hometown.

    Args:
        hometown: Icelandic town/village
        role: Crew role (Captain, First Mate, Engineer, Deckhand)

    Returns:
        New CrewMember instance
    """
    first_name = random.choice(ICELANDIC_FIRST_NAMES)
    family_names = FAMILY_NAMES_BY_HOMETOWN.get(hometown, ["Jónsson"])
    family_name = random.choice(family_names)

    full_name = f"{first_name} {family_name}"

    # Role determines share
    role_shares = {
        "Captain": 2.0,
        "First Mate": 1.5,
        "Engineer": 1.2,
        "Deckhand": 1.0
    }

    return CrewMember(
        name=full_name,
        role=role,
        hometown=hometown,
        family_name=family_name,
        share=role_shares.get(role, 1.0),
        experience=0
    )


def hire_crew_for_boat(boat: OwnedBoat, hometown: str = None):
    """
    Hire a full crew for a boat.

    If hometown is specified, crew will preferentially come from there,
    potentially creating family connections (and future tragedies).

    Args:
        boat: The boat to crew
        hometown: Optional preferred hometown for hiring
    """
    if hometown is None:
        hometown = random.choice(ICELANDIC_HOMETOWNS)

    # Determine crew size based on boat (would normally use blueprint)
    # For now, simple: 1 Captain, 1 First Mate, 2-4 Deckhands

    boat.crew_members = [
        generate_crew_member(hometown, "Captain"),
        generate_crew_member(hometown, "First Mate"),
        generate_crew_member(hometown, "Deckhand"),
        generate_crew_member(hometown, "Deckhand")
    ]

    # 30% chance each additional crew member is from same hometown (family ties!)
    for i in range(2):
        if random.random() < 0.3:
            boat.crew_members.append(generate_crew_member(hometown, "Deckhand"))


def check_family_connections(boat: OwnedBoat) -> dict[str, list[str]]:
    """
    Check if multiple crew members share family names.

    Returns:
        Dictionary mapping family names to lists of crew member names
    """
    families = {}
    for crew in boat.crew_members:
        if crew.family_name not in families:
            families[crew.family_name] = []
        families[crew.family_name].append(crew.name)

    # Filter to only families with 2+ members
    return {k: v for k, v in families.items() if len(v) >= 2}


def crew_morale_event(company: Company, event_type: str):
    """
    Handle events that affect crew morale.

    Args:
        company: The company
        event_type: Type of morale event
            - 'good_trip': Successful, profitable trip
            - 'bad_trip': Unprofitable trip
            - 'fired': Crew member fired
            - 'tragedy': Ship lost with crew
    """
    if event_type == "good_trip":
        company.crew_morale = min(100, company.crew_morale + 5)
    elif event_type == "bad_trip":
        company.crew_morale = max(0, company.crew_morale - 3)
    elif event_type == "fired":
        company.crew_morale = max(0, company.crew_morale - 15)
    elif event_type == "tragedy":
        company.crew_morale = max(0, company.crew_morale - 30)


def svartur_dagur_event(company: Company, lost_boat: OwnedBoat) -> dict:
    """
    "Black Day" - Handle the tragedy of a lost ship.

    If multiple family members were on board, this becomes a community tragedy.

    Args:
        company: The owning company
        lost_boat: The boat that was lost

    Returns:
        Dictionary describing the tragedy's impact
    """
    families_lost = check_family_connections(lost_boat)

    # Standard boat loss impact
    impact = {
        "crew_lost": len(lost_boat.crew_members),
        "families_affected": len(families_lost),
        "reputation_loss": 10,
        "morale_loss": 30,
        "hometown_lockouts": []
    }

    # If families were on board, tragedy is much worse
    if families_lost:
        print(f"\n💀💀💀 SVARTUR DAGUR (BLACK DAY) 💀💀💀")
        print(f"The {lost_boat.custom_name} was lost with all hands.")
        print(f"\nFamilies lost:")

        for family_name, members in families_lost.items():
            print(f"  - {family_name} family: {', '.join(members)}")

        # Devastating reputation hit
        impact["reputation_loss"] = 30 + (len(families_lost) * 10)
        impact["morale_loss"] = 50

        # Locked out of hiring from affected hometowns
        affected_hometowns = list(set(crew.hometown for crew in lost_boat.crew_members))
        impact["hometown_lockouts"] = affected_hometowns

        print(f"\nThe communities of {', '.join(affected_hometowns)} are in mourning.")
        print(f"You will not be able to hire from these towns for years.")
        print("="*60)

    # Apply impacts
    company.reputation = max(0, company.reputation - impact["reputation_loss"])
    company.crew_morale = max(0, company.crew_morale - impact["morale_loss"])

    return impact
