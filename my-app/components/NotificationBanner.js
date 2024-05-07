import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, TouchableOpacity, TouchableWithoutFeedback, Animated, StyleSheet, Dimensions } from 'react-native';


export default function NotificationBanner ({ innerContent, isVisible, setIsVisible }){
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
            duration: 500,
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

