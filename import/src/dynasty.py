"""
Togaraveldi - Dynasty & Succession System

"The age of the individual is over. The age of the dynasty has begun."

Multi-generational gameplay:
- Secure an heir to continue your legacy
- Succession upon death with inheritance tax (erfðaskattur)
- Reputation resets, but wealth (mostly) transfers
- Die without heir = dynasty ends (game over)

Historical context: Icelandic fishing families passed businesses down
through generations, building dynasties that lasted decades.
"""

from models import Company, Game, GameConstants
import random


# =============================================================================
# SUCCESSION CONFLICTS - "Abel and Cain"
# =============================================================================

def check_succession_conflict(company: Company, game: Game) -> bool:
    """
    Check if succession conflict occurs when securing an heir.

    Historical context: Like the Biblical story of Cain and Abel,
    or Icelandic sagas of family feuds, succession creates conflict.

    Chance of conflict:
    - 16% base chance (4*4)
    - Higher if you have high wealth (attracts greed)
    - Higher if you have low reputation (family doesn't respect you)

    Effects of conflict:
    - Lose money (family legal battles)
    - Lose reputation (scandal)
    - May lose the heir entirely
    - "Kings and queens killed each other for less"
    """
    # Base 16% chance
    conflict_chance = 0.16

    # Wealth increases conflict (more to fight over)
    if company.money > 1000000:
        conflict_chance += 0.10  # +10% if wealthy
    if company.money > 5000000:
        conflict_chance += 0.10  # +10% more if very wealthy

    # Low reputation increases conflict (family doesn't respect you)
    if company.reputation < 30:
        conflict_chance += 0.15

    return random.random() < conflict_chance


def trigger_succession_conflict(company: Company, game: Game):
    """
    Handle succession conflict event.

    Outcomes (random):
    1. Legal battle (lose money, keep heir)
    2. Family betrayal (lose heir, lose money, lose reputation)
    3. Murder attempt (lose heir, massive scandal)
    4. Resolved peacefully (small cost)

    "Abel and Cain, kings and queens killing each other for succession."
    """
    print(f"\n" + "⚔️ "*20)
    print(" "*10 + "SUCCESSION CONFLICT!")
    print(" "*8 + "FAMILY FEUD ERUPTS")
    print("⚔️ "*20)
    print("\nYour attempt to secure an heir has sparked conflict!")
    print("Multiple claimants emerge. Family turns against family.")
    print("'Kings and queens have killed each other for less...'")

    # Roll for outcome
    outcome_roll = random.random()

    if outcome_roll < 0.25:
        # OUTCOME 1: Legal Battle (25%)
        print(f"\n⚖️  LEGAL BATTLE")
        print("Your relatives challenge the succession in court.")

        legal_costs = int(company.money * 0.20)  # 20% of wealth
        company.money -= legal_costs
        company.reputation -= 10

        print(f"  Legal costs: {legal_costs:,} kr")
        print(f"  Reputation: -10 (family scandal)")
        print(f"\n  You win the battle, but at great cost.")
        print(f"  Your heir is secured, but the family is divided.")

    elif outcome_roll < 0.50:
        # OUTCOME 2: Family Betrayal (25%)
        print(f"\n🗡️  FAMILY BETRAYAL")
        print("Your chosen heir is poisoned by a jealous relative!")
        print("'Like Cain slew Abel, so does greed corrupt family.'")

        betrayal_cost = int(company.money * 0.30)  # 30% loss
        company.money -= betrayal_cost
        company.reputation -= 20
        company.has_heir = False  # Lost the heir!

        print(f"  Financial loss: {betrayal_cost:,} kr (chaos)")
        print(f"  Reputation: -20 (scandal)")
        print(f"  💀 YOUR HEIR IS DEAD")
        print(f"\n  Your dynasty is again at risk.")

    elif outcome_roll < 0.75:
        # OUTCOME 3: Murder Attempt (25%)
        print(f"\n💀 MURDER ATTEMPT!")
        print("Rivals attempt to kill your heir!")

        if random.random() < 0.50:  # 50% heir survives
            print(f"  Your heir survives, but barely.")
            scandal_cost = int(company.money * 0.15)
            company.money -= scandal_cost
            company.reputation -= 30

            print(f"  Investigation costs: {scandal_cost:,} kr")
            print(f"  Reputation: -30 (MASSIVE scandal)")
            print(f"\n  The family name is tarnished, but your heir lives.")
        else:
            print(f"  💀 YOUR HEIR IS MURDERED")
            print(f"  'The sagas speak of such betrayals...'")

            scandal_cost = int(company.money * 0.25)
            company.money -= scandal_cost
            company.reputation -= 40
            company.has_heir = False

            print(f"  Funeral & investigation: {scandal_cost:,} kr")
            print(f"  Reputation: -40 (dynasty curse)")
            print(f"\n  Your dynasty is cursed by blood.")

    else:
        # OUTCOME 4: Resolved Peacefully (25%)
        print(f"\n🕊️  PEACEFUL RESOLUTION")
        print("Through diplomacy, you negotiate peace among the claimants.")

        peace_cost = int(company.money * 0.10)  # 10% to buy off rivals
        company.money -= peace_cost
        company.reputation += 5  # Gained respect

        print(f"  Payments to rivals: {peace_cost:,} kr")
        print(f"  Reputation: +5 (wise leadership)")
        print(f"\n  Your heir is secure, and the family is united.")

    print("\n⚔️ "*20)


