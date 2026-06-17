import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enGB, registerTranslation } from 'react-native-paper-dates';
import AsyncStorage from '@react-native-async-storage/async-storage';
registerTranslation('en-GB', enGB);

import { theme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkLoginState = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem('isAuthenticated');
        if (loggedIn === 'true') {
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsReady(true);
      }
    };
    checkLoginState();
  }, []);

  const handleAuthChange = async (value) => {
    setIsAuthenticated(value);
    try {
      if (value) {
        await AsyncStorage.setItem('isAuthenticated', 'true');
      } else {
        await AsyncStorage.removeItem('isAuthenticated');
      }
    } catch (e) {
      console.error('Failed to save auth state', e);
    }
  };

  if (!isReady) return null;

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <AppNavigator 
              isAuthenticated={isAuthenticated} 
              setIsAuthenticated={handleAuthChange} 
            />
          </NavigationContainer>
        </PaperProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
