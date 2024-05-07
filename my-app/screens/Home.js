import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

function capitalize(word) { 
  const firstLetter = word.charAt(0)
  const firstLetterCap = firstLetter.toUpperCase()
  const remainingLetters = word.slice(1)
  const capitalizedWord = firstLetterCap + remainingLetters
  return capitalizedWord
}

const Home = ({ navigation }) => {
  const [vocabPacks, setVocabPacks] = useState([]);
  
  const [mainLanguage, setMainLanguage] = useState('english')
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedVocabPack, setSelectedVocabPack] = useState(null);

  const vocabPackKeys = [
    'spanish_english-beginner',
    'spanish_english-intermediate', 
    'spanish_english-advanced', 
    'spanish_english-jokes', 
    'spanish_english-romance', 

  ]; // Adjusted keys to match the storage keys
  
  const languages = [
    { language: "Spanish", flag: "🇪🇸" }
  ]

  useEffect(() => {
    // Generate keys based on expected storage pattern
    
    
    const packs = vocabPackKeys.map(key => JSON.parse(storage.getString(key)));

    console.log('PACKSPACKS', packs)
    setVocabPacks(packs);

}, []);

  


  return (
    <View style={styles.container}>
      <SelectDropdown
        data={languages}
        onSelect={(selectedItem, index) => {
          // console.log(selectedItem, index);
          setSelectedLanguage(selectedItem.language)
        }}
        renderButton={(selectedItem, isOpened) => {
          return (
            <View style={styles.dropdownButtonStyle}>
              <Text style={styles.dropdownButtonIconStyle}>
                {selectedItem ? selectedItem.flag : '🌐'}
              </Text>
              <Text style={styles.dropdownButtonTxtStyle}>
                {(selectedItem && selectedItem.language) || 'Select Language'}
              </Text>
              <Icon name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
            </View>
          );
        }}
        renderItem={(item, index, isSelected) => {
          return (
            <View style={{...styles.dropdownButtonStyle, ...(isSelected && {backgroundColor: '#D2D9DF'})}}>
              <Text style={styles.dropdownButtonIconStyle}>{item.flag}</Text>
              <Text style={styles.dropdownButtonTxtStyle}>{item.language}</Text>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        dropdownStyle={styles.dropdownMenuStyle}
      />

      {selectedLanguage && (
        <SelectDropdown
          data={vocabPacks.filter(x => x.languagePair.toLowerCase().startsWith(selectedLanguage.toLowerCase()))}
          onSelect={(selectedItem, index) => {
            // console.log(selectedItem, index);
            setSelectedVocabPack(selectedItem)
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <View style={styles.dropdownButtonStyle}>
                <Text style={styles.dropdownButtonIconStyle}>
                  {selectedItem ? selectedItem.icon : '📚'}
                </Text>
                <Text style={styles.dropdownButtonTxtStyle}>
                  {(selectedItem && capitalize(selectedItem.name)) || 'Select Vocabulary'}
                </Text>
                <Icon name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
              </View>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <View style={{ ...styles.dropdownButtonStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                <Text style={styles.dropdownButtonIconStyle}>{item.icon}</Text>
                <Text style={styles.dropdownButtonTxtStyle}>{capitalize(item.name)}</Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          dropdownStyle={styles.dropdownMenuStyle}
        />
      
      )}

      <TouchableOpacity
        style={styles.playButton}
        onPress={() => navigation.navigate('Quiz', {
          vocabPack: selectedVocabPack,
        })}
      >
        <Text style={styles.playButtonText}>Play Quiz</Text>
        <Icon name="play" size={28} color="green" />
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: '#ffa801'
  },
  dropdownButtonStyle: {
    width: 200,
    height: 50,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  playButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: '13%',
    width: '66%'
  },
  playButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Home;
