"""
Togaraveldi - Special Historical Events

Complete timeline of Icelandic history (1900-2020):
- 1918: Sovereignty (Act of Union with Denmark)
- 1944: Independence (Republic declared June 17)
- 1949: NATO Membership
- 1960s: Herring Boom (Siglufjörður prosperity)
- 1968: Herring Collapse (economic crisis)
- 1958-1976: Cod Wars (Þorskastríðið - Iceland's only war!)
- 1971: Manuscripts Return (cultural victory!)
- 1989: Beer Day (end of prohibition)
- 2008: Bank Collapse (Bankahrunið)
- 2010: Volcano (Eyjafjallajökull)
- 2016: Euro 2016 (Victory over England + Víkingaklapp!)
- 2020: COVID-19 pandemic
- Random: Conspiracy theories (health hazard)

Based on real Icelandic history!
"""

from models import Company, Game, GameConstants
import random


# =============================================================================
# VERÐBÓLGA (INFLATION) - Essential Icelandic Economic Reality
# =============================================================================

def apply_annual_inflation(game: Game):
    """
    Apply annual inflation to all prices and costs.

    Iceland's inflation history:
    - 1900-1940s: Low (~2-4%)
    - 1950s-1960s: Moderate (~5-8%)
    - 1970s-1980s: HIGH! (~20-80%!)
    - 1990s: Moderate (~3-5%)
    - 2000s: Low (~2-4%)
    - 2008-2010: Spike from bank collapse

    Effects:
    - Fish prices increase
    - Boat upkeep costs increase
    - Debt becomes easier to pay (inflation helps debtors!)
    - Cash loses value over time
    """
    # Determine inflation rate based on historical era
    if game.year < 1950:
        base_rate = 0.03  # 3% - early era
    elif game.year < 1970:
        base_rate = 0.06  # 6% - post-war boom
    elif game.year < 1990:
        base_rate = 0.42  # 42%! - high inflation era (4:20 easter egg!)
    elif game.year < 2008:
        base_rate = 0.04  # 4% - modern stability
    elif game.year < 2012:
        base_rate = 0.16  # 16% - post-crash spike (4*4)
    else:
        base_rate = 0.03  # 3% - recovery

    # Random variance (±2%)
    variance = random.uniform(-0.02, 0.02)
    game.annual_inflation_rate = base_rate + variance

    # Apply to cumulative inflation
    game.cumulative_inflation *= (1 + game.annual_inflation_rate)

    # Apply inflation to fish prices
    for fish in game.icelandic_market_price:
        old_price = game.icelandic_market_price[fish]
        game.icelandic_market_price[fish] = int(old_price * (1 + game.annual_inflation_rate))

    game.english_market_price = int(game.english_market_price * (1 + game.annual_inflation_rate))

    # Apply inflation to boat upkeep (costs rise too!)
    from shipyard import SHIPYARD_CATALOG
    for boat_type in SHIPYARD_CATALOG.values():
        boat_type.base_upkeep = int(boat_type.base_upkeep * (1 + game.annual_inflation_rate))

    # Print inflation notice if significant
    if game.annual_inflation_rate > 0.10:  # More than 10%
        print(f"\n💸 VERÐBÓLGA! Annual inflation: {game.annual_inflation_rate*100:.1f}%")
        print(f"  Prices and costs are rising!")
    elif game.annual_inflation_rate > 0.20:  # More than 20%!
        print(f"\n🔥 MIKIL VERÐBÓLGA! Inflation: {game.annual_inflation_rate*100:.0f}%!")
        print(f"  Money is losing value rapidly!")
        print(f"  Debt becomes easier to pay, but savings evaporate!")


def trigger_high_inflation_crisis(game: Game):
    """
    Special inflation spike event (1970s-1980s style).

    Historical context: Iceland experienced periods of extreme inflation,
    sometimes reaching 80%+ annually!

    Effects:
    - Massive price increases
    - Costs skyrocket
    - Cash loses value
    - Debt becomes worthless (good for debtors!)
    """
    print("\n" + "🔥 "*20)
    print(" "*10 + "VERÐBÓLGUKREPPA!")
    print(" "*8 + "INFLATION CRISIS!")
    print("🔥 "*20)
    print(f"\nInflation has spiked to {game.annual_inflation_rate*100:.0f}%!")
    print("Money is losing value every day!")

    # Companies with debt benefit!
    for company in game.companies:
        if company.visa_current_debt > 0:
            # Debt becomes relatively easier to pay
            debt_relief = int(company.visa_current_debt * game.annual_inflation_rate * 0.5)
            company.visa_current_debt = max(0, company.visa_current_debt - debt_relief)

            if company.ai_controller is None:
                print(f"\n💰 Your debt is easier to pay!")
                print(f"  Inflation reduced debt by: {debt_relief:,} kr")

        # But cash loses value
        if company.money > 100000:
            cash_loss = int(company.money * game.annual_inflation_rate * 0.3)
            company.money -= cash_loss

            if company.ai_controller is None:
                print(f"\n💸 But your cash lost value!")
                print(f"  Cash value lost: {cash_loss:,} kr")

    print("\n🔥 "*20)
    print("Lesson: In high inflation, debt is good, cash is bad!")


