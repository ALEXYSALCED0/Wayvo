/**
 * AppNavigator - Root navigation container
 */

import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { BottomTabNavigator } from './BottomTabNavigator';
import { colors } from '../theme/colors';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.surface,
    card: colors.surface,
    text: colors.onSurface,
    border: colors.border,
  },
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer theme={navTheme}>
      <BottomTabNavigator />
    </NavigationContainer>
  );
};
