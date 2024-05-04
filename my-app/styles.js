// styles.js
import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%', // Make sure the container takes full width
    color: 'orange', // Set the background color to orange
    backgroundColor: 'orange', // Set the background color to orange
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%', // Ensure full width usage
  },

  button: {
    backgroundColor: '#841584',
    width: '50%', // Each button takes half the width of the container
    paddingHorizontal: 10,
    paddingVertical: 25,
    margin: 5,
    alignItems: 'center',
    borderRadius: 15,

    textShadowColor: 'rgba(0, 0, 0, 0.2)', // Text shadow for better contrast
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10

  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    textTransform: 'none', // Ensure text is not automatically transformed
  },

  titleText: {
    fontSize: 64, // Increased font size for better visibility
    fontWeight: '500', // Bold text for better visibility
    color: 'white',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.4)', // Text shadow for better contrast
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Ensure the background image is centered
    width: '100%', // Ensure the background covers the full width
    height: '100%', // Ensure the background covers the full height,
    color: 'orange', // Set the background color to orange
    },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    backgroundColor: 'white',
    width: '80%',  // Adjust width as necessary
  },
});
