/**
 * TabBarItem - Smooth 100% Native Animated Bottom Navigation Tab
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radii, spacing } from '../../theme/spacing';

interface TabBarItemProps {
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  isFocused: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export const TabBarItem: React.FC<TabBarItemProps> = ({
  label,
  iconName,
  isFocused,
  onPress,
  onLongPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1.04 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.04 : 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 140,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.04 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={styles.touchable}
    >
      <Animated.View
        style={[
          styles.itemWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Native Animated Pill Background */}
        <Animated.View
          style={[
            styles.pillBackground,
            {
              opacity: opacityAnim,
            },
          ]}
        />

        <MaterialIcons
          name={iconName}
          size={22}
          color={isFocused ? colors.onSecondaryContainer : colors.onSurfaceVariant}
        />
        <Text
          style={[
            styles.label,
            { color: isFocused ? colors.onSecondaryContainer : colors.onSurfaceVariant },
            isFocused && styles.activeLabel,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radii.full,
    minWidth: 62,
    position: 'relative',
  },
  pillBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radii.full,
  },
  label: {
    ...typography.labelSm,
    fontSize: 10,
    marginTop: 2,
  },
  activeLabel: {
    fontWeight: '700',
  },
});