def check_inflation_crisis(game: Game) -> bool:
    """
    Check if major inflation crisis should trigger.

    Historically, Iceland had severe inflation in:
    - 1974-1975 (oil crisis)
    - 1979-1983 (second oil crisis + wage-price spiral)
    """
    # First oil crisis
    if game.year == 1974 and game.month == 10:
        return "first_oil_crisis"
    # Peak inflation era
    elif game.year == 1980 and game.month == 1:
        return "peak_inflation"
    return False


def trigger_oil_crisis_inflation(game: Game):
    """
    1974 Oil Crisis - Inflation spike

    Global oil crisis hits Iceland hard.
    Inflation spikes to extreme levels.
    """
    print("\n" + "🔥 "*20)
    print(" "*10 + "OLÍUKREPPA - OIL CRISIS!")
    print(" "*8 + "INFLATION SPIKE (1974)")
    print("🔥 "*20)
    print("\nGlobal oil crisis hits Iceland!")
    print("Energy costs soar. Inflation explodes!")

    # Massive inflation spike
    game.annual_inflation_rate = 0.42  # 42%!

    trigger_high_inflation_crisis(game)


def trigger_peak_inflation(game: Game):
    """
    1980 - Peak Inflation Era

    Iceland's inflation reaches extreme levels.
    The highest in Icelandic history!
    """
    print("\n" + "🔥 "*20)
    print(" "*10 + "MESTI VERÐBÓLGA Í SÖGUNNI!")
    print(" "*8 + "PEAK INFLATION ERA (1980)")
    print("🔥 "*20)
    print("\nIceland's inflation reaches historical peak!")
    print("Prices change daily. Money loses value hourly!")

    # EXTREME inflation
    game.annual_inflation_rate = 0.58  # 58%! (close to historical peak)

    trigger_high_inflation_crisis(game)

    print("\nThis will shape economic policy for decades...")


# =============================================================================
# 1918 - SOVEREIGNTY (Act of Union with Denmark)
# =============================================================================

def check_sovereignty(game: Game) -> bool:
    """Check if Sovereignty event should trigger (December 1, 1918)."""
    return game.year == 1918 and game.month == 12


def trigger_sovereignty(game: Game):
    """
    Act of Union - December 1, 1918

    Iceland becomes a fully sovereign state in personal union with Denmark.
    Denmark retains control of foreign affairs, but Iceland is autonomous.

    Effects:
    - Fame boost (international recognition)
    - Reputation boost
    - Political capital increase
    """
    print("\n" + "🇮🇸 "*20)
    print(" "*15 + "LÖGBUNDIN SJÁLFSTÆÐI")
    print(" "*12 + "ACT OF UNION - DECEMBER 1, 1918")
    print("🇮🇸 "*20)
    print("\nIceland becomes a sovereign state!")
    print("The Kingdom of Iceland is recognized by Denmark.")

    for company in game.companies:
        company.fame += 10
        company.reputation += 10
        company.klikusambond += 5

        if company.ai_controller is None:
            print(f"\n🎉 A new era begins!")
            print(f"  Fame: +10")
            print(f"  Reputation: +10")
            print(f"  Klíkusambönð: +5")

    print("\n🇮🇸 "*20)


# =============================================================================
# 1944 - INDEPENDENCE (Republic declared June 17)
# =============================================================================

def check_independence(game: Game) -> bool:
    """Check if Independence should trigger (June 17, 1944)."""
    return game.year == 1944 and game.month == 6


def trigger_independence(game: Game):
    """
    Lýðveldið stofnað - June 17, 1944

    Iceland declares full independence from Denmark!
    97% voted yes. Iceland becomes a republic.

    Effects:
    - MASSIVE fame and reputation boost
    - Money bonus from optimism
    - Crew morale boost
    - Political capital increase
    """
    print("\n" + "🇮🇸 "*20)
    print(" "*10 + "LÝÐVELDIÐ STOFNAÐ!")
    print(" "*15 + "JUNE 17, 1944")
    print("🇮🇸 "*20)
    print("\nIceland declares full independence!")
    print("97% voted YES! The Republic of Iceland is born!")
    print("\nSveinn Björnsson becomes Iceland's first president.")

    for company in game.companies:
        # MASSIVE bonuses - this is the biggest day in Icelandic history!
        company.fame += 42  # Easter egg
        company.reputation += 42
        company.crew_morale = min(100, company.crew_morale + 42)
        company.klikusambond += 20

        # Independence bonus
        independence_bonus = 420000
        company.money += independence_bonus

        if company.ai_controller is None:
            print(f"\n🏆 INDEPENDENCE DAY!")
            print(f"  The nation celebrates freedom!")
            print(f"  Fame: +42")
            print(f"  Reputation: +42")
            print(f"  Crew Morale: +42")
            print(f"  Klíkusambönð: +20")
            print(f"  Independence Bonus: {independence_bonus:,} kr")

    print("\n🇮🇸 "*20)
    print("Iceland is now a fully independent nation!")


# =============================================================================
# 1940 - BRITISH OCCUPATION (WWII)
# =============================================================================

def check_british_occupation(game: Game) -> bool:
    """Check if British Occupation should trigger (May 10, 1940)."""
    return game.year == 1940 and game.month == 5


