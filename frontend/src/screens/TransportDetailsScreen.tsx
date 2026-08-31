/**
 * TransportDetailsScreen - Generic Event & Booking Details Screen
 * Adapts to any EventType (Transport, Flight, Museum, Meal, Tour, Hotel, Activity)
 * Enforces one-time payment locking and issue locking
 * Source of Truth: Stitch Detailed Screens (Rubik)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radii, shadows } from '../theme/spacing';
import { TopAppBar } from '../components/common/TopAppBar';
import { CustomButton } from '../components/common/CustomButton';
import { ReportIssueSheet } from '../components/timeline/ReportIssueSheet';
import { useTrip } from '../context/TripContext';

export const TransportDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { activeTrip, timeline, reportIssue } = useTrip();
  const [issueSheetVisible, setIssueSheetVisible] = useState(false);

  const itemId = route.params?.itemId || 'node-train';

  // Find target event in active trip or timeline
  const targetEvent =
    (activeTrip?.events || []).find((e) => e.id === itemId) ||
    timeline.find((t) => t.id === itemId)?.rawEvent;

  const eventType = targetEvent?.type || 'TRANSPORT';
  const isCompleted = targetEvent?.status === 'COMPLETED';
  const isReserved = targetEvent?.reservationStatus === 'CONFIRMED';
  const isIssue = targetEvent?.status === 'ISSUE';

  // Get contextual image based on event type
  const getImageForType = () => {
    switch (eventType) {
      case 'FLIGHT':
        return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80';
      case 'MUSEUM':
        return 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&auto=format&fit=crop&q=80';
      case 'MEAL':
        return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';
      case 'HOTEL':
        return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';
      case 'TOUR':
        return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80';
      case 'TRANSPORT':
      default:
        return 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80';
    }
  };

  const getIconForType = (): keyof typeof MaterialIcons.glyphMap => {
    switch (eventType) {
      case 'FLIGHT': return 'flight';
      case 'MUSEUM': return 'museum';
      case 'MEAL': return 'restaurant';
      case 'HOTEL': return 'hotel';
      case 'TOUR': return 'tour';
      case 'TRANSPORT': return 'train';
      default: return 'event';
    }
  };

  const handleReportIssue = (issueType: string, reason: string) => {
    reportIssue(itemId, issueType, reason);
    navigation.navigate('DetailedTimeline');
  };

  const title = targetEvent?.title || 'Event Details';
  const provider = targetEvent?.details?.provider || 'Eurostar Continental';
  const price = targetEvent?.details?.price || 168.5;
  const bookingRef = targetEvent?.details?.bookingRef || 'WAY-9241-EUR';

  return (
    <View style={styles.container}>
      <TopAppBar
        title={targetEvent?.typeLabel || 'Event Details'}
        showBack
        onBack={() => navigation.goBack()}
        showNotifications={false}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with FULL-COVER Background Image */}
        <View style={styles.heroCard}>
          <Image
            source={{ uri: getImageForType() }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={styles.heroGradient} />

          <View style={styles.heroContent}>
            {/* Top Badges */}
            <View style={styles.heroBadgesRow}>
              <View style={styles.typeBadge}>
                <MaterialIcons name={getIconForType()} size={14} color={colors.primary} />
                <Text style={styles.typeBadgeText}>{targetEvent?.typeLabel || eventType}</Text>
              </View>

              <View style={[styles.statusBadge, isCompleted && styles.completedBadge, isIssue && styles.issueBadge, isReserved && !isCompleted && !isIssue && styles.confirmedBadge]}>
                <View style={[styles.statusDot, isCompleted && styles.completedDot, isIssue && styles.issueDot, isReserved && !isCompleted && !isIssue && styles.confirmedDot]} />
                <Text style={[styles.statusText, isCompleted && styles.completedText, isIssue && styles.issueText, isReserved && !isCompleted && !isIssue && styles.confirmedText]}>
                  {isCompleted ? 'Completed' : isIssue ? 'Missed / Replaced' : isReserved ? 'Confirmed' : 'Upcoming'}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.heroTitle}>{title}</Text>
            {targetEvent?.location && (
              <View style={styles.locationRow}>
                <MaterialIcons name="place" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.locationText}>{targetEvent.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Details Bento Grid */}
        <View style={styles.bentoContainer}>
          {/* Schedule / Itinerary Card */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text style={styles.cardSectionTitle}>Schedule & Location</Text>
            </View>

            <View style={styles.journeyNodeRow}>
              <View style={styles.journeyDotWrapper}>
                <View style={styles.departureDot} />
                <View style={styles.journeyLine} />
              </View>
              <View style={styles.journeyTextWrapper}>
                <Text style={styles.journeyTime}>Time Window • {targetEvent?.time || '14:15 - 17:30'}</Text>
                <Text style={styles.journeyStation}>{targetEvent?.location || activeTrip?.origin || 'Rome'}</Text>
                {targetEvent?.details?.platform && (
                  <Text style={styles.journeySub}>{targetEvent.details.platform}</Text>
                )}
              </View>
            </View>

            <View style={styles.journeyNodeRow}>
              <View style={styles.journeyDotWrapper}>
                <View style={styles.arrivalDot}>
                  <MaterialIcons name="flag" size={12} color={colors.primary} />
                </View>
              </View>
              <View style={styles.journeyTextWrapper}>
                <Text style={styles.journeyTime}>Destination</Text>
                <Text style={styles.journeyStation}>{activeTrip?.destination || 'Paris'}</Text>
              </View>
            </View>
          </View>

          {/* Booking & Details Card */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialIcons name="confirmation-number" size={20} color={colors.primary} />
              <Text style={styles.cardSectionTitle}>Booking & Details</Text>
            </View>

            <View style={styles.grid2x2}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>PROVIDER</Text>
                <Text style={styles.gridValue}>{provider}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>BOOKING REF</Text>
                <Text style={styles.gridValue}>{isReserved ? bookingRef : 'Not Reserved'}</Text>
              </View>

              {targetEvent?.details?.seat && (
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>ASSIGNED SEAT</Text>
                  <Text style={styles.gridValue}>{targetEvent.details.seat}</Text>
                </View>
              )}

              {targetEvent?.details?.classType && (
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>CLASS / CATEGORY</Text>
                  <Text style={styles.gridValue}>{targetEvent.details.classType}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Price Summary Card */}
          <View style={[styles.glassCard, styles.priceCard]}>
            <Text style={styles.priceLabel}>Estimated / Booked Price</Text>
            <Text style={styles.priceAmount}>${price.toFixed(2)}</Text>
            <Text style={styles.priceSub}>All fees and itinerary coordination included</Text>
          </View>
        </View>

        {/* Actions & Lifecycle Notices */}
        <View style={styles.actionButtons}>
          {/* 1. ONE-TIME PAYMENT: Only available if NOT reserved, not completed, and not in issue */}
          {!isReserved && !isCompleted && !isIssue && (
            <CustomButton
              title="Pay & Confirm Reservation"
              variant="havelock"
              iconName="lock"
              size="lg"
              onPress={() => navigation.navigate('ReservationConfirmation', { itemId })}
            />
          )}

          {/* 2. ALREADY PAID & CONFIRMED NOTICE */}
          {isReserved && !isCompleted && !isIssue && (
            <View style={styles.confirmedNoticeBox}>
              <MaterialIcons name="check-circle" size={18} color="#2e7d32" />
              <View style={styles.confirmedNoticeTextWrapper}>
                <Text style={styles.confirmedNoticeTitle}>Reservation Confirmed & Paid</Text>
                <Text style={styles.confirmedNoticeSub}>
                  Pass is active. Event remains upcoming until you complete it.
                </Text>
              </View>
            </View>
          )}

          {/* 3. REPORT ISSUE: Available as long as event is PENDING and not already in ISSUE state */}
          {!isCompleted && !isIssue && (
            <CustomButton
              title={`Report Issue / Adjust ${targetEvent?.typeLabel || 'Event'}`}
              variant="danger"
              iconName="warning"
              size="md"
              onPress={() => setIssueSheetVisible(true)}
              style={styles.reportButton}
            />
          )}

          {/* 4. LOCKED IN ISSUE STATE */}
          {isIssue && (
            <View style={styles.issueNoticeBox}>
              <MaterialIcons name="warning" size={18} color="#c2410c" />
              <View style={styles.confirmedNoticeTextWrapper}>
                <Text style={styles.issueNoticeTitle}>Disruption Reported (Locked)</Text>
                <Text style={styles.issueNoticeSub}>
                  This event is in recalculation or has been replaced by an alternative. Conflicting bookings and edits are locked.
                </Text>
              </View>
            </View>
          )}

          {/* 5. LOCKED IN COMPLETED STATE */}
          {isCompleted && (
            <View style={styles.completedNotice}>
              <MaterialIcons name="lock" size={16} color="#2e7d32" />
              <Text style={styles.completedNoticeText}>This event has been marked as completed & finalized.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Report Issue Sheet */}
      <ReportIssueSheet
        visible={issueSheetVisible}
        onClose={() => setIssueSheetVisible(false)}
        onSubmit={handleReportIssue}
        targetItemTitle={title}
        eventType={eventType}
      />
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
  heroCard: {
    height: 220,
    width: '100%',
    borderRadius: radii.xxl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 28, 58, 0.48)',
  },
  heroContent: {
    zIndex: 10,
    padding: spacing.cardPadding,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  typeBadgeText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  confirmedBadge: {
    backgroundColor: '#e8f5e9',
  },
  completedBadge: {
    backgroundColor: '#e8f5e9',
  },
  issueBadge: {
    backgroundColor: '#fff3e0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  confirmedDot: {
    backgroundColor: '#2e7d32',
  },
  completedDot: {
    backgroundColor: '#2e7d32',
  },
  issueDot: {
    backgroundColor: colors.statusError,
  },
  statusText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
  confirmedText: {
    color: '#2e7d32',
  },
  completedText: {
    color: '#2e7d32',
  },
  issueText: {
    color: colors.statusError,
  },
  heroTitle: {
    ...typography.displayLg,
    color: '#ffffff',
    fontSize: 23,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  locationText: {
    ...typography.bodySm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  bentoContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  glassCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  cardSectionTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 17,
  },
  journeyNodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  journeyDotWrapper: {
    alignItems: 'center',
    width: 24,
  },
  departureDot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryFixed,
  },
  journeyLine: {
    width: 2,
    height: 36,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  arrivalDot: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyTextWrapper: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  journeyTime: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  journeyStation: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 15,
    marginTop: 1,
  },
  journeySub: {
    ...typography.bodySm,
    color: colors.outline,
    fontSize: 11,
    marginTop: 1,
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
  priceCard: {
    backgroundColor: colors.surfaceBright,
  },
  priceLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  priceAmount: {
    ...typography.displaySm,
    color: colors.primary,
    fontSize: 26,
    marginTop: 2,
  },
  priceSub: {
    ...typography.bodySm,
    color: colors.outline,
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    gap: spacing.sm + 2,
  },
  reportButton: {
    marginTop: spacing.xs,
  },
  confirmedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  confirmedNoticeTextWrapper: {
    flex: 1,
  },
  confirmedNoticeTitle: {
    ...typography.labelMd,
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 13,
  },
  confirmedNoticeSub: {
    ...typography.bodySm,
    color: '#388e3c',
    fontSize: 12,
    marginTop: 1,
  },
  issueNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff7ed',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  issueNoticeTitle: {
    ...typography.labelMd,
    color: '#c2410c',
    fontWeight: '700',
    fontSize: 13,
  },
  issueNoticeSub: {
    ...typography.bodySm,
    color: '#9a3412',
    fontSize: 12,
    marginTop: 1,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  completedNoticeText: {
    ...typography.labelMd,
    color: '#2e7d32',
    fontSize: 13,
  },
});
