import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, TouchableOpacity } from 'react-native';
import { sharedStyles } from '../styles';
import { Audio } from 'expo-av';

const getRandomColor = () => {
  const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
  return colors[Math.floor(Math.random() * colors.length)];
};
export default function QuizScreen() {
  const [card, setCard] = useState(null);  // Current card to quiz
  const [options, setOptions] = useState([]);  // Quiz options displayed to the user
  const [correctAnswer, setCorrectAnswer] = useState('');  // Store the correct answer for validation
  const [quizType, setQuizType] = useState('');  // 'key' or 'value', to show what we're asking for
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState(getRandomColor());
  const [sound, setSound] = useState();

  
  useEffect(() => {
    setBackgroundColor(getRandomColor());
  }, [card]); // Update the color when the card changes

  useEffect(() => {
    fetchRecommendedCard();
  }, []);


  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });

    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);


  const playSuccessSound = async () => {
    const { sound: newSound } = await Audio.Sound.createAsync(
       require('../sounds/success.mp3')
    );
    setSound(newSound);
    await newSound.playAsync();
  };

  const playFailureSound = async () => {
    const { sound: newSound } = await Audio.Sound.createAsync(
       require('../sounds/error.mp3')
    );
    setSound(newSound);
    await newSound.playAsync();
  };

  const fetchRecommendedCard = () => {
    fetch('http://127.0.0.1:5000/cards')  // Changed to fetch multiple cards
      .then(response => response.json())
      .then(data => {
        const allCards = data.cards;
        const selectedCard = allCards[Math.floor(Math.random() * allCards.length)];
        setCard(selectedCard);
        prepareQuizOptions(selectedCard, allCards);
      })
      .catch(error => console.error('Error fetching recommended card:', error));
  };
  const prepareQuizOptions = (selectedCard, allCards) => {
    const coinFlip = Math.random() > 0.5;  // Randomly decide the quiz type
    setQuizType(coinFlip ? 'value' : 'key');  // Determine if we are asking for the key or value
    setCorrectAnswer(coinFlip ? selectedCard.value : selectedCard.key);

    // Get an array of possible answers, excluding the correct answer's card
    const potentialAnswers = allCards.filter(item => item.id !== selectedCard.id)
      .map(item => coinFlip ? item.value : item.key);
      
    // Remove duplicates and ensure enough unique options
    const uniqueOptions = [...new Set(potentialAnswers)];
    if (uniqueOptions.length < 4) {
      console.error("Not enough unique options available.");
      return; // Handle this error appropriately in production
    }
    // Select three random options from unique options
    let randomOptions = [];
    while (randomOptions.length < 3) {
      const randomIndex = Math.floor(Math.random() * uniqueOptions.length);
      randomOptions.push(uniqueOptions[randomIndex]);
      uniqueOptions.splice(randomIndex, 1);
    }

    // // Add the correct answer and shuffle
    randomOptions.push(coinFlip ? selectedCard.value : selectedCard.key);
    randomOptions.sort(() => Math.random() - 0.5);


    console.log('randomOptions:', randomOptions)
    setOptions(randomOptions);
};


  const handleAnswer = async (option) => {
  const result = option === correctAnswer ? 'win' : 'loss';
  if (result === 'win') {
    setWins(wins + 1);
    await playSuccessSound();
    Alert.alert("Correct!", "🎉", [{ text: "OK", onPress: () => console.log("OK Pressed") }]);
  } else {
    setLosses(losses + 1);
    await playFailureSound();
    Alert.alert("Wrong!", "❌", [{ text: "OK", onPress: () => console.log("OK Pressed") }]);
  }
  updateCardResult(card.id, result);
  fetchRecommendedCard();  // Get the next card after answering
};


  const updateCardResult = (cardId, result) => {
    fetch(`http://127.0.0.1:5000/card/update/${cardId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ result: result })
    })
    .then(response => response.json())
    .then(data => {
      Alert.alert('Result Updated', `Your answer was a ${result}.`);
    })
    .catch(error => console.error('Error updating card result:', error));
  };

  return (
    <View style={[sharedStyles.container, { backgroundColor }]}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Wins: {wins}, Losses: {losses}, Win Rate: {wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(2) + '%' : '0%'}</Text>
      </View>
      {card ? (
        <>
          <Text style={sharedStyles.titleText}>{quizType === 'key' ? `What is the translation for "${card.key}"?` : `What is the original word for "${card.value}"?`}</Text>
          <View style={sharedStyles.buttonGrid}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={sharedStyles.button}
                onPress={() => handleAnswer(option)}
              >
                <Text style={sharedStyles.buttonText}>{option}</Text>
              </TouchableOpacity>
            ))}

          </View>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  )
}


// styles.js
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  statsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
});