def trigger_british_occupation(game: Game):
    """
    British Occupation - May 10, 1940

    WWII: Britain invades Iceland to prevent Nazi control.
    Iceland remains neutral, but is occupied "for protection."

    Effects:
    - Mixed feelings (reputation changes)
    - Economic boom from British spending
    - Crew morale varies
    """
    print("\n" + "🇬🇧 "*20)
    print(" "*10 + "BRITISH OCCUPATION")
    print(" "*15 + "MAY 10, 1940")
    print("🇬🇧 "*20)
    print("\nWWII: British forces land in Iceland!")
    print("Iceland's neutrality is violated, but there is no resistance.")
    print("The British say it's 'for protection' against Nazi Germany.")

    for company in game.companies:
        # Economic boom from British presence
        british_spending = 84200  # Easter egg
        company.money += british_spending

        # Mixed reactions
        company.fame += 5

        if company.ai_controller is None:
            print(f"\n🏴󠁧󠁢󠁥󠁮󠁧󠁿 British forces occupy Iceland")
            print(f"  Neutrality violated, but economy booms")
            print(f"  British Spending: {british_spending:,} kr")
            print(f"  Fame: +5")

    # Market boost from military spending
    for fish in game.icelandic_market_price:
        game.icelandic_market_price[fish] = int(game.icelandic_market_price[fish] * 1.3)

    print("\n🇬🇧 "*20)


# =============================================================================
# 1941 - AMERICANS TAKE OVER (Keflavík Base)
# =============================================================================

def check_american_takeover(game: Game) -> bool:
    """Check if American takeover should trigger (July 7, 1941)."""
    return game.year == 1941 and game.month == 7


def trigger_american_takeover(game: Game):
    """
    Americans Take Over - July 7, 1941

    US forces replace the British under US-Icelandic agreement.
    The US recognizes Iceland's absolute independence.

    The base will remain for decades (until 2006!).
    Many Icelanders grow up with American friends from the base.

    Effects:
    - MASSIVE economic boom (American spending)
    - US recognizes independence
    - Fame boost (international recognition)
    - Long-term prosperity from base
    """
    print("\n" + "🇺🇸 "*20)
    print(" "*10 + "AMERICAN FORCES ARRIVE")
    print(" "*15 + "JULY 7, 1941")
    print("🇺🇸 "*20)
    print("\nUS forces take over Iceland's defense from Britain!")
    print("Under US-Icelandic agreement, the US recognizes")
    print("Iceland's absolute independence.")
    print("\nThe base at Keflavík will become home to American")
    print("families for the next 65 years. Friendships will form.")

    for company in game.companies:
        # MASSIVE economic boom
        american_spending = 420000  # Easter egg
        company.money += american_spending

        # Recognition of independence
        company.fame += 25
        company.reputation += 15
        company.klikusambond += 10

        if company.ai_controller is None:
            print(f"\n🇺🇸 American Era Begins")
            print(f"  US recognizes absolute independence!")
            print(f"  American Spending: {american_spending:,} kr")
            print(f"  Fame: +25")
            print(f"  Reputation: +15")
            print(f"  Klíkusambönð: +10")
            print(f"\n  (The base will last until 2006)")

    # Massive market boost
    for fish in game.icelandic_market_price:
        game.icelandic_market_price[fish] = int(game.icelandic_market_price[fish] * 1.5)

    print("\n🇺🇸 "*20)


# =============================================================================
# 1949 - NATO MEMBERSHIP
# =============================================================================

def check_nato_membership(game: Game) -> bool:
    """Check if NATO membership should trigger (March 30, 1949)."""
    return game.year == 1949 and game.month == 3


def trigger_nato_membership(game: Game):
    """
    Iceland joins NATO - March 30, 1949

    Iceland becomes a charter member of NATO, with the reservation
    that it will never take part in offensive action.

    Effects:
    - International fame
    - Trade benefits (better English market access)
    - Crew morale boost (protection)
    """
    print("\n" + "🛡️  "*20)
    print(" "*15 + "NATO MEMBERSHIP")
    print(" "*12 + "MARCH 30, 1949")
    print("🛡️  "*20)
    print("\nIceland joins the North Atlantic Treaty Organization!")
    print("(With reservation: no offensive action)")

    for company in game.companies:
        company.fame += 15
        company.reputation += 5

        if company.ai_controller is None:
            print(f"\n🌍 International alliances secured!")
            print(f"  Fame: +15")
            print(f"  Reputation: +5")
            print(f"  English market access improved")

    # Boost English market price (better trade relations)
    game.english_market_price = int(game.english_market_price * 1.2)

    print("\n🛡️  "*20)


# =============================================================================
# 1960s - HERRING BOOM (Siglufjörður Prosperity)
# =============================================================================

def check_herring_boom(game: Game) -> bool:
    """Check if Herring Boom should trigger (1962)."""
    return game.year == 1962 and game.month == 6


