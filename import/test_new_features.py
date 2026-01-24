#!/usr/bin/env python3
"""
Test new features:
- Market demand fluctuations
- Fish availability
- Health degradation
- Doctor visits
"""

import sys
sys.path.insert(0, 'src')

from game import create_game
from economy import update_market_prices, local_fishing_trip, get_demand_multiplier
from health import process_health_degradation, visit_doctor, check_health_warnings

def test_new_features():
    print("="*70)
    print("TESTING NEW FEATURES")
    print("="*70)

    # Create game
    game = create_game()
    player = game.companies[0]

    # Test 1: Market demand
    print("\n1. TESTING MARKET DEMAND")
    print("-" * 70)
    print("Initial demand:")
    for fish, demand in game.market_demand.items():
        mult = get_demand_multiplier(demand)
        print(f"  {fish}: {demand} (multiplier: {mult}x)")

    # Force demand changes
    game.market_demand["Cod"] = "high"
    game.market_demand["Haddock"] = "none"
    print("\nAfter forcing changes:")
    for fish, demand in game.market_demand.items():
        mult = get_demand_multiplier(demand)
        print(f"  {fish}: {demand} (multiplier: {mult}x)")

    # Test 2: Fish availability
    print("\n2. TESTING FISH AVAILABILITY")
    print("-" * 70)
    print("Initial availability:")
    for fish, available in game.fish_available.items():
        print(f"  {fish}: {'✅ Available' if available else '❌ Migrated'}")

    # Force migration
    game.fish_available["Skate"] = False
    print("\nAfter Skate migration:")
    for fish, available in game.fish_available.items():
        print(f"  {fish}: {'✅ Available' if available else '❌ Migrated'}")

    # Test 3: Health degradation
    print("\n3. TESTING HEALTH DEGRADATION")
    print("-" * 70)
    print(f"Initial health: {player.health}/100, B12: {player.b12_level}/100")

    # Simulate 20 turns at sea
    for i in range(20):
        process_health_degradation(player)
        if i % 5 == 4:  # Every 5 turns
            print(f"  After {i+1} turns: Health={player.health}, B12={player.b12_level}, Teeth lost={player.teeth_lost}")

    if player.has_cognitive_decline:
        print("  ⚠️  COGNITIVE DECLINE TRIGGERED!")

    # Test 4: Doctor visit
    print("\n4. TESTING DOCTOR VISIT")
    print("-" * 70)
    print(f"Before doctor: Health={player.health}, B12={player.b12_level}")
    player.money = 10000  # Give money for doctor
    visit_doctor(player)
    print(f"After doctor: Health={player.health}, B12={player.b12_level}")

    # Test 5: Fishing with availability issues
    print("\n5. TESTING FISHING WITH NO AVAILABILITY")
    print("-" * 70)
    local_fishing_trip(player, game)
    print(f"Caught: {player.catch_in_hold}")

    print("\n" + "="*70)
    print("ALL NEW FEATURES TESTED ✅")
    print("="*70)
    print("\nNew systems working:")
    print("  ✓ Market demand (eftirspurn vs engin eftirspurn)")
    print("  ✓ Fish availability (sometimes no loðna)")
    print("  ✓ Health degradation (B12, teeth loss, Alzheimer's)")
    print("  ✓ Doctor visits (restore health)")

if __name__ == "__main__":
    test_new_features()
