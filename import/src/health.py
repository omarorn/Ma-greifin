"""
Togaraveldi - Health & Nutrition System

Realistic health degradation for fishermen:
- B12 vitamin depletion from poor diet at sea
- Scurvy and tooth loss
- Cognitive decline (Alzheimer's-like) from severe B12 deficiency
- Doctor visits to restore health

Historical context: Fishermen faced severe malnutrition, losing teeth and
developing neurological issues from vitamin deficiencies.
"""

from models import Company, GameConstants
import random


def process_health_degradation(company: Company):
    """
    Process turn-by-turn health degradation.

    Called every turn a company goes fishing.
    B12 depletes, teeth fall out, cognition declines.
    """
    # Track turns since doctor
    company.turns_since_doctor += 1

    # B12 depletion (you're eating poorly at sea!)
    company.b12_level = max(0, company.b12_level - GameConstants.B12_DEPLETION_PER_TURN)

    # Tooth loss from scurvy when B12 is very low
    if company.b12_level < GameConstants.TEETH_LOSS_THRESHOLD:
        if random.random() < 0.16:  # 16% chance (4:20 reference)
            company.teeth_lost += 1
            if company.ai_controller is None:  # Only notify player
                print(f"  🦷 You lost a tooth from scurvy! (Total lost: {company.teeth_lost})")

    # Cognitive decline (Alzheimer's-like) from severe B12 deficiency
    if company.b12_level < GameConstants.COGNITIVE_DECLINE_THRESHOLD:
        if not company.has_cognitive_decline:
            company.has_cognitive_decline = True
            if company.ai_controller is None:
                print(f"  🧠 Severe B12 deficiency! Memory and decision-making impaired!")

    # Health degradation when B12 is low
    if company.b12_level < 50:
        company.health = max(0, company.health - GameConstants.HEALTH_DEGRADATION_RATE)

    # Death from health collapse
    if company.health <= 0:
        if company.ai_controller is None:
            print(f"\n💀 HEALTH COLLAPSE!")
            print(f"  You died from malnutrition and vitamin deficiency.")
            print(f"  B12 level: {company.b12_level}")
            print(f"  Teeth lost: {company.teeth_lost}")
            print(f"  Turns since doctor: {company.turns_since_doctor}")
        return True  # Company dies

    return False


def visit_doctor(company: Company) -> bool:
    """
    Visit doctor to restore health.

    Costs 4,200 kr but restores B12 and prevents further decline.
    """
    if company.money < GameConstants.DOCTOR_VISIT_COST:
        print(f"  Cannot afford doctor visit! (Cost: {GameConstants.DOCTOR_VISIT_COST:,} kr)")
        return False

    # Pay for visit
    company.money -= GameConstants.DOCTOR_VISIT_COST

    # Restore B12 (teeth don't grow back though!)
    old_b12 = company.b12_level
    company.b12_level = 100

    # Restore health
    old_health = company.health
    company.health = min(100, company.health + 20)

    # Reset cognitive decline if B12 was very low
    if company.has_cognitive_decline and company.b12_level >= GameConstants.COGNITIVE_DECLINE_THRESHOLD:
        company.has_cognitive_decline = False
        print(f"  🧠 Cognitive function improving...")

    # Reset counter
    company.turns_since_doctor = 0

    print(f"\n  🏥 DOCTOR VISIT")
    print(f"  Cost: {GameConstants.DOCTOR_VISIT_COST:,} kr")
    print(f"  B12 restored: {old_b12} → {company.b12_level}")
    print(f"  Health improved: {old_health} → {company.health}")
    if company.teeth_lost > 0:
        print(f"  ⚠️  Teeth lost ({company.teeth_lost}) cannot be restored!")

    return True


def check_health_warnings(company: Company):
    """
    Display health warnings to player.

    Called at start of turn to warn about declining health.
    """
    if company.ai_controller is not None:
        return  # Only warn player

    warnings = []

    if company.b12_level < 30:
        warnings.append("🚨 CRITICAL B12 DEFICIENCY! Visit doctor immediately!")
    elif company.b12_level < 50:
        warnings.append("⚠️  Low B12 levels. Consider visiting doctor.")

    if company.health < 30:
        warnings.append("🚨 CRITICAL HEALTH! You're dying from malnutrition!")
    elif company.health < 50:
        warnings.append("⚠️  Poor health. Visit a doctor soon.")

    if company.teeth_lost > 5:
        warnings.append(f"🦷 You've lost {company.teeth_lost} teeth from scurvy!")

    if company.has_cognitive_decline:
        warnings.append("🧠 Severe cognitive decline affecting your decisions!")

    if company.turns_since_doctor > 20:
        warnings.append(f"⏰ You haven't seen a doctor in {company.turns_since_doctor} months!")

    if warnings:
        print("\n⚕️  HEALTH WARNINGS:")
        for warning in warnings:
            print(f"  {warning}")


def apply_cognitive_decline_effects(company: Company):
    """
    Apply negative effects from cognitive decline.

    When B12 < 20, player makes worse decisions:
    - Reduced fishing efficiency
    - Worse market prices
    - Risk of forgetting to do things
    """
    if not company.has_cognitive_decline:
        return 1.0  # No penalty

    # 20% penalty to all activities
    return 0.8
