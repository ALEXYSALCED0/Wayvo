/**
 * ScreenTransition - Subtle fade & scale entrance transition for mobile screens
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({ children, style }) => {
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0.88)).current;
  const translateYAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    if (isFocused) {
      fadeAnim.setValue(0.88);
      translateYAnim.setValue(6);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
