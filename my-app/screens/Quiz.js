import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, TouchableOpacity, TouchableWithoutFeedback, Animated, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { sharedStyles } from '../styles';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { PieChart } from 'react-native-gifted-charts';
import ConfettiCannon from 'react-native-confetti-cannon';

import NotificationBanner from '../components/NotificationBanner'
const {height, width} = Dimensions.get('window')

import { recommendCard, updateCard, getCard, getVocabPack, getCards } from '../utils/storage';


const getRandomColor = () => {
  const colors = ['#ef5777', '#f53b57', '#ffc048', '#ffa801', '#575fcf', '#3c40c6', '#ffdd59', '#ffd32a', '#4bcffa', '#0fbcf9', '#ff5e57', '#ff3f34', '#34e7e4', '#00d8d6',   '#0be881', '#05c46b'];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function Quiz({ route }) {
  const { vocabPack } = route.params || {}; // Provide an empty object as fallback

  const [cards, setCards] = useState([]);
  const [card, setCard] = useState(null);  // Current card to quiz


  const [options, setOptions] = useState([]);  // Quiz options displayed to the user
  const [correctAnswer, setCorrectAnswer] = useState('');  // Store the correct answer for validation
  const [quizType, setQuizType] = useState('');  // 'word' or 'translation', to show what we're asking for

  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [winningStreak, setWinningStreak] = useState(0);
  const [losingStreak, setLosingStreak]= useState(0);

  const [backgroundColor, setBackgroundColor] = useState('#0be881'); // Default background color
  const [sound, setSound] = useState();

  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);


  // confetti  
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  const triggerConfetti = () => {
    setShowConfetti(true);
    // Automatically reset confetti to not show after it's done
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000); // Assume confetti animation lastsMAX  5 seconds
  };

    // if show conetti on, shoot confetti time!
  useEffect(() => {
    if (showConfetti) { 
      if (confettiRef) { 
        confettiRef.current.start(); 
        // timetout to stop() anim after 
        setTimeout(() => {
          confettiRef.current.stop();
        }, 5000); // Assume confetti animation lasts 5 seconds
      }

    }
  }, [showConfetti])

  

  useEffect(() => {
    console.log("Received language pack in Quiz:", vocabPack);
    if (vocabPack) {
      setCards(vocabPack.cards)
      // use vocabPack.cards since cards not set yet asyncly

      fetchRecommendedCard();
    }
  }, [vocabPack]);

  
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });

    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);


  function getVolumeFromStreak(streak, maxStreak = 10, minVol = 0.5, maxVol = 1.0) {
  const cappedStreak = Math.min(streak, maxStreak);
  const scaledVol = (cappedStreak / maxStreak) * (maxVol - minVol) + minVol;
  return scaledVol;
}

  const playSuccessSound = async () => {
    const { sound: newSound } = await Audio.Sound.createAsync(
      require('../sounds/success.mp3')
    );
    setSound(newSound); // Assign the new sound object to the state
    await newSound.playAsync(); // Use the new sound object

    const scaledVolume = getVolumeFromStreak(winningStreak);
    await newSound.setVolumeAsync(scaledVolume); // Use the new sound object
  };

  const playFailureSound = async () => {
    const { sound: newSound } = await Audio.Sound.createAsync(
      require('../sounds/error.mp3')
    );
    setSound(newSound); // Assign the new sound object to the state
    await newSound.playAsync(); // Use the new sound object

    const scaledVolume = getVolumeFromStreak(losingStreak);
    await newSound.setVolumeAsync(scaledVolume); // Use the new sound object
  };


  const setNewRandomBackgroundcolor = () => { 
    let newColor = getRandomColor();
      while (newColor == backgroundColor) {
        newColor = getRandomColor();
      }
      setBackgroundColor(newColor);
  }

  const questionText = (quizType === 'word') ? correctAnswer.word : correctAnswer.translation


  const ttsQuestionText = () => Speech.speak(questionText, {
    rate: 0.85,
  })
  const ttsBoth = () => Speech.speak(correctAnswer.word + ". " + correctAnswer.translation)

  // auto play Translation tts on new card
  useEffect(() => {
    if (card) {
      if (showBanner) {
        // Banner is ON (play both)
        //ttsBoth()

      } else {
        // only play question tts
      //setNewRandomBackgroundcolor()
        ttsQuestionText()
       }
      console.log('correctAnswer', correctAnswer)
    }
  }, [showBanner]); 
  
  // startup case
  useEffect(() => {
    if (card && (wins + losses == 0)) {
      //setNewRandomBackgroundcolor()
      ttsQuestionText()
    }
  }, [card])

  
  // Modify fetchRecommendedCard to use passed cards
  const fetchRecommendedCard = () => {
    const loadedCards = getCards(vocabPack.languagePair, vocabPack.name)
    const recommendedCard = recommendCard(loadedCards); // Modify recommendCard to accept cards
    setCard(recommendedCard);

    console.log('preparing quiz options', 'recommendedCard', recommendedCard, 'loadedCards', loadedCards)
    prepareQuizOptions(recommendedCard, loadedCards); // Ensure it uses the loaded cards
  };

  const prepareQuizOptions = (selectedCard, allCards) => {
    // choose between showing translation -> word or vice versa!
    const coinFlip = Math.random() > 0.5;  // Randomly decide the quiz type
    
    // Determine the attribute to display based on quizType, but fetch the opposite attribute for options
    const attributeToShow = coinFlip ? 'translation' : 'word';
    const attributeForOptions = coinFlip ? 'word' : 'translation';
  

    setQuizType(attributeToShow); 
    setCorrectAnswer(selectedCard);
    
    // Get an array of possible answers, excluding the correct answer's card
    const potentialAnswers = allCards.filter(item => item[attributeToShow] !== selectedCard[attributeToShow])
      

    console.log(selectedCard, potentialAnswers)

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

      // print the word translations of all options    
    // Add the correct answer and shuffle
    randomOptions.push(selectedCard[attributeForOptions]);
    randomOptions.sort(() => Math.random() - 0.5);


    setOptions(randomOptions);

    //console.log("selectedCard:", selectedCard, "randomOptions:", randomOptions, "correctAnswer:", correctAnswer);
};

  
  

  
  const handleAnswer = async (option) => {
    const textAnswer = option;
    const isCorrect = correctAnswer[quizType === 'word' ? 'translation' : 'word'] === textAnswer

    const message = (
      <View style={{
        backgroundColor: isCorrect ? 'rgba(0,167,0,0.9)' : 'rgba(188,32,38,0.9)', height: '100%', width: '100%',
        flex: 1, justifyContent: 'space-evenly', alignItems: 'center'
      }}>
        
        <Text style={{fontSize: 64, fontWeight: 600,color: 'white'}}>{isCorrect ? "Correct! 🎉" : "Wrong! ❌ "}</Text>

        <Text style={{ fontSize: 32, fontWeight: 400, color: 'white' }}>{correctAnswer['translation']}</Text>
        
        <Text style={{ fontSize: 32, fontWeight:400, color: 'white' }}>{correctAnswer['word']}</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{fontSize: 32, fontWeight: 300,color: 'white'}}>{correctAnswer['ipa']}</Text>
          <TouchableOpacity onPress={ttsBoth}>
            <Text style={{fontSize: 42, paddingLeft: 10}} >🔊</Text>
          </TouchableOpacity>
        </View>


        <Text style={{fontSize: 65, }}>{correctAnswer['illustration']}</Text>

      </View>
    )

    console.log("Message to display:", message); // Debug log
  
    setBannerMessage(message);

    setNotificationCount(prevCount => {
        console.log("Current notification count:", prevCount); // Debug log
        return prevCount + 1;
    });

    // WIN !!
    if (isCorrect) {
      setWins(wins + 1);
      setWinningStreak(winningStreak + 1)
      setLosingStreak(0)
      triggerConfetti()
      await playSuccessSound();

      
    // LOSS !!
    } else {
        setLosses(losses + 1);
        setWinningStreak(0)
        setLosingStreak(losingStreak +1)

        await playFailureSound();
    }
    updateCardResult(card.id, isCorrect);
    setNewRandomBackgroundcolor()
    fetchRecommendedCard(); // Get the next card after answering
};

  const updateCardResult = async (cardId, isCorrect) => {
    const oldCard = getCard(vocabPack.languagePair, vocabPack.name, cardId);
    if (!oldCard) {
      console.error('Card not found');
      return;
    }

    const newWins = isCorrect ? oldCard.wins + 1 : oldCard.wins;
    const newLosses = isCorrect ? oldCard.losses : oldCard.losses + 1;

    // Use the existing updateCard function to update the card data
    await updateCard(vocabPack.languagePair, vocabPack.name, cardId, {
      wins: newWins,
      losses: newLosses,
      winrate: (newWins + newLosses > 0) ? (newWins / (newWins + newLosses) * 100).toFixed(2) : 0
    });

    // Fetch the updated vocab pack to reflect the changes in the UI
    const updatedVocabPack = getVocabPack(vocabPack.languagePair, vocabPack.name);
    if (updatedVocabPack) {
      setCards(updatedVocabPack.cards); // Update the cards state to reflect the new card data
    }

    console.log("ENSURING CARD UPDATED: ", 'oldCard', oldCard, )
  }




  return (
    <View style={[sharedStyles.container, { backgroundColor }]}>
        
      

      <View style={{ position: 'absolute', top: 10, left: 10, width: width*0.1}}>
        {(winningStreak > 0) && (<Text style={styles.streakText}>{winningStreak}</Text>)}
      </View>
      <View style={{ position: 'absolute', top: 10, right: width*0.02-10 }}>
        <PieChart
          radius={width*0.04}
          data={[
            { value: wins, color: 'green' },
            { value: losses, color: 'red'}
          ]}
          />
      </View>
      {card ? (
        <>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={sharedStyles.titleText}>"{questionText}"</Text>
            <TouchableOpacity onPress={ttsQuestionText}>
              <Text style={{fontSize: 42, paddingLeft: 20}} >🔊</Text>
            </TouchableOpacity>
          </View>
          <View style={sharedStyles.buttonGrid}>
            {options.map((option, index) => (
              <TouchableOpacity
                word={index}
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
      <NotificationBanner word={notificationCount} innerContent={bannerMessage} isVisible={showBanner} setIsVisible={setShowBanner} />
      {showConfetti && (
        <ConfettiCannon
          count={64}
          origin={{ x: height*0.2, y: 0 }}
          fadeOut={true}
          autoStart={false}
          ref={confettiRef}
          fallSpeed={3000} />
      )}
    </View>
  )
}



const styles = StyleSheet.create({
  statsContainer: {
    // position: 'absolute',
    // top: 10,
    // right: 10,
    flexDirection: 'row',
  },
  statsText: {
    fontSize: 16,
    fontWeight: 400,
    color: 'white',
  },
  streakText: {
    fontSize: 100,
    fontWeight: 800,
    color: 'orange',
    paddingRight: 20
  },

  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 30,
    zIndex: 1000,
  },
  notificationText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
});

