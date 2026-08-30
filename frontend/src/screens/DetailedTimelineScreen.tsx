/**
 * DetailedTimelineScreen - Interactive Itinerary Timeline connected to Backend Mediator
 * Source of Truth: Stitch Detailed Timeline Screens (Rubik)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radii, shadows } from '../theme/spacing';
import { TopAppBar } from '../components/common/TopAppBar';
import { TimelineNodeItem } from '../components/timeline/TimelineNodeItem';
import { RecalculatingCard } from '../components/timeline/RecalculatingCard';
import { AlternativeCard } from '../components/timeline/AlternativeCard';
import { ReportIssueSheet } from '../components/timeline/ReportIssueSheet';
import { CustomButton } from '../components/common/CustomButton';
import { ScreenTransition } from '../components/common/ScreenTransition';
import { useTrip } from '../context/TripContext';
import { TimelineItem } from '../types/trip';
import { AlternativeOption } from '../types/issue';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DetailedTimelineScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    activeTrip,
    timeline,
    phase,
    alternatives,
    selectedAlternative,
    isRecalculating,
    recalculatingMessage,
    isLoading,
    errorMessage,
    reportIssue,
    selectAlternative,
    applySelectedAlternative,
    completeEvent,
    resetDemo,
  } = useTrip();

  const [issueSheetVisible, setIssueSheetVisible] = useState(false);
  const [selectedTargetItem, setSelectedTargetItem] = useState<TimelineItem | null>(null);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [phase, isRecalculating, timeline.length]);

  const handleOpenReportIssue = (item?: TimelineItem) => {
    // If specific item selected, target it; otherwise target the pending train
    const target = item || timeline.find((t) => t.id === 'node-train' || t.status === 'pending') || timeline[2];
    setSelectedTargetItem(target || null);
    setIssueSheetVisible(true);
  };

  const handleScenarioSubmit = (issueType: string, reason: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const targetId = selectedTargetItem?.id || 'node-train';
    reportIssue(targetId, issueType, reason);
  };

  const handleSelectAlternative = (option: AlternativeOption) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    selectAlternative(option);
  };

  const handleApplyRoute = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await applySelectedAlternative();
  };

  const handleCompleteEvent = async (item: TimelineItem) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await completeEvent(item.id);
  };

  const handleReset = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await resetDemo();
  };

  const handleViewDetails = (item: TimelineItem) => {
    navigation.navigate('TransportDetails', { itemId: item.id });
  };

  return (
    <View style={styles.container}>
      <TopAppBar
        title="Wayvo"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="refresh" size={18} color={colors.primary} />
            <Text style={styles.resetText}>Reset Demo</Text>
          </TouchableOpacity>
        }
      />

      <ScreenTransition style={styles.flexOne}>
        {isLoading && !isRecalculating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading itinerary...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="cloud-off" size={40} color={colors.onSurfaceVariant} />
            <Text style={styles.errorTitle}>Connection Issue</Text>
            <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Trip Title & Subtitle */}
            <View style={styles.header}>
              <Text style={styles.tripTitle}>
                {activeTrip?.title || 'European Adventure'}
              </Text>
              <Text style={styles.tripSubtitle}>
                {activeTrip?.description || 'Your detailed itinerary. Tap on pending items to view details, mark as completed, or report disruptions.'}
              </Text>
            </View>

            {/* STATE 2: RECALCULATING BANNER */}
            {isRecalculating && (
              <RecalculatingCard
                message={recalculatingMessage}
                subMessage="Wayvo is dynamically evaluating routes and availability..."
              />
            )}

            {/* STATE 3: PROPOSED ALTERNATIVE ROUTES */}
            {phase === 'alternatives_ready' && !isRecalculating && (
              <View style={styles.alternativesSection}>
                <View style={styles.alternativesHeaderRow}>
                  <View style={styles.aiBadge}>
                    <MaterialIcons name="auto-awesome" size={14} color={colors.secondary} />
                    <Text style={styles.aiBadgeText}>ALTERNATIVES GENERATED</Text>
                  </View>
                  <Text style={styles.alternativesCount}>{alternatives.length} options</Text>
                </View>

                <Text style={styles.alternativesTitle}>Alternative Routes Proposed</Text>
                <Text style={styles.alternativesSubtitle}>
                  Select a new connection or extended itinerary to update your journey.
                </Text>

                {/* List of Alternative Cards */}
                <View style={styles.alternativesList}>
                  {alternatives.map((alt) => (
                    <AlternativeCard
                      key={alt.id}
                      option={alt}
                      isSelected={selectedAlternative?.id === alt.id}
                      onSelect={handleSelectAlternative}
                    />
                  ))}
                </View>

                {/* Confirm Choice CTA */}
                <CustomButton
                  title="Choose this route & Update Timeline"
                  variant="havelock"
                  iconName="arrow-forward"
                  iconRight
                  size="lg"
                  onPress={handleApplyRoute}
                  style={styles.confirmRouteBtn}
                />
              </View>
            )}

            {/* STATE UPDATED NOTICE */}
            {phase === 'updated' && (
              <View style={styles.updatedNotice}>
                <MaterialIcons name="check-circle" size={18} color={colors.statusSuccess} />
                <Text style={styles.updatedNoticeText}>
                  Itinerary successfully updated with new route.
                </Text>
              </View>
            )}

            {/* MAIN TIMELINE CONTAINER */}
            <View style={styles.timelineSection}>
              <Text style={styles.timelineSectionTitle}>Current Itinerary Axis</Text>

              <View style={styles.timelineList}>
                {timeline.map((item, index) => (
                  <TimelineNodeItem
                    key={item.id}
                    item={item}
                    isFirst={index === 0}
                    isLast={index === timeline.length - 1}
                    onPressCard={handleViewDetails}
                    onReportIssue={handleOpenReportIssue}
                    onViewTicket={handleViewDetails}
                    onCompleteEvent={handleCompleteEvent}
                    isRecalculating={isRecalculating}
                  />
                ))}
              </View>
            </View>

            {/* Quick Report Issue Bar at Bottom if in Normal state */}
            {phase === 'normal' && (
              <View style={styles.quickIssueBar}>
                <CustomButton
                  title="Report an Issue / Adjust Schedule"
                  variant="danger"
                  iconName="warning"
                  size="md"
                  onPress={() => handleOpenReportIssue()}
                />
              </View>
            )}
          </ScrollView>
        )}
      </ScreenTransition>

      {/* Report Issue Modal Sheet */}
      <ReportIssueSheet
        visible={issueSheetVisible}
        onClose={() => setIssueSheetVisible(false)}
        onSubmit={handleScenarioSubmit}
        targetItemTitle={selectedTargetItem?.title || 'Selected Activity'}
        eventType={selectedTargetItem?.rawEvent?.type || selectedTargetItem?.type || 'TRANSPORT'}
      />
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 18,
  },
  errorSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  retryButtonText: {
    ...typography.labelMd,
    color: '#ffffff',
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.full,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
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
  tripTitle: {
    ...typography.headlineLg,
    color: colors.primary,
    fontSize: 23,
    marginBottom: 4,
  },
  tripSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
    fontSize: 13,
  },
  alternativesSection: {
    backgroundColor: '#ffffff',
    borderRadius: radii.xxl,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: spacing.xl,
  },
  alternativesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  aiBadgeText: {
    ...typography.labelSm,
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  alternativesCount: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  alternativesTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 19,
    marginBottom: 2,
  },
  alternativesSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
    fontSize: 12,
  },
  alternativesList: {
    marginBottom: spacing.sm,
  },
  confirmRouteBtn: {
    marginTop: spacing.xs,
  },
  updatedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.statusSuccess + '60',
  },
  updatedNoticeText: {
    ...typography.labelMd,
    color: '#2e7d32',
    fontSize: 13,
  },
  timelineSection: {
    marginBottom: spacing.lg,
  },
  timelineSectionTitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  timelineList: {
    paddingLeft: spacing.xs,
  },
  quickIssueBar: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
