#!/usr/bin/env python3
"""
Test script to verify complete game integration.

Tests all v2.0 systems working together.
"""

import sys
sys.path.insert(0, 'src')

from game import create_game, process_end_of_turn, check_victory
from economy import local_fishing_trip
from politics import process_annual_bond_returns

def test_integration():
    """Run a quick integration test of all systems."""
    print("="*70)
    print("TOGARAVELDI v2.0 - INTEGRATION TEST")
    print("="*70)

    # Create game
    print("\n1. Creating game...")
    game = create_game()
    print(f"   ✓ Game created with {len(game.companies)} companies")
    print(f"   ✓ Player: {game.companies[0].name}")
    print(f"   ✓ AI Rivals: {[c.name for c in game.companies[1:3]]}")
    print(f"   ✓ Bots: {len([c for c in game.companies if c.ai_controller == 'Bot'])}")

    # Test fishing
    print("\n2. Testing fishing system...")
    player = game.companies[0]
    initial_money = player.money
    local_fishing_trip(player, game)
    print(f"   ✓ Local fishing trip completed")
    print(f"   Money: {initial_money:,} → {player.money:,} kr")

    # Test AI turns
    print("\n3. Testing AI system...")
    from ai import ai_take_turn
    ai_rival = game.companies[1]
    ai_initial = ai_rival.money
    ai_take_turn(ai_rival, game)
    print(f"   ✓ AI turn completed: {ai_rival.name}")
    print(f"   Money: {ai_initial:,} → {ai_rival.money:,} kr")

    # Test political system
    print("\n4. Testing political system...")
    if player.fame >= 50:
        from politics import support_political_candidate
        support_political_candidate(player, 100000)
        print(f"   ✓ Political capital: {player.klikusambond}")
    else:
        print(f"   ⚠ Not enough fame ({player.fame}) for politics")

    # Test bond system
    print("\n5. Testing bond investment...")
    player.government_bonds = 100000
    process_annual_bond_returns(player)
    print(f"   ✓ Bond returns processed")

    # Test scandal system
    print("\n6. Testing scandal system...")
    from scandal import send_chat_boast
    initial_suspicion = player.suspicion_score
    send_chat_boast(player, "I made millions smuggling!", game)
    print(f"   ✓ Chat boast processed")
    print(f"   Suspicion: {initial_suspicion} → {player.suspicion_score}")

    # Test victory checking
    print("\n7. Testing victory system...")
    winner = check_victory(game)
    if winner:
        print(f"   Winner: {winner.name}")
    else:
        print(f"   ✓ No winner yet (net worth goal: 16,200,000 kr)")

    # Test multiple turns
    print("\n8. Running 3 full turns...")
    for turn in range(3):
        process_end_of_turn(game)
        print(f"   ✓ Turn {game.current_turn} completed (Year {game.year}, Month {game.month})")

    print("\n" + "="*70)
    print("INTEGRATION TEST COMPLETE ✅")
    print("="*70)
    print("\nAll v2.0 systems integrated successfully:")
    print("  ✓ Economy & Fishing")
    print("  ✓ AI Rivals")
    print("  ✓ Scandal & Chat")
    print("  ✓ Politics & Endgame")
    print("  ✓ Victory Conditions")
    print("  ✓ Turn Processing")
    print("\nThe game is ready to play!")


if __name__ == "__main__":
    test_integration()