def trigger_herring_boom(game: Game):
    """
    Síldarárin - The Herring Years (1960s)

    Herring fisheries hit new heights!
    Siglufjörður alone contributes 45% of the nation's wealth!

    Effects:
    - MASSIVE price boost for all fish
    - Money bonus for all companies
    - Crew morale boost (prosperity!)
    - Lasts until 1968 (when herring collapse happens)
    """
    print("\n" + "🐟 "*20)
    print(" "*15 + "SÍLDARÁRIN!")
    print(" "*10 + "THE HERRING BOOM (1960s)")
    print("🐟 "*20)
    print("\nHerring fisheries reach record heights!")
    print("Siglufjörður contributes 45% of Iceland's wealth!")
    print("\nThe golden age of Icelandic fishing!")

    for company in game.companies:
        # Prosperity bonus
        prosperity_bonus = 162000  # Easter egg (16:20)
        company.money += prosperity_bonus
        company.fame += 20
        company.crew_morale = min(100, company.crew_morale + 30)

        if company.ai_controller is None:
            print(f"\n💰 BOOM TIMES!")
            print(f"  Prosperity Bonus: {prosperity_bonus:,} kr")
            print(f"  Fame: +20")
            print(f"  Crew Morale: +30")

    # MASSIVE market boost
    for fish in game.icelandic_market_price:
        game.icelandic_market_price[fish] = int(game.icelandic_market_price[fish] * 2.5)

    print("\n🐟 "*20)
    print("Prosperity will last until... 1968.")


# =============================================================================
# 1968 - HERRING COLLAPSE
# =============================================================================

def check_herring_collapse(game: Game) -> bool:
    """Check if Herring Collapse should trigger (1968)."""
    return game.year == 1968 and game.month == 8


def trigger_herring_collapse(game: Game):
    """
    Síldarhrunið - The Herring Collapse (1968)

    After heavy investment, the herring stock collapses spectacularly!
    It won't recover until the 1990s.

    This is a SERIOUS economic crisis.

    Effects:
    - 30% cash loss (economic crisis)
    - Market crash (40% price drop)
    - Reputation loss
    - Crew morale crash
    - Lesson: Don't overfish!
    """
    print("\n" + "💥 "*20)
    print(" "*15 + "SÍLDARHRUNIÐ!")
    print(" "*10 + "THE HERRING COLLAPSE (1968)")
    print("💥 "*20)
    print("\nThe herring stock has collapsed spectacularly!")
    print("Over-fishing has destroyed the industry!")
    print("\nSerious economic consequences for all of Iceland.")

    for company in game.companies:
        # Economic crisis!
        old_money = company.money
        company.money = int(company.money * 0.7)  # 30% loss
        loss = old_money - company.money

        company.reputation = max(0, company.reputation - 20)
        company.crew_morale = max(0, company.crew_morale - 20)

        if company.ai_controller is None:
            print(f"\n💸 ECONOMIC CRISIS!")
            print(f"  Lost: {loss:,} kr (30%)")
            print(f"  Reputation: -20")
            print(f"  Crew Morale: -20")

    # Market crash
    for fish in game.icelandic_market_price:
        game.icelandic_market_price[fish] = int(game.icelandic_market_price[fish] * 0.6)

    print("\n💥 "*20)
    print("Lesson learned: Sustainable fishing is essential.")
    print("The herring won't return until the 1990s...")


# =============================================================================
# 1971 - MANUSCRIPTS RETURN (Cultural Victory!)
# =============================================================================

def check_manuscripts_return(game: Game) -> bool:
    """Check if Manuscripts Return should trigger (April 21, 1971)."""
    return game.year == 1971 and game.month == 4


def trigger_manuscripts_return(game: Game):
    """
    Handritin koma heim - April 21, 1971

    Denmark returns priceless medieval manuscripts to Iceland!
    The Codex Regius and Flateyjarbók come home after centuries.

    This is a HUGE cultural victory for Iceland.

    Effects:
    - MASSIVE fame boost
    - Reputation boost
    - National pride (crew morale boost)
    - Political capital increase
    """
    print("\n" + "📜 "*20)
    print(" "*10 + "HANDRITIN KOMA HEIM!")
    print(" "*8 + "THE MANUSCRIPTS RETURN - APRIL 21, 1971")
    print("📜 "*20)
    print("\nDenmark returns Iceland's priceless medieval manuscripts!")
    print("The Codex Regius and Flateyjarbók come home!")
    print("\nUNESCO calls them 'the single most important collection")
    print("of early Scandinavian manuscripts in existence.'")

    for company in game.companies:
        # Cultural victory!
        company.fame += 30
        company.reputation += 20
        company.crew_morale = min(100, company.crew_morale + 20)
        company.klikusambond += 10

        if company.ai_controller is None:
            print(f"\n📚 CULTURAL TRIUMPH!")
            print(f"  Iceland's heritage restored!")
            print(f"  Fame: +30")
            print(f"  Reputation: +20")
            print(f"  Crew Morale: +20")
            print(f"  Klíkusambönð: +10")

    print("\n📜 "*20)
    print("A day of immense cultural pride for Iceland!")


# =============================================================================
# 2016 - EURO 2016 (Victory over England + Víkingaklapp!)
# =============================================================================

def check_euro_2016(game: Game) -> bool:
    """Check if Euro 2016 victory should trigger (June 27, 2016)."""
    return game.year == 2016 and game.month == 6


