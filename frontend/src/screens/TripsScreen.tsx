/**
 * TripsScreen - My Trips Dashboard supporting Current, Upcoming and Past Trips
 * Source of Truth: Stitch My Trips (Rubik) - Connected to Backend API
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radii } from '../theme/spacing';
import { TopAppBar } from '../components/common/TopAppBar';
import { ScreenTransition } from '../components/common/ScreenTransition';
import { useTrip } from '../context/TripContext';
import { Trip } from '../types/trip';

export const TripsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { trips, activeTrip, selectTrip, isLoading } = useTrip();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // The primary current trip is European Adventure (or the currently active trip)
  const currentTrip = trips.find((t) => t.id === 'trip-euro-1') || activeTrip || trips[0];
  
  // All other upcoming trips (excluding the current one)
  const upcomingTrips = trips.filter(
    (t) => t.status !== 'past' && t.id !== currentTrip?.id
  );
  
  // Past trips
  const pastTrips = trips.filter((t) => t.status === 'past');

  const displayedList = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

  const handleOpenTrip = async (trip: Trip) => {
    await selectTrip(trip.id);
    navigation.navigate('DetailedTimeline');
  };

  return (
    <View style={styles.container}>
      <TopAppBar title="Wayvo" />

      <ScreenTransition style={styles.flexOne}>
        {isLoading && trips.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading trips from server...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>My Trips</Text>
              <Text style={styles.subtitle}>
                Manage your active itineraries, upcoming plans, and past journeys.
              </Text>
            </View>

            {/* CURRENT TRIP (Hero Card) */}
            {currentTrip && (
              <View style={styles.currentTripSection}>
                <Text style={styles.sectionHeader}>CURRENT TRIP</Text>

                <TouchableOpacity
                  style={styles.heroTripCard}
                  onPress={() => handleOpenTrip(currentTrip)}
                  activeOpacity={0.92}
                >
                  <Image
                    source={{
                      uri:
                        currentTrip.imageUrl ||
                        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
                    }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  <View style={styles.heroGradient} />

                  {/* Top Badges */}
                  <View style={styles.heroTopRow}>
                    <View style={styles.inProgressBadge}>
                      <View style={styles.badgePulse} />
                      <Text style={styles.badgeText}>In Progress</Text>
                    </View>

                    <View style={styles.mapIconCircle}>
                      <MaterialIcons name="map" size={18} color="#ffffff" />
                    </View>
                  </View>

                  {/* Bottom Details & Progress Bar */}
                  <View style={styles.heroBottomContent}>
                    <Text style={styles.heroTripTitle}>{currentTrip.title}</Text>
                    <Text style={styles.heroTripDates}>{currentTrip.dates}</Text>

                    {/* Progress Bar */}
                    <View style={styles.progressBarWrapper}>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressText}>{currentTrip.progressDays || 'Day 1 of 8'}</Text>
                        <Text style={styles.progressText}>{currentTrip.progressPercent || 25}%</Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${currentTrip.progressPercent || 25}%` as any },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Tabs: Upcoming / Past */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'upcoming' && styles.activeTabButton]}
                onPress={() => setActiveTab('upcoming')}
              >
                <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                  Upcoming ({upcomingTrips.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'past' && styles.activeTabButton]}
                onPress={() => setActiveTab('past')}
              >
                <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                  Past ({pastTrips.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Upcoming / Past Trips List */}
            <View style={styles.tripsList}>
              {displayedList.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No trips found in this category.</Text>
                </View>
              ) : (
                displayedList.map((trip) => (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.tripListItem}
                    onPress={() => handleOpenTrip(trip)}
                    activeOpacity={0.88}
                  >
                    <Image
                      source={{ uri: trip.imageUrl }}
                      style={styles.tripThumb}
                      resizeMode="cover"
                    />

                    <View style={styles.tripInfo}>
                      <View style={styles.tripStatusTag}>
                        <Text style={styles.tripStatusText}>{trip.statusLabel || trip.status}</Text>
                      </View>
                      <Text style={styles.tripItemTitle} numberOfLines={1}>{trip.title}</Text>
                      <Text style={styles.tripItemDates}>{trip.dates}</Text>
                    </View>

                    <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </ScreenTransition>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flexOne: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: spacing.pageMargin,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineLg,
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  currentTripSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  heroTripCard: {
    height: 230,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 28, 58, 0.45)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.cardPadding,
    zIndex: 10,
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    gap: 6,
  },
  badgePulse: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
    backgroundColor: colors.secondaryFixed,
  },
  badgeText: {
    ...typography.labelSm,
    color: '#ffffff',
    fontWeight: '600',
  },
  mapIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottomContent: {
    padding: spacing.cardPadding,
    zIndex: 10,
  },
  heroTripTitle: {
    ...typography.headlineMd,
    color: '#ffffff',
    fontSize: 22,
    marginBottom: 2,
  },
  heroTripDates: {
    ...typography.bodyMd,
    color: colors.secondaryFixed,
    fontSize: 13,
    marginBottom: spacing.sm + 4,
  },
  progressBarWrapper: {
    width: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    ...typography.labelSm,
    color: colors.secondaryFixed,
    fontSize: 11,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.secondaryFixed,
    borderRadius: radii.full,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    padding: 3,
    width: 230,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderRadius: radii.md,
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  tripsList: {
    gap: spacing.md,
  },
  tripListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radii.xl,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tripThumb: {
    width: 70,
    height: 70,
    borderRadius: radii.lg,
    marginRight: spacing.md,
  },
  tripInfo: {
    flex: 1,
  },
  tripStatusTag: {
    backgroundColor: colors.surfaceContainerLow,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
    marginBottom: 4,
  },
  tripStatusText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  tripItemTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 16,
  },
  tripItemDates: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
