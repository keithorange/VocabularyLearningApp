import React, { useState, useEffect } from 'react';
import { View, Text, Button, TouchableOpacity, Animated } from 'react-native';
import { sharedStyles } from '../styles';
import { Audio } from 'expo-av';

const NotificationBanner = ({ message }) => {
    const opacity = new Animated.Value(0); // Reset opacity each time this component renders

    useEffect(() => {
        // Ensure that the animation runs every time the component receives a new message
        if (message) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.delay(3000), // keep visible for 3 seconds
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [message, opacity]); // Depend on message and opacity to trigger animation

    if (!message) return null; // Do not render if no message is available

    return (
        <Animated.View style={[styles.notificationContainer, { opacity }]}>
            <Text style={styles.notificationText}>{message}</Text>
        </Animated.View>
    );
};


const getRandomColor = () => {
  const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'pink'];
  return colors[Math.floor(Math.random() * colors.length)];
};
export default function Quiz() {
  const [card, setCard] = useState(null);  // Current card to quiz
  const [options, setOptions] = useState([]);  // Quiz options displayed to the user
  const [correctAnswer, setCorrectAnswer] = useState('');  // Store the correct answer for validation
  const [quizType, setQuizType] = useState('');  // 'key' or 'value', to show what we're asking for
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState(getRandomColor());
  const [sound, setSound] = useState();

  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);

  
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
  
  // Determine the attribute to display based on quizType, but fetch the opposite attribute for options
  const attributeToShow = coinFlip ? 'value' : 'key';
  const attributeForOptions = coinFlip ? 'key' : 'value';
  
  
      
  setQuizType(attributeToShow); 
  setCorrectAnswer(selectedCard[attributeForOptions]);
  
  // Get an array of possible answers, excluding the correct answer's card
  const potentialAnswers = allCards.filter(item => item[attributeToShow] !== selectedCard[attributeToShow])
    
  // Remove duplicates and ensure enough unique options
  const uniqueOptions = [...new Set(potentialAnswers)];
  if (uniqueOptions.length < 3) {
    console.error("Not enough unique options available.");
    return; // Handle this error appropriately in production
  }
    

  // Select three random options from unique options
  let randomOptions = [];
  while (randomOptions.length < 3) {
    const randomIndex = Math.floor(Math.random() * uniqueOptions.length);
    randomOptions.push(uniqueOptions[randomIndex][attributeForOptions]);
    uniqueOptions.splice(randomIndex, 1);
  }

    // print the key values of all options    
  // Add the correct answer and shuffle
  randomOptions.push(selectedCard[attributeForOptions]);
  randomOptions.sort(() => Math.random() - 0.5);


  setOptions(randomOptions);

  //console.log("selectedCard:", selectedCard, "randomOptions:", randomOptions, "correctAnswer:", correctAnswer);
};



const handleAnswer = async (option) => {
    const result = option === correctAnswer ? 'win' : 'loss';
    const message = result === 'win' ? "Correct! 🎉" : "❌ '" + correctAnswer;
    console.log("Message to display:", message); // Debug log
    setBannerMessage(message);
    setNotificationCount(prevCount => {
        console.log("Current notification count:", prevCount); // Debug log
        return prevCount + 1;
    });
    if (result === 'win') {
        setWins(wins + 1);
        await playSuccessSound();
    } else {
        setLosses(losses + 1);
        await playFailureSound();
    }
    updateCardResult(card.id, result);
    fetchRecommendedCard(); // Get the next card after answering
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
      console.log('updateCardResult success', `Your answer was a ${result}.`);
    })
    .catch(error => console.error('Error updating card result:', error));
  };

  return (
    <View style={[sharedStyles.container, { backgroundColor }]}>
        <NotificationBanner key={notificationCount} message={bannerMessage} />

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Wins: {wins}, Losses: {losses}, Win Rate: {wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(2) + '%' : '0%'}</Text>
      </View>
      {card ? (
        <>
          <Text style={sharedStyles.titleText}>{quizType === 'key' ? `"${card.key}"?` : `"${card.value}"?`}</Text>
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
    fontSize: 16,
    fontWeight: 400,
    color: 'white',
  },
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 5,
  },
  notificationText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
});