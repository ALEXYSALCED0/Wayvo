/**
 * RecalculatingCard - State 2 Blue AI Recalculating Banner
 * Source of Truth: Stitch Timeline Issue State (Rubik)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

interface RecalculatingCardProps {
  message?: string;
  subMessage?: string;
}

export const RecalculatingCard: React.FC<RecalculatingCardProps> = ({
  message = 'AI Recalculating Route...',
  subMessage = 'Wayvo is finding optimal alternative options based on your event.',
}) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Pulse animation for banner container
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wave pulse for 3 dots
    const createDotAnim = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const d1 = createDotAnim(dot1, 0);
    const d2 = createDotAnim(dot2, 200);
    const d3 = createDotAnim(dot3, 400);

    d1.start();
    d2.start();
    d3.start();

    return () => {
      d1.stop();
      d2.stop();
      d3.stop();
    };
  }, [pulseAnim, dot1, dot2, dot3]);

  return (
    <Animated.View style={[styles.container, { opacity: pulseAnim }]}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="auto-awesome" size={20} color={colors.onPrimary} />
        </View>
        <Text style={styles.title}>{message}</Text>
      </View>

      <Text style={styles.subText}>{subMessage}</Text>

      {/* Pulsing Dots Indicator */}
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1, transform: [{ scale: dot1 }] }]} />
        <Animated.View style={[styles.dot, { opacity: dot2, transform: [{ scale: dot2 }] }]} />
        <Animated.View style={[styles.dot, { opacity: dot3, transform: [{ scale: dot3 }] }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.havelockBlue,
    ...Platform.select({
      ios: {
        shadowColor: '#28628f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.headlineMd,
    color: colors.onPrimary,
    fontSize: 17,
  },
  subText: {
    ...typography.bodyMd,
    color: colors.onPrimary,
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm + 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.onPrimary,
  },
});