def trigger_euro_2016(game: Game):
    """
    Euro 2016 - Iceland 2, England 1 (June 27, 2016)

    The smallest nation ever to play in the European Championships
    defeats England in a historic upset!

    The Víkingaklapp (Viking Thunder Clap) becomes world famous!

    Effects:
    - MASSIVE fame boost
    - National pride boost
    - Crew morale SURGE
    - Money bonus from tourism/merchandising
    """
    print("\n" + "⚽ "*20)
    print(" "*10 + "EURO 2016 - HISTORIC VICTORY!")
    print(" "*15 + "ICELAND 2 - 1 ENGLAND")
    print("⚽ "*20)
    print("\nJune 27, 2016 - Nice, France")
    print("\nIceland defeats England in the most astonishing upset!")
    print("The smallest nation in Euro history knocks out a giant!")
    print("\n*HÚH!* *clap clap clap* - The Víkingaklapp goes viral!")

    for company in game.companies:
        # Historic sporting triumph!
        company.fame += 50  # Worldwide attention!
        company.reputation += 30
        company.crew_morale = 100  # Maximum morale!

        # Tourism and merchandising boom
        tourism_bonus = 420000
        company.money += tourism_bonus

        if company.ai_controller is None:
            print(f"\n⚽🇮🇸 ICELAND STUNS THE WORLD!")
            print(f"  The greatest result in Icelandic football history!")
            print(f"  Fame: +50 (worldwide viral sensation!)")
            print(f"  Reputation: +30")
            print(f"  Crew Morale: 100 (maximum!)")
            print(f"  Tourism/Merchandising Bonus: {tourism_bonus:,} kr")
            print(f"\n  HÚH! *clap clap clap*")

    print("\n⚽ "*20)
    print("The world watches in awe as Iceland celebrates!")
    print("(France will beat Iceland 5-2 in the next round, but still...)")


# =============================================================================
# COD WARS 1958-1976 - Þorskastríðið (Iceland's Only War!)
# =============================================================================

def check_cod_wars(game: Game) -> bool:
    """
    Check if Cod Wars events should trigger.

    Three phases:
    - First Cod War: 1958 (12-mile limit)
    - Second Cod War: 1972 (50-mile limit)
    - Third Cod War: 1975 (200-mile limit) - VICTORY!
    """
    # First Cod War
    if game.year == 1958 and game.month == 9:
        return "first"
    # Second Cod War
    elif game.year == 1972 and game.month == 9:
        return "second"
    # Third Cod War (Victory!)
    elif game.year == 1975 and game.month == 11:
        return "third"
    return False


def trigger_cod_war_first(game: Game):
    """
    First Cod War (1958) - 12-mile limit declared!

    Iceland extends fishing zone to 12 nautical miles.
    British trawlers protest. Tensions rise.

    Effects:
    - British competition reduced
    - Fish prices rise (less foreign competition)
    - Reputation boost for standing up to Britain
    """
    print("\n" + "⚔️ "*20)
    print(" "*10 + "ÞORSKASTRÍÐIÐ - THE COD WARS BEGIN!")
    print(" "*15 + "First Cod War (1958)")
    print("⚔️ "*20)
    print("\nIceland declares 12-nautical-mile fishing zone!")
    print("British trawlers are expelled. Tensions with UK escalate.")

    for company in game.companies:
        # Less foreign competition = better prices
        company.reputation += 5

        if company.ai_controller is None:
            print(f"\n🎣 Iceland stands firm against Britain!")
            print(f"  Foreign competition reduced")
            print(f"  Fish prices will improve")
            print(f"  Reputation: +5")

    # Boost fish prices temporarily
    for fish in game.icelandic_market_price:
        game.icelandic_market_price[fish] = int(game.icelandic_market_price[fish] * 1.2)

    print("\n⚔️ "*20)


def trigger_cod_war_second(game: Game):
    """
    Second Cod War (1972) - 50-mile limit!

    Iceland extends zone to 50 nautical miles.
    British Navy escorts their trawlers.
    Iceland threatens to leave NATO.

    Effects:
    - Major price boost
    - International fame
    - Risk vs reward: standing up to superpower
    """
    print("\n" + "⚔️ "*20)
    print(" "*10 + "SECOND COD WAR (1972)")
    print(" "*12 + "50-Nautical-Mile Zone!")
    print("⚔️ "*20)
    print("\nIceland extends fishing zone to 50 miles!")
    print("British Navy escorts trawlers. Iceland threatens to leave NATO.")

    for company in game.companies:
        company.fame += 10  # International attention
        company.reputation += 10

        if company.ai_controller is None:
            print(f"\n🇮🇸 Iceland vs Britain!")
            print(f"  The world watches as tiny Iceland stands up")
            print(f"  Fame: +10")
            print(f"  Reputation: +10")

    # Major price boost
    for fish in game.icelandic_market_price:
        game.icelandic_market_price[fish] = int(game.icelandic_market_price[fish] * 1.5)

    print("\n⚔️ "*20)


