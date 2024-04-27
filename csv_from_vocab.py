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
    
    for key, value in data.items():
        row = {
            "id": str(uuid.uuid4()),
            "key": key,
            "value": value,
            "total_seen": 0,
            "wins": 0,
            "losses": 0,
            "winrate": 0,
            "entry_time": current_time.strftime('%Y-%m-%d %H:%M:%S.%f'),
            "last_seen_time": current_time.strftime('%Y-%m-%d %H:%M:%S.%f')
        }
        rows.append(row)
    
    # Write to CSV file
    with open(csv_file, 'w', newline='') as file:
        fieldnames = ['id', 'key', 'value', 'total_seen', 'wins', 'losses', 'winrate', 'entry_time', 'last_seen_time']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


# Example usage
generate_csv_from_json('spanish_vocab.json', 'GEN_cards.csv')
