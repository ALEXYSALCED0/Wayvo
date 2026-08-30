/**
 * Wayvo Mobile Application (React Native + TypeScript)
 * Source of Truth: Google Stitch Project "Wayvo AI Travel Architect"
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from '@expo-google-fonts/rubik';
import { TripProvider } from './src/context/TripContext';
import { AIProvider } from './src/context/AIContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <TripProvider>
        <AIProvider>
          <StatusBar style="dark" backgroundColor={colors.surface} />
          <AppNavigator />
        </AIProvider>
      </TripProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
