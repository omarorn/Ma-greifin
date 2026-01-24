"""
Togaraveldi - Political Endgame

"Uppreisn Æru" - Restoration of Honor
The ultimate cynical victory: Use your criminal fame to gain political power,
then use political power to wipe your criminal record clean.
"""

from models import Company, Game, GameConstants
import random


# =============================================================================
# POLITICAL CAPITAL - Klíkusambönd
# =============================================================================

def support_political_candidate(company: Company, investment: int) -> int:
    """
    "Styðja frambjóðanda" - Support a Political Candidate

    Spend money to gain political capital (klíkusambönd).
    Only available if you have enough Fame (you need to be "somebody").

    Args:
        company: The sponsoring company
        investment: Amount to invest in candidate

    Returns:
        Political capital gained
    """
    # Must have fame to play politics
    if company.fame < 50:
        print(f"  {company.name} doesn't have enough fame to influence politics")
        return 0

    # Convert money → political capital (inefficient but powerful)
    # Every 10,000 kr = 1 point of klíkusambönd
    capital_gained = investment // 10000

    company.money -= investment
    company.klikusambond += capital_gained

    print(f"  🎩 {company.name} supports political candidate")
    print(f"  Investment: {investment:,} kr → +{capital_gained} political capital")
    print(f"  Total klíkusambönd: {company.klikusambond}")

    return capital_gained


# =============================================================================
# PRESIDENTIAL ELECTION - The Endgame Trigger
# =============================================================================

def trigger_presidential_election(game: Game) -> Company:
    """
    Presidential Election event - occurs every 4 years.

    The company with the most political capital (klíkusambönd) wins.
    Their candidate becomes president.

    Winner gets "Uppreisn Æru" if they meet requirements.

    Returns:
        Winning company (or None if no one qualifies)
    """
    print("\n" + "="*70)
    print("🗳️  PRESIDENTIAL ELECTION!")
    print("="*70)
    print(f"Year: {game.year}")
    print("\nPolitical Capital (Klíkusambönd) Rankings:")

    # Sort companies by political capital
    candidates = sorted(
        [c for c in game.companies if c.klikusambond > 0],
        key=lambda x: x.klikusambond,
        reverse=True
    )

    if not candidates:
        print("  No companies have political influence this election.")
        print("="*70)
        return None

    # Display rankings
    for i, company in enumerate(candidates, 1):
        marker = " ← WINNER" if i == 1 else ""
        print(f"  {i}. {company.name}: {company.klikusambond} political capital{marker}")

    winner = candidates[0]

    # Check if winner meets victory threshold
    if winner.klikusambond >= GameConstants.POLITICAL_CAPITAL_FOR_VICTORY:
        print(f"\n🎉 {winner.name}'s candidate WINS the presidency!")
        return winner
    else:
        print(f"\n  {winner.name} leads but doesn't have enough support")
        print(f"  (Need {GameConstants.POLITICAL_CAPITAL_FOR_VICTORY}, have {winner.klikusambond})")

    print("="*70)
    return None


# =============================================================================
# UPPREISN ÆRU - Restoration of Honor
# =============================================================================

def grant_restoration_of_honor(company: Company):
    """
    "Uppreisn Æru" - The President pardons your crimes.

    THE ULTIMATE CYNICAL VICTORY:
    1. Commit crimes → Get rich
    2. Get caught → Become famous (tabloids)
    3. Use fame → Gain political power
    4. Win election → Get pardoned

    Your criminal record is wiped clean.
    Your reputation is restored (and then some).

    This can win you the game.
    """
    print("\n" + "🏛️ "*20)
    print(" "*20 + "UPPREISN ÆRU")
    print(" " *15 + "RESTORATION OF HONOR")
    print("🏛️ "*20)

    print(f"\nThe President has granted {company.name} a full pardon.")
    print("All criminal investigations are dropped.")
    print("Your reputation is restored in the eyes of the nation.")

    # Wipe clean
    company.is_under_investigation = False
    company.suspicion_score = 0
    company.reputation = 100  # Perfect reputation!

    # Bonus: Keep your ill-gotten gains!
    print(f"\nYou keep your wealth: {company.money:,} kr")
    print(f"Fame: {company.fame}")
    print(f"Political Capital: {company.klikusambond}")

    print("\n" + "🏛️ "*20)

    # This is often a victory condition
    return True


# =============================================================================
# POLITICAL DIRTY TRICKS
# =============================================================================

def political_attack(attacker: Company, target: Company):
    """
    Use political capital to attack a rival.

    Options:
    - Trigger investigation on target
    - Steal their klíkusambönd
    - Damage their reputation

    Cost: Some of your own political capital
    """
    cost = 50  # Cost 50 klíkusambönd to attack

    if attacker.klikusambond < cost:
        return False

    attacker.klikusambond -= cost

    # Choose attack type (random for AI)
    attack_type = random.choice(["investigation", "steal", "smear"])

    if attack_type == "investigation":
        # Force investigation on target
        target.suspicion_score += 50
        print(f"  🐀 {attacker.name} uses political influence to trigger investigation of {target.name}!")

    elif attack_type == "steal":
        # Steal half their political capital
        stolen = target.klikusambond // 2
        target.klikusambond -= stolen
        attacker.klikusambond += stolen
        print(f"  🤝 {attacker.name} turns {target.name}'s political allies!")

    elif attack_type == "smear":
        # Damage reputation
        target.reputation = max(0, target.reputation - 20)
        print(f"  📰 {attacker.name} launches smear campaign against {target.name}!")

    return True


# =============================================================================
# BOND INVESTMENT RETURNS (Safe Alternative)
# =============================================================================

def process_annual_bond_returns(company: Company):
    """
    Pay out annual returns on government bonds.

    The SAFE way to grow wealth (but slow, only 4.2% annually).
    Contrast with crime (10x profits but risky).

    Args:
        company: Company with bond investments
    """
    if company.government_bonds > 0:
        returns = int(company.government_bonds * GameConstants.GOVERNMENT_BOND_ANNUAL_RETURN)
        company.money += returns
        company.government_bonds += returns  # Compound interest

        print(f"  💰 {company.name} earned {returns:,} kr from bonds (4.2% return)")