# =============================================================================
# SECURING AN HEIR - "Happi Life Happy Wife"
# =============================================================================

def secure_heir(company: Company, game: Game) -> bool:
    """
    Attempt to secure an heir for your dynasty.

    Requirements:
    - Cost: 42,000 kr (marriage, family expenses)
    - Time: Company misses 2 turns (focus on family)
    - Minimum reputation: 20 (need to be respectable)

    Effects:
    - Sets has_heir = True
    - Lose 2 turns of business
    - Small reputation boost (family values)

    Returns True if successful, False if cannot afford/qualify.
    """
    HEIR_COST = 42000  # Easter egg (4:20 * 10)
    MIN_REPUTATION = 20

    # Check requirements
    if company.money < HEIR_COST:
        if company.ai_controller is None:
            print(f"\n  Cannot afford to secure an heir!")
            print(f"  Cost: {HEIR_COST:,} kr")
            print(f"  Your money: {company.money:,} kr")
        return False

    if company.reputation < MIN_REPUTATION:
        if company.ai_controller is None:
            print(f"\n  Reputation too low to secure an heir!")
            print(f"  Need: {MIN_REPUTATION}+ reputation")
            print(f"  Current: {company.reputation}")
        return False

    if company.has_heir:
        if company.ai_controller is None:
            print(f"\n  You already have an heir!")
        return False

    # Pay the cost
    company.money -= HEIR_COST

    # Set heir flag
    company.has_heir = True

    # Miss next 2 turns (focus on family)
    company.misses_next_turn = True
    company._turns_to_skip = 2  # Custom tracking

    # Small reputation boost (family values)
    company.reputation += 5

    if company.ai_controller is None:
        print(f"\n👶 HEIR SECURED!")
        print(f"  You have secured an heir for your dynasty!")
        print(f"  Cost: {HEIR_COST:,} kr")
        print(f"  You will miss the next 2 turns (family focus)")
        print(f"  Reputation: +5 (family values)")
        print(f"\n  'Happi life, happy wife!'")
        print(f"  Your legacy is now protected.")

    # Check for succession conflict (Abel and Cain)
    if check_succession_conflict(company, game):
        trigger_succession_conflict(company, game)

    return True


# =============================================================================
# SUCCESSION - When Death Comes
# =============================================================================

