import random
import time
from dataclasses import dataclass, field
from typing import List, Dict, Any
import sys

# Import from the enhanced prototype
sys.path.append('/home/user/maigreifinn/src')
from game_prototype_enhanced import (
    Player, Game, AI_PERSONALITIES, buy_boat, SHIPYARD_CATALOG
)

def run_single_game(game_num: int, turns: int = 200, verbose: bool = False):
    """Run a single game simulation"""
    print(f"\n{'='*70}")
    print(f"GAME {game_num}: Starting 200-turn simulation")
    print(f"{'='*70}")

    # Initialize AI agents (same setup every time)
    players = []
    for name in ["Guðrún", "Björn", "Ólafur", "Sigríður"]:
        player = Player(name=name)
        buy_boat(player, "smabatur_01")
        players.append(player)

    game = Game(players=players)

    # Run simulation
    for turn in range(turns):
        current_player = game.get_current_player()

        if verbose and turn % 50 == 0:
            print(f"  Turn {turn}/{turns}...")

        game.simulate_turn_for_player(current_player)
        game.next_player()

        # Reset bonuses at end of round
        if game.current_player_index == 0:
            game.bonus_catch_multiplier = 1.0

    # Return final results
    results = []
    for p in sorted(players, key=lambda x: x.money, reverse=True):
        personality = AI_PERSONALITIES[p.name]
        results.append({
            'name': p.name,
            'strategy': personality['strategy'],
            'money': p.money,
            'reputation': p.reputation,
            'fleet_size': len(p.owned_boats),
            'boats': [SHIPYARD_CATALOG[b.boat_type_id].model_name for b in p.owned_boats]
        })

    return results, game.market_price

def display_game_results(game_num: int, results: List[Dict], final_market_price: int):
    """Display results for a single game"""
    print(f"\n{'='*70}")
    print(f"GAME {game_num} - FINAL STANDINGS")
    print(f"{'='*70}")

    for i, r in enumerate(results, 1):
        print(f"\n{i}. {r['name']} ({r['strategy']})")
        print(f"   💰 Money: {int(r['money']):,} kr")
        print(f"   ⭐ Reputation: {r['reputation']:+d}")
        print(f"   🚢 Fleet: {r['fleet_size']} boat(s)")
        for boat in r['boats']:
            print(f"      → {boat}")

    print(f"\nFinal market price: {final_market_price} kr/ton")
    print(f"{'='*70}")

def analyze_all_games(all_results: List[List[Dict]]):
    """Analyze results across all 4 games"""
    print(f"\n{'='*70}")
    print(f"CROSS-GAME ANALYSIS (4 Games, 200 Turns Each)")
    print(f"{'='*70}")

    # Track wins and average performance per player
    player_stats = {name: {
        'wins': 0,
        'total_money': 0,
        'total_reputation': 0,
        'total_fleet_size': 0,
        'placements': []
    } for name in ["Guðrún", "Björn", "Ólafur", "Sigríður"]}

    for game_num, results in enumerate(all_results, 1):
        for placement, r in enumerate(results, 1):
            name = r['name']
            player_stats[name]['placements'].append(placement)
            player_stats[name]['total_money'] += r['money']
            player_stats[name]['total_reputation'] += r['reputation']
            player_stats[name]['total_fleet_size'] += r['fleet_size']

            if placement == 1:
                player_stats[name]['wins'] += 1

    # Display analysis
    print("\nPlayer Performance Summary:")
    print("-" * 70)

    for name in ["Guðrún", "Björn", "Ólafur", "Sigríður"]:
        stats = player_stats[name]
        personality = AI_PERSONALITIES[name]
        avg_money = stats['total_money'] / 4
        avg_rep = stats['total_reputation'] / 4
        avg_fleet = stats['total_fleet_size'] / 4
        avg_placement = sum(stats['placements']) / 4

        print(f"\n{name} ({personality['strategy']})")
        print(f"  Wins: {stats['wins']}/4")
        print(f"  Average Placement: {avg_placement:.1f}")
        print(f"  Average Money: {int(avg_money):,} kr")
        print(f"  Average Reputation: {avg_rep:+.1f}")
        print(f"  Average Fleet Size: {avg_fleet:.1f} boats")
        print(f"  Placements: {stats['placements']}")

    # Determine overall winner
    print("\n" + "="*70)
    best_player = min(player_stats.items(), key=lambda x: sum(x[1]['placements']))
    print(f"OVERALL CHAMPION: {best_player[0]} ({AI_PERSONALITIES[best_player[0]]['strategy']})")
    print(f"  Total wins: {best_player[1]['wins']}/4")
    print(f"  Average placement: {sum(best_player[1]['placements'])/4:.1f}")
    print("="*70)

if __name__ == "__main__":
    print("\n" + "="*70)
    print("LONG-TERM AI AGENT SIMULATION")
    print("Running 4 games × 200 turns = 800 total turns")
    print("Players: Guðrún, Björn, Ólafur, Sigríður")
    print("="*70)

    all_results = []

    # Run 4 games
    for game_num in range(1, 5):
        results, final_price = run_single_game(game_num, turns=200, verbose=True)
        all_results.append(results)
        display_game_results(game_num, results, final_price)
        time.sleep(1)

    # Cross-game analysis
    analyze_all_games(all_results)

    print("\n✓ Simulation complete!")
