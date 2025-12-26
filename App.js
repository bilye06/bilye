import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './HomeScreen';
import DetailsScreen from './DetailScreen';
import AddReviewScreen from './AddReviewScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          // This boolean caused the crash before because of the library mismatch
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen} 
          options={{ title: 'Establishment Details' }} 
        />
        <Stack.Screen 
            name="AddReview" 
            component={AddReviewScreen} 
            options={{ title: 'Write a Review' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}