def trigger_cod_war_third(game: Game):
    """
    Third Cod War (1975-1976) - ICELAND WINS!

    Iceland declares 200-nautical-mile exclusive zone.
    Britain backs down. Iceland WINS the conflict!

    This is Iceland's only war - and they WON with fishing boats!

    Effects:
    - MASSIVE victory bonus
    - Permanent market advantage
    - National pride boost
    - Fish stocks protected for generations
    """
    print("\n" + "🎉 "*20)
    print(" "*10 + "THIRD COD WAR (1975-1976)")
    print(" "*12 + "ICELAND VICTORIOUS!")
    print("🎉 "*20)
    print("\nIceland declares 200-nautical-mile exclusive economic zone!")
    print("Britain backs down. The Cod Wars are OVER.")
    print("\n🇮🇸 ICELAND WINS ITS ONLY WAR! 🇮🇸")
    print("A tiny nation defeated a superpower using fishing boats!")

    for company in game.companies:
        # MASSIVE bonuses for national victory
        company.fame += 20
        company.reputation += 20
        company.crew_morale = min(100, company.crew_morale + 30)

        # Victory bonus payment
        victory_bonus = 420000  # Easter egg!
        company.money += victory_bonus

        if company.ai_controller is None:
            print(f"\n🏆 NATIONAL VICTORY!")
            print(f"  Iceland controls its own waters!")
            print(f"  Fame: +20")
            print(f"  Reputation: +20")
            print(f"  Crew Morale: +30")
            print(f"  Victory Bonus: {victory_bonus:,} kr")
            print(f"\n  The fishing grounds are YOURS!")

    # PERMANENT market boost (no more British competition!)
    for fish in game.icelandic_market_price:
        game.icelandic_market_price[fish] = int(game.icelandic_market_price[fish] * 2.0)

    print("\n🎉 "*20)
    print("Icelandic fishing industry will thrive for decades!")


# =============================================================================
# COVID-19 PANDEMIC (2020)
# =============================================================================

def check_covid_pandemic(game: Game) -> bool:
    """
    Check if COVID pandemic should trigger (year 2020).

    If player invested in masks/toilet paper/sanitizer before 2020,
    they get MASSIVE profits!
    """
    if game.year == 2020 and game.month == 3:  # March 2020
        return True
    return False


def trigger_covid_pandemic(game: Game):
    """
    COVID-19 pandemic hits!

    If you invested in:
    - Masks
    - Toilet paper
    - Hand sanitizer

    ...you make MASSIVE profits!
    """
    print("\n" + "🦠 "*20)
    print(" "*20 + "COVID-19 PANDEMIC!")
    print("🦠 "*20)
    print("\nMarch 2020 - Global pandemic declared!")
    print("Panic buying sweeps the nation!")

    for company in game.companies:
        # Check if company invested in pandemic supplies
        masks = company.investments.get("masks", 0)
        toilet_paper = company.investments.get("toilet_paper", 0)
        sanitizer = company.investments.get("sanitizer", 0)

        total_investment = masks + toilet_paper + sanitizer

        if total_investment > 0:
            # MASSIVE PROFITS! 10x return!
            profit = total_investment * 10

            company.money += profit
            company.fame += 20  # People remember your "prescience"

            if company.ai_controller is None:
                print(f"\n💰 JACKPOT! Your pandemic supplies investment pays off!")
                print(f"  Investment: {total_investment:,} kr")
                print(f"  Profit: {profit:,} kr (10x return!)")
                print(f"  +20 Fame (you \"predicted\" the pandemic)")
            else:
                print(f"  {company.name} makes {profit:,} kr from pandemic supplies!")

            # Clear the investments
            company.investments["masks"] = 0
            company.investments["toilet_paper"] = 0
            company.investments["sanitizer"] = 0
        else:
            if company.ai_controller is None:
                print(f"\n  You didn't invest in pandemic supplies...")
                print(f"  Those who did are making fortunes!")

    print("\n🦠 "*20)


def invest_in_pandemic_supplies(company: Company, amount: int) -> bool:
    """
    Invest in masks, toilet paper, or sanitizer.

    Only pays off if you do it BEFORE COVID (2020).
    """
    if company.money < amount:
        print(f"  Not enough money!")
        return False

    print("\n🏭 PANDEMIC SUPPLIES INVESTMENT")
    print("-" * 70)
    print("Choose what to invest in:")
    print("  1. Masks")
    print("  2. Toilet Paper")
    print("  3. Hand Sanitizer")

    choice = input("> ").strip()

    supply_types = {
        "1": "masks",
        "2": "toilet_paper",
        "3": "sanitizer"
    }

    supply = supply_types.get(choice)
    if not supply:
        print("  Invalid choice.")
        return False

    company.money -= amount
    company.investments[supply] = company.investments.get(supply, 0) + amount

    print(f"  Invested {amount:,} kr in {supply.replace('_', ' ')}")
    print(f"  (Will this pay off? Only time will tell...)")

    return True


# =============================================================================
# CONSPIRACY THEORIES - Health Hazard
# =============================================================================

