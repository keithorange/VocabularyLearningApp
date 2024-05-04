import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Image } from 'react-native';
import Home from './screens/Home';
import Quiz from './screens/Quiz';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            title: 'VOCAB GAME',
            headerStyle: {
              backgroundColor: 'rgba(36,39,46,1)',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerLeft: () => (
              <Image
                source={require('./assets/deck.png')}
                style={{ width: 30, height: 30, marginLeft: 10 }}
              />
            ),
          }}
        />
        <Stack.Screen
          name="Quiz"
          component={Quiz}
          options={{
            title: '',
            headerStyle: {
              backgroundColor: 'rgba(36,39,46,1)',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
