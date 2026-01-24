"""
Togaraveldi - Scandal, Fame & Criminal Enterprise

"Crime Pays Over Real" - The dark heart of the game.

Twisted from Matador/Útvegspilið jail mechanics:
- Instead of "Go to Jail" → "Tax Investigation"
- Instead of "Get Out of Jail Free" → "Call the Lawyer" (costs 420k kr)
- Scandal → Fame → Political Power
"""

from models import Company, GameConstants, Game
import random


# =============================================================================
# SMUGGLING - The 10x Profit Multiplier
# =============================================================================

def offer_smuggling_opportunity(company: Company, base_value: int = GameConstants.SMUGGLING_BASE_PROFIT) -> dict:
    """
    Present a smuggling opportunity after returning from England.

    THE CORE TRUTH: Smuggling is 10x more profitable than honest work.
    But if you TALK about it (chat), you're vulnerable.

    Returns:
        Dictionary describing the opportunity
    """
    return {
        "type": "smuggling",
        "potential_profit": base_value,
        "risk_of_capture": GameConstants.SMUGGLING_RISK_OF_CAPTURE,
        "message": "An old contact approaches in the dim harbor bar. 'I have some... goods. No questions asked.'"
    }


def execute_smuggling(company: Company, profit: int, game: Game) -> bool:
    """
    Attempt to smuggle contraband.

    If successful: Massive profit!
    If caught: Scandal, fines, possible investigation.

    Args:
        company: The smuggling company
        profit: Amount to gain if successful
        game: Game state

    Returns:
        True if successful, False if caught
    """
    # Roll the dice
    if random.random() < GameConstants.SMUGGLING_RISK_OF_CAPTURE:
        # CAUGHT!
        print(f"  🚨 {company.name} CAUGHT SMUGGLING!")

        # Choices: Pay fine or Call the Lawyer
        return False  # Caught
    else:
        # SUCCESS - silent profit
        company.money += profit
        company.suspicion_score += 10  # Increases investigation risk
        print(f"  💰 {company.name} smuggled successfully (+{profit:,} kr)")
        return True


# =============================================================================
# TAX INVESTIGATION - Twisted "Jail" Mechanic
# =============================================================================

def trigger_tax_investigation(company: Company, game: Game):
    """
    Trigger "Skattarannsókn" - Tax Investigation.

    Twisted from classic board game jail:
    - Miss your next turn
    - Massive fines
    - OR pay the lawyer to escape

    This is triggered when suspicion_score gets too high from:
    - Successful smuggling
    - Unrealistic profits (too lucky)
    - Being reported by rivals in chat
    """
    company.is_under_investigation = True
    company.misses_next_turn = True

    print(f"\n⚖️  TAX INVESTIGATION: {company.name}")
    print(f"  The tax authorities have noticed unusual activity.")
    print(f"  You lose your next turn and face potential fines.")

    # Fine based on net worth (10-30% of assets)
    fine_percent = random.uniform(0.1, 0.3)
    fine = int(company.net_worth * fine_percent)

    print(f"  Potential fine: {fine:,} kr ({fine_percent*100:.0f}% of net worth)")

    return fine


def call_the_lawyer(company: Company, fine: int) -> bool:
    """
    "Hringja í lögfræðinginn" - Buy your way out of scandal.

    Twisted Get Out of Jail Free card:
    - Costs 420,000 kr (expensive!)
    - Escapes the investigation
    - BUT increases Fame (now you're infamous)
    - Ends up in "Séð og Heyrt" (tabloids)

    Args:
        company: The company in trouble
        fine: The fine they're facing

    Returns:
        True if they can afford it and choose to pay
    """
    lawyer_fee = GameConstants.LAWYER_FEE_BASE

    if company.money < lawyer_fee:
        return False  # Can't afford lawyer

    # Pay the lawyer
    company.money -= lawyer_fee
    company.is_under_investigation = False
    company.misses_next_turn = False  # Don't skip turn

    # SCANDAL → FAME
    company.fame += GameConstants.FAME_GAIN_FROM_SCANDAL
    company.reputation -= 5  # Some reputation loss

    print(f"\n  📰 SÉÐ OG HEYRT!")
    print(f"  '{company.name} hires expensive lawyer to avoid tax charges!'")
    print(f"  Fame increased to {company.fame}!")
    print(f"  (Cost: {lawyer_fee:,} kr)")

    # Reset suspicion (you bought your way out)
    company.suspicion_score = max(0, company.suspicion_score - 50)

    return True


# =============================================================================
# CHAT ROOM - Where Loose Lips Sink Ships
# =============================================================================

def send_chat_boast(company: Company, message: str, game: Game):
    """
    Send a message in the chat room.

    CRITICAL MECHANIC: "Nobody talks, everybody walks"
    - If you boast about profits/crimes, rivals can:
      1. Report you to authorities (increase suspicion)
      2. Blackmail you
      3. Use it for political leverage

    Args:
        company: Sending company
        message: The message
        game: Game state (chat is logged)
    """
    chat_entry = f"[{game.year}/Turn {game.current_turn}] {company.name}: {message}"
    game.chat_log.append(chat_entry)

    # AI rivals analyze chat for leverage
    # Keywords that make you vulnerable
    dangerous_words = ["smuggl", "tax", "avoid", "profit", "million", "kr"]

    if any(word in message.lower() for word in dangerous_words):
        # You just made yourself vulnerable!
        company.suspicion_score += 20
        print(f"  ⚠️  Rivals take note of your boasting...")

        # Aggressive AI might report you
        for rival in game.companies:
            if rival.ai_controller == "Aggressive" and rival != company:
                if random.random() < 0.3:  # 30% chance
                    print(f"  🐀 {rival.name} reports suspicious activity to authorities!")
                    company.suspicion_score += 30


# =============================================================================
# TAX EVASION - Silent Profit Boost
# =============================================================================

def apply_tax_evasion(gross_profit: int) -> int:
    """
    Quietly evade taxes on profits.

    THE SECRET: If you don't report it, you keep 20% more.
    But it increases suspicion score.

    Returns:
        Net profit after "tax savings"
    """
    bonus = int(gross_profit * GameConstants.TAX_EVASION_BONUS)
    return gross_profit + bonus


# =============================================================================
# QUOTA CORRUPTION - Twisted Property Ownership
# =============================================================================

def buy_illegal_quota(company: Company, amount: int) -> int:
    """
    Buy quota on the black market.

    Twisted from Matador property buying:
    - Quota is supposed to be regulated
    - But you can buy it illegally for cheap
    - High risk if investigated

    Returns:
        Cost of black market quota
    """
    black_market_discount = 0.6  # 40% cheaper than legal!
    legal_price = amount * 1000  # 1000 kr per ton (example)
    black_market_price = int(legal_price * black_market_discount)

    company.money -= black_market_price
    company.suspicion_score += 25  # Very risky
    company.reputation -= 5

    print(f"  🤝 {company.name} acquired {amount} tons of quota on black market")
    print(f"  Cost: {black_market_price:,} kr (40% discount from legal)")

    return black_market_price