def expose_to_conspiracy_theories(company: Company):
    """
    Listen to conspiracy theories.

    If you listen too long, you lose brain cells and eventually die!

    "þú hlustaðir óvart of lengi á þannig og dóst"
    """
    # Track exposure
    if not hasattr(company, 'conspiracy_exposure'):
        company.conspiracy_exposure = 0

    company.conspiracy_exposure += 1

    # Damage from conspiracy theories
    if company.conspiracy_exposure > 5:
        # Brain damage!
        brain_damage = min(10, company.conspiracy_exposure - 5)
        company.health = max(0, company.health - brain_damage)
        company.b12_level = max(0, company.b12_level - brain_damage)  # Stress depletes B12 too!

        if company.ai_controller is None:
            print(f"\n🧠💥 CONSPIRACY THEORY DAMAGE!")
            print(f"  You've been listening for too long...")
            print(f"  Health: -{brain_damage}")
            print(f"  B12: -{brain_damage}")

        # Critical threshold - you die from conspiracy theories!
        if company.conspiracy_exposure >= 20:
            if company.ai_controller is None:
                print(f"\n💀 YOU DIED FROM CONSPIRACY THEORIES!")
                print(f"  You listened unwittingly for too long...")
                print(f"  'þú hlustaðir óvart of lengi á þannig og dóst'")
                print(f"\n  Your brain could not handle the cognitive dissonance.")
                print(f"  Conspiracy exposure: {company.conspiracy_exposure}")
            return True  # Company dies

    # Warnings
    if company.conspiracy_exposure > 10 and company.ai_controller is None:
        print(f"  ⚠️  CRITICAL CONSPIRACY EXPOSURE! ({company.conspiracy_exposure}/20)")
        print(f"  Stop listening before it's too late!")

    return False


def conspiracy_theory_event(company: Company, game: Game):
    """
    Random event: Encounter conspiracy theories.

    Player must choose to listen or ignore.
    Listening is tempting but dangerous!
    """
    if company.ai_controller is not None:
        # AI makes random choice
        if random.random() < 0.3:  # 30% listen
            expose_to_conspiracy_theories(company)
        return

    print("\n📻 CONSPIRACY THEORY ENCOUNTER")
    print("-" * 70)
    print("You hear someone talking about...")
    theories = [
        "how the government controls the fish",
        "chemtrails affecting the catch",
        "secret quota manipulation by elites",
        "the fishing industry being run by lizard people",
        "5G towers scaring away the fish"
    ]
    print(f"  '{random.choice(theories)}'")
    print("\nDo you:")
    print("  1. Listen (intriguing, but dangerous!)")
    print("  2. Ignore (boring, but safe)")

    choice = input("> ").strip()

    if choice == "1":
        print("\n  You lean in to listen...")
        died = expose_to_conspiracy_theories(company)
        if died:
            return True  # Game over for player
    else:
        print("\n  You walk away. Wise choice.")
        # Reward for resisting
        company.reputation += 1

    return False


# =============================================================================
# BEER DAY 1989 - Bjórdagurinn
# =============================================================================

def check_beer_day(game: Game) -> bool:
    """Check if Beer Day should trigger (March 1, 1989)."""
    return game.year == 1989 and game.month == 3


def trigger_beer_day(game: Game):
    """
    Bjórdagurinn (Beer Day) - March 1, 1989

    The 74-year prohibition on strong beer has ended!
    Celebrations erupt across Iceland.

    Effects:
    - Health boost for all (celebrations!)
    - Fame boost (everyone's partying)
    - Upkeep reduction (happy crew works for less)
    - Duration: 4 months
    """
    print("\n" + "🍺 "*20)
    print(" "*15 + "BJÓRDAGURINN (BEER DAY)!")
    print("🍺 "*20)
    print("\nMarch 1, 1989 - The 74-year prohibition on strong beer has ended!")
    print("Celebrations erupt across the country!")

    for company in game.companies:
        # Health boost
        company.health = min(100, company.health + 15)

        # Fame boost
        company.fame += 5

        # Crew morale boost
        company.crew_morale = min(100, company.crew_morale + 20)

        if company.ai_controller is None:
            print(f"\n🎉 National mood lifts!")
            print(f"  Health: +15")
            print(f"  Fame: +5")
            print(f"  Crew Morale: +20")

    # TODO: Add global upkeep reduction effect (needs global effects system)

    print("\n🍺 "*20)


# =============================================================================
# BANK COLLAPSE 2008 - Bankahrunið
# =============================================================================

def check_bank_collapse(game: Game) -> bool:
    """Check if Bank Collapse should trigger (October 2008)."""
    return game.year == 2008 and game.month == 10


