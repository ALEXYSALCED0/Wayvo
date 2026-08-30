/**
 * ReservationConfirmationScreen - Final booking review & mock payment confirmation
 * Source of Truth: Stitch Reservation Confirmation Screen (Rubik)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radii, shadows } from '../theme/spacing';
import { TopAppBar } from '../components/common/TopAppBar';
import { CustomButton } from '../components/common/CustomButton';
import { useTrip } from '../context/TripContext';

export const ReservationConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { activeTrip, timeline, confirmReservation } = useTrip();
  const [loading, setLoading] = useState(false);

  const itemId = route.params?.itemId || 'node-train';

  const targetEvent =
    (activeTrip?.events || []).find((e) => e.id === itemId) ||
    timeline.find((t) => t.id === itemId)?.rawEvent;

  const basePrice = targetEvent?.details?.price || 168.5;
  const taxes = basePrice * 0.12;
  const serviceFee = 15.0;
  const totalPrice = basePrice + taxes + serviceFee;

  const handlePayAndConfirm = async () => {
    setLoading(true);
    await confirmReservation(itemId);
    setLoading(false);
    navigation.navigate('ReservationSuccess', { itemId });
  };

  return (
    <View style={styles.container}>
      <TopAppBar
        title="Reservation Confirmation"
        showBack
        onBack={() => navigation.goBack()}
        showNotifications={false}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Item Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Booking Summary</Text>

          <View style={styles.grid2x2}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>EVENT / SERVICE</Text>
              <Text style={styles.gridValue}>{targetEvent?.title || 'High-Speed Rail'}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>PROVIDER</Text>
              <Text style={styles.gridValue}>{targetEvent?.details?.provider || 'Wayvo Partner'}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>CLASS / CATEGORY</Text>
              <Text style={styles.gridValue}>{targetEvent?.details?.classType || 'Premium'}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>SEAT / ACCESS</Text>
              <Text style={styles.gridValue}>{targetEvent?.details?.seat || 'Reserved'}</Text>
            </View>
          </View>
        </View>

        {/* Passenger Information */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Traveler Information</Text>

          <View style={styles.passengerRow}>
            <View style={styles.passengerNumberBadge}>
              <Text style={styles.passengerNumberText}>1</Text>
            </View>

            <View style={styles.passengerDetails}>
              <Text style={styles.passengerName}>Alex Salcedo</Text>
              <Text style={styles.passengerType}>Adult • Lead Traveler</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Payment Summary</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Fare</Text>
            <Text style={styles.priceVal}>${basePrice.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes & Destination Fees</Text>
            <Text style={styles.priceVal}>${taxes.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Smart Itinerary Coordination</Text>
            <Text style={styles.priceVal}>${serviceFee.toFixed(2)}</Text>
          </View>

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Pay CTA */}
        <View style={styles.ctaContainer}>
          <CustomButton
            title="Pay & Confirm Reservation"
            variant="havelock"
            iconName="lock"
            size="lg"
            loading={loading}
            onPress={handlePayAndConfirm}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: spacing.pageMargin,
    paddingTop: spacing.md,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardSectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 17,
    marginBottom: spacing.md,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '46%',
  },
  gridLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  gridValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 2,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  passengerNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerNumberText: {
    ...typography.labelMd,
    color: colors.onSecondaryContainer,
    fontWeight: '700',
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 15,
  },
  passengerType: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },
  priceVal: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontSize: 13,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 16,
  },
  totalAmount: {
    ...typography.displaySm,
    color: colors.primary,
    fontSize: 24,
  },
  ctaContainer: {
    marginTop: spacing.md,
  },
});
