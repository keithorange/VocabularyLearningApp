import numpy as np
import random
from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS
import uuid


app = Flask(__name__)
# This line enables CORS for all domains on all routes.
CORS(app, resources={r"/*": {"origins": "*"}})

data_file = 'cards.csv'



# Initialize the CSV file with headers if it does not exist
def initialize_data():
    try:
        pd.read_csv(data_file)
    except FileNotFoundError:
        df = pd.DataFrame(columns=['id', 'key', 'value', 'total_seen', 'wins', 'losses', 'winrate', 'entry_time', 'last_seen_time'])
        df.to_csv(data_file, index=False)

initialize_data()


@app.route('/cards', methods=['GET'])
def get_cards():
    df = pd.read_csv(data_file)
    total_cards = len(df)
    cards = df.to_dict(orient='records')
    return jsonify({"total_cards": total_cards, "cards": cards})


@app.route('/card', methods=['POST'])
def add_card():
    data = request.json
    df = pd.read_csv(data_file)
    new_entry = pd.DataFrame([{
        'id': str(uuid.uuid4()),
        'key': data['key'],
        'value': data['value'],
        'total_seen': 0,
        'wins': 0,
        'losses': 0,
        'winrate': 0,
        'entry_time': pd.Timestamp.now(),
        'last_seen_time': pd.Timestamp.now()
    }])
    df = pd.concat([df, new_entry], ignore_index=True)
    df.to_csv(data_file, index=False)
    return jsonify({"new_card": new_entry.to_dict(orient='records')[0], "total_cards": len(df)})


@app.route('/card/<id>', methods=['DELETE'])
def delete_card(id):
    df = pd.read_csv(data_file)
    original_length = len(df)
    df = df[df['id'] != id]
    if len(df) == original_length:
        return jsonify({'error': 'Card not found'}), 404
    df.to_csv(data_file, index=False)
    return jsonify({'success': 'Card deleted'}), 200

@app.route('/card/<id>', methods=['PUT'])
def update_card(id):
    data = request.json
    df = pd.read_csv(data_file)
    idx = df[df['id'] == id].index
    if idx.empty:
        return "Card not found", 404
    for key in data.keys():
        df.loc[idx, key] = data[key]
    df.to_csv(data_file, index=False)
    return jsonify(df.loc[idx].to_dict(orient='records')[0])

@app.route('/card/recommend', methods=['GET'])
def recommend_card(skew_factor=1): 
    # The skew factor controls how much the win rates influence the weights. he skew factor is set to 2 in this example, but you can modify it as needed to increase or decrease the selection bias toward cards with lower win rates.
    try:
        df = pd.read_csv(data_file)
        if df.empty:
            return jsonify({"error": "No cards available"}), 404

                
        def calculate_win_rates(df):
            """Calculate win rates for cards."""
            # if total_seen is 0, set winrate to 0
            if df['total_seen'] == 0:
                df['winrate'] = 0
            else:
                df['winrate'] = df['wins'] / df['total_seen']
            
            return df


        def generate_weights(df):
            """Generate weights inversely proportional to win rates with a skew factor."""
            # Adding a small constant to avoid division by zero
            df['weight'] = (1 / (df['winrate'] + 0.01)) ** skew_factor
            df['weight'] /= df['weight'].sum()
            return df


        def weighted_random_selection(df):
            """Select a card based on weighted probabilities."""
            return df.sample(weights='weight').to_dict(orient='records')[0]

        df = calculate_win_rates(df)
        # You can adjust the skew_factor based on your needs
        df = generate_weights(df)
        recommended_card = weighted_random_selection(df)
        return jsonify(recommended_card), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/card/update/<id>', methods=['POST'])
def update_card_result(id):
    df = pd.read_csv(data_file)
    card_index = df.index[df['id'] == id].tolist()
    if not card_index:
        return jsonify({"error": "Card not found"}), 404

    data = request.json
    if 'result' in data:
        if data['result'] == 'win':
            df.at[card_index[0], 'wins'] += 1
        elif data['result'] == 'loss':
            df.at[card_index[0], 'losses'] += 1

        df.at[card_index[0], 'total_seen'] += 1
        df.at[card_index[0], 'winrate'] = df.at[card_index[0],
                                                'wins'] / df.at[card_index[0], 'total_seen']

        df.at[card_index[0], 'last_seen_time'] = pd.Timestamp.now()
        df.to_csv(data_file, index=False)
        return jsonify(df.loc[card_index].to_dict(orient='records')[0]), 200

    return jsonify({"error": "Invalid request"}), 400


if __name__ == '__main__':
    app.run(debug=True)
