import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enGB, registerTranslation } from 'react-native-paper-dates';
registerTranslation('en-GB', enGB);

import { theme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';

export default function App() {
  // Temporary state for mock authentication until Firebase is configured
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <AppNavigator 
              isAuthenticated={isAuthenticated} 
              setIsAuthenticated={setIsAuthenticated} 
            />
          </NavigationContainer>
        </PaperProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
