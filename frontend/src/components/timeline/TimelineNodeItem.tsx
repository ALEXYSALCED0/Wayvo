/**
 * TimelineNodeItem - Centered vertical axis timeline node with activity card
 * Source of Truth: Stitch Detailed Timeline Screens
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TimelineItem } from '../../types/trip';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { Badge } from '../common/Badge';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TimelineNodeItemProps {
  item: TimelineItem;
  isFirst: boolean;
  isLast: boolean;
  onPressCard?: (item: TimelineItem) => void;
  onReportIssue?: (item: TimelineItem) => void;
  onViewTicket?: (item: TimelineItem) => void;
  onCompleteEvent?: (item: TimelineItem) => void;
  isRecalculating?: boolean;
}

export const TimelineNodeItem: React.FC<TimelineNodeItemProps> = ({
  item,
  isFirst,
  isLast,
  onPressCard,
  onReportIssue,
  onViewTicket,
  onCompleteEvent,
  isRecalculating = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Node visual states
  const isCompleted = item.status === 'completed';
  const isWarning = item.status === 'warning';
  const isPending = item.status === 'pending';

  const getNodeIcon = () => {
    if (isCompleted) return <MaterialIcons name="check" size={16} color={colors.onPrimary} />;
    if (isWarning) return <MaterialIcons name="warning" size={15} color={colors.statusError} />;
    if (item.isAlternative) return <MaterialIcons name="auto-awesome" size={15} color={colors.secondary} />;
    return <View style={styles.pendingDot} />;
  };

  const getNodeStyle = () => {
    if (isCompleted) return styles.nodeCompleted;
    if (isWarning) return styles.nodeWarning;
    if (item.isAlternative) return styles.nodeAlternative;
    return styles.nodePending;
  };

  const getLineStyle = () => {
    if (isCompleted) return styles.lineCompleted;
    if (isWarning) return styles.lineWarning;
    return styles.linePending;
  };

  const getCardBorderStyle = () => {
    if (isWarning) return styles.cardWarningBorder;
    if (item.isAlternative) return styles.cardAlternativeBorder;
    return styles.cardNormalBorder;
  };

  const getBadgeVariant = () => {
    if (isCompleted) return 'success';
    if (isWarning) return 'warning';
    if (item.isAlternative) return 'secondary';
    return 'pending';
  };

  return (
    <View style={styles.rowContainer}>
      {/* Vertical Axis Column */}
      <View style={styles.axisColumn}>
        {/* Top Connecting Line */}
        {!isFirst && <View style={[styles.connectingLineTop, getLineStyle()]} />}

        {/* Timeline Node Circle */}
        <View style={[styles.nodeCircle, getNodeStyle()]}>
          {getNodeIcon()}
        </View>

        {/* Bottom Connecting Line */}
        {!isLast && <View style={[styles.connectingLineBottom, getLineStyle()]} />}
      </View>

      {/* Activity Card Container */}
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          style={[styles.card, getCardBorderStyle()]}
          onPress={toggleExpand}
          activeOpacity={0.88}
        >
          {/* Alternative Pill Badge */}
          {item.isAlternative && (
            <View style={styles.alternativePill}>
              <MaterialIcons name="auto-awesome" size={12} color={colors.secondary} />
              <Text style={styles.alternativePillText}>
                {item.alternativeBadge || 'Alternative Route Confirmed'}
              </Text>
            </View>
          )}

          {/* Card Header: Type Label + Time + Status Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.typeRow}>
              <Text style={[styles.typeLabel, isWarning && styles.warningTypeLabel]}>
                {item.typeLabel}
              </Text>
              <Badge
                label={item.statusLabel || (isCompleted ? 'Completed' : isWarning ? 'Missed' : item.reservationStatus === 'CONFIRMED' ? 'Confirmed' : 'Pending')}
                variant={getBadgeVariant()}
              />
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, isWarning && styles.warningTitle]}>
            {item.title}
          </Text>

          {/* Location if available */}
          {item.location && (
            <View style={styles.locationRow}>
              <MaterialIcons name="place" size={13} color={colors.onSurfaceVariant} />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          )}

          {/* Description */}
          {item.description ? (
            <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
              {item.description}
            </Text>
          ) : null}

          {/* Expandable Details & Actions */}
          {expanded && (
            <View style={styles.detailsContainer}>
              {item.ticket && (
                <View style={styles.detailsGrid}>
                  {item.ticket.platform && (
                    <View style={styles.detailBox}>
                      <Text style={styles.detailLabel}>PLATFORM</Text>
                      <Text style={styles.detailValue}>{item.ticket.platform}</Text>
                    </View>
                  )}
                  {item.ticket.seat && (
                    <View style={styles.detailBox}>
                      <Text style={styles.detailLabel}>SEAT</Text>
                      <Text style={styles.detailValue}>{item.ticket.seat}</Text>
                    </View>
                  )}
                  {item.ticket.bookingRef && (
                    <View style={styles.detailBox}>
                      <Text style={styles.detailLabel}>BOOKING REF</Text>
                      <Text style={styles.detailValue}>{item.ticket.bookingRef}</Text>
                    </View>
                  )}
                  {item.ticket.price && (
                    <View style={styles.detailBox}>
                      <Text style={styles.detailLabel}>PRICE</Text>
                      <Text style={styles.detailValue}>${item.ticket.price.toFixed(2)}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons in expanded card */}
              <View style={styles.actionButtonsRow}>
                {onViewTicket && (
                  <TouchableOpacity
                    style={styles.viewTicketButton}
                    onPress={() => onViewTicket(item)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="qr-code" size={15} color={colors.primary} />
                    <Text style={styles.viewTicketText}>Details / Booking</Text>
                  </TouchableOpacity>
                )}

                {/* Manual Completion Button (if not completed) */}
                {onCompleteEvent && !isCompleted && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => onCompleteEvent(item)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="check-circle" size={15} color="#2e7d32" />
                    <Text style={styles.completeButtonText}>Mark as completed</Text>
                  </TouchableOpacity>
                )}

                {/* Report Issue Button (locked if completed) */}
                {onReportIssue && !isCompleted && (
                  <TouchableOpacity
                    style={styles.reportIssueButton}
                    onPress={() => onReportIssue(item)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="warning" size={15} color={colors.statusError} />
                    <Text style={styles.reportIssueText}>Report Issue</Text>
                  </TouchableOpacity>
                )}

                {isCompleted && (
                  <View style={styles.lockedCompletedBadge}>
                    <MaterialIcons name="lock" size={13} color="#2e7d32" />
                    <Text style={styles.lockedCompletedText}>Completed & Finalized</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Small chevron if expandable */}
          <View style={styles.expandRow}>
            <Text style={styles.expandHint}>
              {expanded ? 'Tap to collapse' : 'Tap to expand & view actions'}
            </Text>
            <MaterialIcons
              name={expanded ? 'expand-less' : 'expand-more'}
              size={18}
              color={colors.outline}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.md + 4,
  },
  axisColumn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  connectingLineTop: {
    position: 'absolute',
    top: 0,
    bottom: '50%',
    width: 2,
    zIndex: 0,
  },
  connectingLineBottom: {
    position: 'absolute',
    top: '50%',
    bottom: -spacing.md - 4,
    width: 2,
    zIndex: 0,
  },
  lineCompleted: {
    backgroundColor: colors.statusSuccess,
  },
  lineWarning: {
    backgroundColor: colors.outlineVariant,
  },
  linePending: {
    backgroundColor: colors.border,
  },
  nodeCircle: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginTop: 16,
  },
  nodeCompleted: {
    backgroundColor: colors.statusSuccess,
  },
  nodeWarning: {
    backgroundColor: '#fff3e0',
    borderWidth: 2,
    borderColor: colors.statusError,
  },
  nodeAlternative: {
    backgroundColor: colors.primaryFixed,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  nodePending: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: colors.border,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  cardWrapper: {
    flex: 1,
    paddingLeft: spacing.sm,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: radii.xl,
    padding: spacing.cardPadding,
    borderWidth: 1,
  },
  cardNormalBorder: {
    borderColor: colors.border,
  },
  cardWarningBorder: {
    borderColor: '#ffb74d',
    backgroundColor: '#fffcf7',
  },
  cardAlternativeBorder: {
    borderColor: colors.primary,
    backgroundColor: '#f6f9fc',
  },
  alternativePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: spacing.xs,
  },
  alternativePillText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeLabel: {
    ...typography.labelSm,
    color: colors.primary,
    letterSpacing: 0.6,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  warningTypeLabel: {
    color: '#e65100',
  },
  timeText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 15,
    marginBottom: 2,
  },
  warningTitle: {
    color: '#b71c1c',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  locationText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  description: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    fontSize: 12,
  },
  detailsContainer: {
    marginTop: spacing.sm + 4,
    paddingTop: spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm + 4,
  },
  detailBox: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
    minWidth: '45%',
  },
  detailLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  detailValue: {
    ...typography.labelMd,
    color: colors.primary,
    fontSize: 12,
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  viewTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.full,
    gap: 4,
  },
  viewTicketText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    gap: 4,
  },
  completeButtonText: {
    ...typography.labelSm,
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 11,
  },
  reportIssueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    gap: 4,
  },
  reportIssueText: {
    ...typography.labelSm,
    color: colors.statusError,
    fontWeight: '700',
    fontSize: 11,
  },
  lockedCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    gap: 3,
  },
  lockedCompletedText: {
    ...typography.labelSm,
    color: '#2e7d32',
    fontSize: 10,
    fontWeight: '600',
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs + 2,
  },
  expandHint: {
    ...typography.labelSm,
    color: colors.outline,
    fontSize: 10,
  },
});