def trigger_succession(company: Company, game: Game) -> Company:
    """
    Handle succession when a company leader dies.

    Process:
    1. Check if heir exists
    2. If no heir: Dynasty ends (return None)
    3. If heir exists:
       - Apply inheritance tax (erfðaskattur - 20%)
       - Reset reputation to 50 (heir must prove themselves)
       - Reset health to 100
       - Reset B12 to 100
       - Keep boats, investments, etc.
       - Increment generation counter

    Returns:
        New Company object (the heir) or None (dynasty ended)
    """
    if not company.has_heir:
        # DYNASTY ENDS
        if company.ai_controller is None:
            print(f"\n" + "💀 "*20)
            print(" "*10 + "YOUR DYNASTY HAS ENDED")
            print("💀 "*20)
            print(f"\n{company.name} has died without an heir.")
            print("Your wealth is scattered to the winds.")
            print("Your company is dissolved.")
            print("Your name becomes a footnote in history.")
            print("\n⚰️  GAME OVER ⚰️")
            print("💀 "*20)
        return None

    # HEIR TAKES OVER
    if company.ai_controller is None:
        print(f"\n" + "👑 "*20)
        print(" "*10 + "THE SUCCESSION")
        print("👑 "*20)
        print(f"\nThe founder of {company.name} has passed away...")
        print("But the dynasty continues!")

    # Calculate inheritance tax (erfðaskattur)
    INHERITANCE_TAX_RATE = 0.20  # 20% (4*5)
    old_money = company.money
    inheritance_tax = int(old_money * INHERITANCE_TAX_RATE)
    new_money = old_money - inheritance_tax

    # Create heir's name
    generation = getattr(company, 'generation', 1) + 1
    if generation == 2:
        heir_suffix = " II"
    elif generation == 3:
        heir_suffix = " III"
    elif generation == 4:
        heir_suffix = " IV"
    else:
        heir_suffix = f" (Gen {generation})"

    # Preserve the original base name
    base_name = company.name.split(" (Gen")[0].split(" II")[0].split(" III")[0].split(" IV")[0]
    heir_name = base_name + heir_suffix

    if company.ai_controller is None:
        print(f"\n🎊 Your heir takes control of the company!")
        print(f"  Old leader: {company.name}")
        print(f"  New leader: {heir_name}")
        print(f"\n💸 ERFÐASKATTUR (Inheritance Tax): 20%")
        print(f"  Estate: {old_money:,} kr")
        print(f"  Tax: {inheritance_tax:,} kr")
        print(f"  Inherited: {new_money:,} kr")
        print(f"\n  Your heir must rebuild the family reputation.")

    # Update company for succession
    company.name = heir_name
    company.money = new_money
    company.health = 100  # New generation, full health
    company.b12_level = 100  # Fresh start
    company.teeth_lost = 0  # New teeth!
    company.turns_since_doctor = 0
    company.has_cognitive_decline = False
    company.reputation = 50  # Must rebuild reputation
    company.has_heir = False  # Need to secure new heir
    company.generation = generation

    if company.ai_controller is None:
        print(f"\n👑 "*20)
        print("The dynasty continues!")

    return company


# =============================================================================
# AI HEIR LOGIC
# =============================================================================

def ai_consider_heir(company: Company, game: Game) -> bool:
    """
    AI logic for securing an heir.

    AI will try to secure heir when:
    - Has enough money (100k+ for conservative, 200k+ for aggressive)
    - Health is declining (< 50)
    - Has sufficient reputation
    - Doesn't already have heir
    """
    if company.has_heir:
        return False

    # Conservative AI: Secure heir early
    if company.ai_controller == "Conservative":
        if company.money > 100000 and company.reputation >= 20:
            return secure_heir(company, game)

    # Aggressive AI: Wait until health is low
    elif company.ai_controller == "Aggressive":
        if company.health < 50 and company.money > 200000 and company.reputation >= 20:
            return secure_heir(company, game)

    # Bot AI: Random chance
    elif company.ai_controller == "Bot":
        if random.random() < 0.05 and company.money > 150000 and company.reputation >= 20:  # 5% chance
            return secure_heir(company, game)

    return False


# =============================================================================
# DYNASTY STATISTICS
# =============================================================================

def get_dynasty_info(company: Company) -> dict:
    """
    Get dynasty statistics for display.

    Returns:
        Dictionary with dynasty info
    """
    generation = getattr(company, 'generation', 1)

    return {
        "name": company.name,
        "generation": generation,
        "has_heir": company.has_heir,
        "health": company.health,
        "wealth": company.money,
        "reputation": company.reputation,
        "dynasty_secure": company.has_heir and company.health > 20
    }


def display_dynasty_warning(company: Company):
    """
    Display warning if dynasty is at risk.

    Called at start of turn for player.
    """
    if company.ai_controller is not None:
        return  # Only warn player

    if not company.has_heir and company.health < 30:
        print(f"\n⚠️  DYNASTY AT RISK!")
        print(f"  Your health is low ({company.health}) and you have NO HEIR!")
        print(f"  If you die, your dynasty ENDS!")
        print(f"  Consider securing an heir immediately!")
    elif not company.has_heir and company.health < 50:
        print(f"\n⚠️  No heir secured!")
        print(f"  Health: {company.health}")
        print(f"  Consider securing an heir to protect your legacy.")
