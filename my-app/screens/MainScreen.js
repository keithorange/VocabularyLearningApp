import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { sharedStyles } from '../styles';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Table, Row, Rows, TableWrapper, Cell } from 'react-native-reanimated-table';


export default function MainScreen({ navigation }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [cards, setCards] = useState([]);
  const [randomCard, setRandomCard] = useState(null);

  useEffect(() => {
    fetchCards();
  }, []);

  

  const fetchCards = () => {
    fetch('http://127.0.0.1:5000/cards')
      .then(response => response.json())
      .then(data => {
        setCards(data.cards);
        if(data.cards.length > 0){
          setRandomCard(data.cards[Math.floor(Math.random() * data.cards.length)]);
        }
      })
      .catch(error => console.error('Error fetching cards:', error));
  };

  const handleSubmit = () => {
    const cardData = { key, value };
    fetch('http://127.0.0.1:5000/card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cardData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      setCards([...cards, data.new_card]);
      setRandomCard(data.new_card);
      alert(`Card added successfully! Total cards: ${data.total_cards}`);
      setKey('');
      setValue('');
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };

  const handleDelete = (id) => {
  fetch(`http://127.0.0.1:5000/card/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(() => {
    alert('Card deleted successfully');
    fetchCards();  // Re-fetch cards to update the list
  })
  .catch(error => {
    console.error('Error deleting card:', error);
    alert('Failed to delete card');
  });
  };
  
  const tableHead = ['Key', 'Value', 'Wins', 'Losses', 'Win Rate', 'Delete'];
  const widthArr = [100, 100, 60, 60, 80, 80];  // Adjust width for each column as needed


  return (

    <View style={sharedStyles.container}>
      <Image
        source={require('../assets/deck.png')}
        style={styles.deckImage}
      />
      <Text style={sharedStyles.titleText}>Total Cards: {cards.length}</Text>
      {randomCard && (
        <Text style={sharedStyles.titleText}>Random Card: {randomCard.key} - {randomCard.value}</Text>
      )}
      <Text style={sharedStyles.titleText}>Add New Card</Text>
      
      <View style={styles.inputGroup}>
        <TextInput
          style={sharedStyles.input}
          onChangeText={setKey}
          value={key}
          placeholder="Enter Key (Primary Language)"
        />
        <TextInput
          style={sharedStyles.input}
          onChangeText={setValue}
          value={value}
          placeholder="Enter Value (Translated Language)"
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Icon name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.playButton} onPress={() => navigation.navigate('QuizScreen')}>
        <Icon name="play-arrow" size={28} color="white" />
        <Text style={styles.playButtonText}>Play Quiz</Text>
      </TouchableOpacity>


        <Table borderStyle={{ borderWidth: 2, borderColor: '#c8e1ff' }}>
        <Row data={tableHead} style={{ height: 40, backgroundColor: '#f1f8ff' }} textStyle={{ margin: 6 }} widthArr={widthArr} />
        {
          cards.map((card, index) => (
            <TableWrapper key={index} style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
              <Cell data={card.key} textStyle={{ margin: 6 }} />
              <Cell data={card.value} textStyle={{ margin: 6 }} />
              <Cell data={card.wins} textStyle={{ margin: 6 }} />
              <Cell data={card.losses} textStyle={{ margin: 6 }} />
              <Cell data={`${(card.wins / (card.wins + card.losses) * 100).toFixed(1)}%`} textStyle={{ margin: 6 }} />
              <Cell data={<TouchableOpacity onPress={() => handleDelete(card.id)}><Text>Delete</Text></TouchableOpacity>} textStyle={{ margin: 6, color: 'red', fontWeight: 'bold' }} />
            </TableWrapper>
          ))
        }
      </Table>
    </View>
  );
}



const styles = StyleSheet.create({

  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
    backgroundColor: '#f8f8f8',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardText: {
    fontSize: 16,
  },
  deleteIcon: {
    padding: 10,
  },


  container: { flex: 1, padding: 16, paddingTop: 30, backgroundColor: '#fff' },
  head: { height: 40, backgroundColor: '#808B97' },
  text: { margin: 6 },
  row: { flexDirection: 'row', backgroundColor: '#FFF1C1' },
  btn: { width: 58, height: 18, backgroundColor: '#78B7BB',  borderRadius: 2 },
  btnText: { textAlign: 'center', color: '#fff' },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  deckImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  playButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
  },
  playButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 18,
  }
});
