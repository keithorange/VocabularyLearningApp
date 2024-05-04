import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, TouchableOpacity, TouchableWithoutFeedback, Animated, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { sharedStyles } from '../styles';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { PieChart } from 'react-native-gifted-charts';
import ConfettiCannon from 'react-native-confetti-cannon';

const {height, width} = Dimensions.get('window')


const NotificationBanner = ({ innerContent, isVisible, setIsVisible }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(null);

    useEffect(() => {
      if (innerContent) {
        console.log(
          'innerContent', innerContent,
          )
            setIsVisible(true);
            fadeIn();
        }
    }, [innerContent]);

    const fadeIn = () => {
        fadeAnim.current = Animated.timing(opacity, {
            toValue: 1,
            duration: 1,
            useNativeDriver: true,
        });
        fadeAnim.current.start();
    };

    const fadeOut = () => {
        fadeAnim.current = Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        });
        fadeAnim.current.start(() => setIsVisible(false));
    };

    const handleOutsideClick = () => {
        fadeOut();
    };

    if (!isVisible) return null;

    return (
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
            <Animated.View style={[styles.notificationContainer, { opacity }]}>
              {innerContent}
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const getRandomColor = () => {
  const colors = ['#ef5777', '#f53b57', '#ffc048', '#ffa801', '#575fcf', '#3c40c6', '#ffdd59', '#ffd32a', '#4bcffa', '#0fbcf9', '#ff5e57', '#ff3f34', '#34e7e4', '#00d8d6', '#d2dae2', '#808e9b', '#0be881', '#05c46b', '#485460', '#1e272e'];
  
  return colors[Math.floor(Math.random() * colors.length)];
};
export default function Quiz() {
  const [card, setCard] = useState(null);  // Current card to quiz
  const [options, setOptions] = useState([]);  // Quiz options displayed to the user
  const [correctAnswer, setCorrectAnswer] = useState('');  // Store the correct answer for validation
  const [quizType, setQuizType] = useState('');  // 'word' or 'translation', to show what we're asking for

  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [winningStreak, setWinningStreak] = useState(0);
  const [losingStreak, setLosingStreak]= useState(0);

  const [backgroundColor, setBackgroundColor] = useState(null);
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
    // New unique random color
    if (card) {
      let newColor = getRandomColor();
      while (newColor == backgroundColor) {
        newColor = getRandomColor();
      }
      setBackgroundColor(newColor);
    }
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




  const questionText = (quizType === 'word') ? correctAnswer.word : correctAnswer.translation

  const ttsQuestionText = () => Speech.speak(questionText)
  const ttsBoth = () => Speech.speak(correctAnswer.word + ". " + correctAnswer.translation)

  // auto play Translation tts on new card
  useEffect(() => {
    if (card) {
      if (showBanner) {
        // Banner is ON (play both)
        //ttsBoth()

      } else {
        // only play question tts
          ttsQuestionText()
       }
      console.log('correctAnswer', correctAnswer)
    }
  }, [showBanner]); 
  // startup case
  useEffect(() => {
    if (card && (wins + losses == 0)) {
      ttsQuestionText()
    }
  }, [card])

  
  const fetchRecommendedCard = () => {
    fetch('http://127.0.0.1:5000/cards')  // Changed to fetch multiple cards
      .then(response => response.json())
      .then(data => {
        const allCards = data.cards;
        function selectItemByWinrate(items) {
          // Calculate the sum of all winrates
          const totalWinrate = items.reduce((sum, item) => sum + (1 - item.winrate), 0);

          // Generate a random number between 0 and the total winrate
          const randomValue = Math.random() * totalWinrate;

          let cumulativeWinrate = 0;
          for (const item of items) {
            cumulativeWinrate += 1 - item.winrate;
            if (randomValue <= cumulativeWinrate) {
              return item;
            }
          }

          // If no item is selected (which should not happen), return the last item
          return items[items.length - 1];
        }

        const selectedCard = selectItemByWinrate(allCards);
        setCard(selectedCard);
        prepareQuizOptions(selectedCard, allCards);
      })
      .catch(error => console.error('Error fetching recommended card:', error));
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
    console.log('checking if correctAnswer[quizType] === textAnswer', 'correctAnswer[quizType]', correctAnswer[quizType], 'textAnswer', textAnswer)

    const isCorrect = correctAnswer[quizType === 'word' ? 'translation' : 'word'] === textAnswer
    console.log('handleAnswer', 'textAnswer', textAnswer, 'correctAnswer', correctAnswer)

    
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
    fetchRecommendedCard(); // Get the next card after answering
};

  const updateCardResult = (cardId, isCorrect) => {
    const winOrLoss = isCorrect ? 'win': 'loss'
    fetch(`http://127.0.0.1:5000/card/update/${cardId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ result: winOrLoss })
    })
    .then(response => response.json())
    .then(data => {
      console.log('updateCardResult success', `Your answer was a ${winOrLoss}.`);
    })
    .catch(error => console.error('Error updating card result:', error));
  };

  return (
    <View style={[sharedStyles.container, { backgroundColor }]}>
        
      

      <View style={{ flexDirection: 'row', position: 'absolute', top: 0, right: 0, width: width*0.1}}>
        {(winningStreak > 0) && (<Text style={styles.streakText}>{winningStreak}X</Text>)}
        <PieChart
          radius={60}
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
    fontSize: 124,
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