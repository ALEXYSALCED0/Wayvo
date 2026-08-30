/**
 * ReservationSuccessScreen - Animated Success Screen for Confirmed Bookings
 * Source of Truth: Stitch Reservation Success Screen (Rubik)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radii, shadows } from '../theme/spacing';
import { CustomButton } from '../components/common/CustomButton';
import { useTrip } from '../context/TripContext';

export const ReservationSuccessScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { activeTrip, timeline } = useTrip();

  const itemId = route.params?.itemId || 'node-train';
  const targetEvent =
    (activeTrip?.events || []).find((e) => e.id === itemId) ||
    timeline.find((t) => t.id === itemId)?.rawEvent;

  const bookingRef = targetEvent?.details?.bookingRef || 'WAY-9241-EUR';
  const provider = targetEvent?.details?.provider || 'Wayvo Partner';
  const seat = targetEvent?.details?.seat || 'Reserved Pass';
  const price = targetEvent?.details?.price || 168.5;

  // Animation values (all 100% native driver)
  const circleScale = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Circle Springs In
    Animated.spring(circleScale, {
      toValue: 1,
      tension: 70,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // 2. Ripple pulse expanding
    Animated.parallel([
      Animated.timing(pulseScale, {
        toValue: 1.45,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.timing(pulseOpacity, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Checkmark Pops In with slight delay
    setTimeout(() => {
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 90,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }, 220);

    // 4. Card & CTA Slide Up smoothly
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(cardTranslateY, {
          toValue: 0,
          tension: 65,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);
  }, []);

  const handleReturnToTimeline = () => {
    navigation.navigate('DetailedTimeline');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animated Green Circle & Checkmark */}
        <View style={styles.orbContainer}>
          {/* Expanding Ripple Pulse */}
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          />

          {/* Outer Ring */}
          <Animated.View
            style={[
              styles.successOrbOuter,
              {
                transform: [{ scale: circleScale }],
              },
            ]}
          >
            {/* Inner Circle */}
            <View style={styles.successOrbInner}>
              {/* Checkmark Icon */}
              <Animated.View
                style={{
                  transform: [{ scale: checkScale }],
                }}
              >
                <MaterialIcons name="check" size={44} color="#ffffff" />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: cardOpacity, alignItems: 'center' }}>
          <Text style={styles.title}>Reservation Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your booking ({provider}) is confirmed and seamlessly synchronized with your active {activeTrip?.title || 'European Adventure'} itinerary.
          </Text>
        </Animated.View>

        {/* Confirmation Card with Animated Entrance */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>BOOKING REFERENCE</Text>
            <Text style={styles.cardValue}>{bookingRef}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>SEAT / ACCESS</Text>
            <Text style={styles.cardValue}>{seat}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>TOTAL PAID</Text>
            <Text style={[styles.cardValue, { color: colors.statusSuccess }]}>
              ${price.toFixed(2)}
            </Text>
          </View>
        </Animated.View>

        {/* Action CTA */}
        <Animated.View style={[styles.ctaWrapper, { opacity: ctaOpacity }]}>
          <CustomButton
            title="Back to Trip Timeline"
            variant="primary"
            iconName="arrow-back"
            size="lg"
            onPress={handleReturnToTimeline}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    paddingHorizontal: spacing.pageMargin,
  },
  content: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  orbContainer: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.lg,
  },
  pulseCircle: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#81c784',
  },
  successOrbOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#c8e6c9',
  },
  successOrbInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.statusSuccess,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  title: {
    ...typography.displaySm,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontSize: 24,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: spacing.xl,
    fontSize: 13,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: radii.xl,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  cardLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  cardValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs + 2,
  },
  ctaWrapper: {
    width: '100%',
  },
});
