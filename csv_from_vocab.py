import json
import csv
import uuid
import datetime

def generate_csv_from_json(json_file, csv_file):
    # Load data from JSON file
    with open(json_file, 'r') as file:
        data = json.load(file)
    
    # Prepare data for CSV
    rows = []
    current_time = datetime.datetime.now()
    
    for obj in list(data):
        row = {
            "id": str(uuid.uuid4()),
            "total_seen": 0,
            "wins": 0,
            "losses": 0,
            "winrate": 0,
            "entry_time": current_time.strftime('%Y-%m-%d %H:%M:%S.%f'),
            "last_seen_time": current_time.strftime('%Y-%m-%d %H:%M:%S.%f'),
            # include all data.items here
            "word": obj["word"],
            "translation": obj["translation"],
            "ipa": obj["ipa"],
            "illustration": obj["illustration"],
        }
        rows.append(row)
    
    # Write to CSV file
    with open(csv_file, 'w', newline='') as file:
        fieldnames = ['id', 'total_seen', 'wins', 'losses', 'winrate', 'entry_time', 'last_seen_time',
                      "word","translation","ipa","illustration"
                      ]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


# Example usage
generate_csv_from_json('spanish_vocab.json', 'GEN_cards.csv')
