
import json

class NewsAnalyzer:
    def __init__(self, news_file_path: str):
        with open(news_file_path, 'r') as f:
            self.all_news_events = json.load(f)

    def get_new_modifiers_for_turn(self, turn_number: int):
        """
        Checks the simulated news feed for any events scheduled to trigger on the given turn.
        Translates them into GameModifier objects.
        """
        triggered_modifiers = []
        for event in self.all_news_events:
            if event.get("turn_to_trigger") == turn_number:
                print(f"[News Analyzer] Triggering event: {event['headline']}")
                modifier = event["modifier"]
                # Add context from the parent event
                modifier['id'] = f"GM_{turn_number}_{event['category'].replace(' ', '_').upper()}"
                modifier['source_headline'] = event['headline']
                modifier['category'] = event['category']
                modifier['start_turn'] = turn_number
                triggered_modifiers.append(modifier)
        return triggered_modifiers