def trigger_bank_collapse(game: Game):
    """
    Bankahrunið (The Bank Collapse) - October 2008

    Iceland's over-leveraged banks have defaulted.
    The Krona is worthless. Only hard assets have value.

    Effects:
    - 60% cash loss for all
    - Companies with debt may go bankrupt
    - Market crash (50% price drop for 12 months)
    - Fishing companies relatively protected (have boats/quotas)
    """
    print("\n" + "💥 "*20)
    print(" "*15 + "BANKAHRUNIÐ!")
    print(" "*10 + "THE BANK COLLAPSE OF 2008")
    print("💥 "*20)
    print("\nOctober 2008 - The nation's banks have defaulted!")
    print("The Krona is worthless. Only hard assets matter now.")

    # Track bankruptcies
    bankruptcies = []

    for company in game.companies:
        # 60% cash loss
        old_money = company.money
        company.money = int(company.money * 0.4)  # Keep 40%
        loss = old_money - company.money

        if company.ai_controller is None:
            print(f"\n💸 Your cash reserves decimated!")
            print(f"  Lost: {loss:,} kr (60%)")
            print(f"  Remaining: {company.money:,} kr")

        # Check for bankruptcy (if you have VISA debt)
        if company.visa_current_debt > company.money:
            if company.ai_controller is None:
                print(f"\n💀 BANKRUPTCY!")
                print(f"  Your debts exceed your assets.")
                print(f"  The bank seizes everything.")
            bankruptcies.append(company)

        # Reputation hit
        company.reputation = max(0, company.reputation - 10)

    # Remove bankrupt companies
    for company in bankruptcies:
        if company in game.companies:
            game.companies.remove(company)
            print(f"  💀 {company.name} has been liquidated.")

    # TODO: Add global market crash effect (needs global effects system)

    print("\n💥 "*20)
    print("The crash will affect markets for the next year...")


# =============================================================================
# VOLCANO 2010 - Eldgos í Eyjafjallajökli
# =============================================================================

def check_volcano(game: Game) -> bool:
    """Check if Volcano should trigger (April 2010)."""
    return game.year == 2010 and game.month == 4


def trigger_volcano(game: Game):
    """
    Eldgos í Eyjafjallajökli - April 2010

    A volcano erupts under Eyjafjallajökull glacier.
    Massive ash cloud paralyzes European air travel.

    Effects:
    - Fish exports impossible for 4 months
    - Catch can be stored but not sold
    - Only local sales possible
    - Iceland's fishing actually benefits long-term (fish stocks recover)
    """
    print("\n" + "🌋 "*20)
    print(" "*10 + "ELDGOS Í EYJAFJALLAJÖKLI!")
    print(" "*15 + "VOLCANO ERUPTION")
    print("🌋 "*20)
    print("\nApril 2010 - Volcano erupts under Eyjafjallajökull!")
    print("Colossal ash cloud paralyzes European air travel.")
    print("\nFish exports are IMPOSSIBLE for the next 4 months!")

    for company in game.companies:
        if company.ai_controller is None:
            print(f"\n  Your catch cannot be exported to Europe.")
            print(f"  You can still sell locally, but prices are low.")
            print(f"  (Icelandic market only for 4 months)")

    # TODO: Add halt_exports global effect (needs global effects system)

    print("\n🌋 "*20)


# =============================================================================
# HISTORICAL EVENT DISPATCHER
# =============================================================================

def check_and_trigger_historical_events(game: Game) -> bool:
    """
    Check for and trigger historical events based on game date.

    Complete Timeline of Icelandic History (1900-2020):
    - 1918: Sovereignty (Act of Union)
    - 1940: British Occupation (WWII)
    - 1941: American Takeover (Keflavík Base)
    - 1944: Independence (June 17)
    - 1949: NATO Membership
    - 1958: First Cod War
    - 1962: Herring Boom
    - 1968: Herring Collapse
    - 1971: Manuscripts Return
    - 1972: Second Cod War
    - 1975: Third Cod War (VICTORY!)
    - 1989: Beer Day
    - 2008: Bank Collapse
    - 2010: Volcano
    - 2016: Euro 2016 Victory
    - 2020: COVID-19

    Returns True if an event was triggered.
    """
    # Early History (1918-1949)
    if check_sovereignty(game):
        trigger_sovereignty(game)
        return True

    if check_british_occupation(game):
        trigger_british_occupation(game)
        return True

    if check_american_takeover(game):
        trigger_american_takeover(game)
        return True

    if check_independence(game):
        trigger_independence(game)
        return True

    if check_nato_membership(game):
        trigger_nato_membership(game)
        return True

    # Cod Wars (1958-1976)
    cod_war_phase = check_cod_wars(game)
    if cod_war_phase == "first":
        trigger_cod_war_first(game)
        return True
    elif cod_war_phase == "second":
        trigger_cod_war_second(game)
        return True
    elif cod_war_phase == "third":
        trigger_cod_war_third(game)
        return True

    # Herring Era (1962-1968)
    if check_herring_boom(game):
        trigger_herring_boom(game)
        return True

    if check_herring_collapse(game):
        trigger_herring_collapse(game)
        return True

    # Cultural Victory (1971)
    if check_manuscripts_return(game):
        trigger_manuscripts_return(game)
        return True

    # Inflation Crises (1974, 1980)
    inflation_crisis = check_inflation_crisis(game)
    if inflation_crisis == "first_oil_crisis":
        trigger_oil_crisis_inflation(game)
        return True
    elif inflation_crisis == "peak_inflation":
        trigger_peak_inflation(game)
        return True

    # Modern Era (1989-2020)
    if check_beer_day(game):
        trigger_beer_day(game)
        return True

    if check_bank_collapse(game):
        trigger_bank_collapse(game)
        # This might remove player if bankrupt!
        return True

    if check_volcano(game):
        trigger_volcano(game)
        return True

    if check_euro_2016(game):
        trigger_euro_2016(game)
        return True

    if check_covid_pandemic(game):
        trigger_covid_pandemic(game)
        return True

    return False
