import React from 'react';
import { Image, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const App = ({ navigation }) => {
  const languageEmojis = [
    { title: 'English', icon: '🇺🇸' },
    { title: 'Spanish', icon: '🇪🇸' },
    { title: 'French', icon: '🇫🇷' },
    { title: 'German', icon: '🇩🇪' },
    { title: 'Italian', icon: '🇮🇹' },
    { title: 'Japanese', icon: '🇯🇵' },
    { title: 'Chinese', icon: '🇨🇳' },
  ];

  return (
    <View style={styles.container}>
      

      <SelectDropdown
        data={languageEmojis}
        onSelect={(selectedItem, index) => {
          console.log(selectedItem, index);
        }}
        renderButton={(selectedItem, isOpened) => {
          return (
            <View style={styles.dropdownButtonStyle}>

              {(selectedItem && (
                  <Text style={styles.dropdownButtonIconStyle}> {selectedItem.icon} </Text>
              ))}
              <Text style={styles.dropdownButtonTxtStyle}>{(selectedItem && selectedItem.title) || 'Select language'}</Text>
          
              <Icon name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
            </View>
          );
        }}
        renderItem={(item, index, isSelected) => {
          if (!item) return null;
          return (
            <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
              <Text style={styles.dropdownButtonIconStyle}> {item.icon} </Text>
              <Text style={styles.dropdownButtonTxtStyle}> {item.title} </Text>
            </View>

          );
        }}
        showsVerticalScrollIndicator={false}
        dropdownStyle={styles.dropdownMenuStyle}
      />

      <TouchableOpacity
        style={styles.playButton}
        onPress={() => navigation.navigate('Quiz')}
      >
        <Icon name="play" size={28} color="green" />
        <Text style={styles.playButtonText}>Play Quiz</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly'
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
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
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  playButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50', // Green
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,

    height: '13%',
    width: '66%'
  },

playButtonText: {
  fontSize: 24,
  color: '#fff', // White
  fontWeight: 'bold',
},

})



export default App;
