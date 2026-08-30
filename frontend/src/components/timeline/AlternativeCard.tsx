/**
 * AlternativeCard - State 3 Option Card for Proposed Alternative Routes & Activities
 * Source of Truth: Stitch Alternative Route Generated Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AlternativeOption } from '../../types/issue';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';

interface AlternativeCardProps {
  option: AlternativeOption;
  isSelected: boolean;
  onSelect: (option: AlternativeOption) => void;
}

export const AlternativeCard: React.FC<AlternativeCardProps> = ({
  option,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        isSelected ? styles.selectedCard : styles.unselectedCard,
      ]}
      onPress={() => onSelect(option)}
      activeOpacity={0.88}
    >
      {/* Fastest / Recommended Badge */}
      {option.isFastest && (
        <View style={styles.fastestBadge}>
          <MaterialIcons name="bolt" size={13} color={colors.onPrimary} />
          <Text style={styles.badgeText}>Fastest</Text>
        </View>
      )}
      {option.isRecommended && !option.isFastest && (
        <View style={styles.recommendedBadge}>
          <MaterialIcons name="auto-awesome" size={13} color={colors.onPrimary} />
          <Text style={styles.badgeText}>Recommended</Text>
        </View>
      )}

      {/* Main Info Row */}
      <View style={styles.topRow}>
        <View style={styles.iconAndTitle}>
          <View style={[styles.iconCircle, isSelected && styles.selectedIconCircle]}>
            <MaterialIcons
              name={(option.iconName as any) || 'train'}
              size={22}
              color={isSelected ? colors.primary : colors.onSurfaceVariant}
            />
          </View>
          <View style={styles.titleWrapper}>
            <Text style={[styles.title, isSelected && styles.selectedTitle]}>
              {option.title}
            </Text>
            <Text style={styles.subtitle}>{option.subtitle}</Text>
          </View>
        </View>

        {/* Radio Checkbox */}
        <View style={[styles.radioCircle, isSelected && styles.selectedRadioCircle]}>
          {isSelected && <MaterialIcons name="check" size={16} color={colors.onPrimary} />}
        </View>
      </View>

      {/* Description */}
      {option.description ? (
        <Text style={styles.descriptionText}>{option.description}</Text>
      ) : null}

      {/* Additional Included Activities if combined scenario */}
      {option.additionalActivities && option.additionalActivities.length > 0 && (
        <View style={styles.activitiesBox}>
          <Text style={styles.activitiesHeader}>INCLUDED IN RECALCULATED ITINERARY:</Text>
          {option.additionalActivities.map((act, idx) => (
            <View key={idx} style={styles.activityItem}>
              <MaterialIcons name="add-circle-outline" size={14} color={colors.primary} />
              <Text style={styles.activityText}>{act}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Times / Metadata Grid */}
      {(option.departureTime || option.duration || option.price) && (
        <View style={styles.metaGrid}>
          {option.departureTime && (
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>DEPARTURE</Text>
              <Text style={styles.metaValue}>{option.departureTime}</Text>
            </View>
          )}
          {option.arrivalTime && (
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>ARRIVAL</Text>
              <Text style={styles.metaValue}>{option.arrivalTime}</Text>
            </View>
          )}
          {option.duration && !option.arrivalTime && (
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>DURATION</Text>
              <Text style={styles.metaValue}>{option.duration}</Text>
            </View>
          )}
          {option.price && (
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>PRICE / DIFF</Text>
              <Text style={[styles.metaValue, { color: colors.primary }]}>
                {option.price} {option.priceDiff ? `(${option.priceDiff})` : ''}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    padding: spacing.cardPadding,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    ...shadows.sm,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#f6f9fc',
    ...Platform.select({
      ios: {
        shadowColor: '#004a75',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  unselectedCard: {
    borderColor: colors.border,
  },
  fastestBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderBottomLeftRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 10,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderBottomLeftRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 10,
  },
  badgeText: {
    ...typography.labelSm,
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    flex: 1,
    paddingRight: spacing.sm,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconCircle: {
    backgroundColor: colors.primaryFixed,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 17,
  },
  selectedTitle: {
    color: colors.primary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    marginTop: 1,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  selectedRadioCircle: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  descriptionText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  activitiesBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activitiesHeader: {
    ...typography.labelSm,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  activityText: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontSize: 12,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm + 2,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border + '60',
  },
  metaColumn: {
    flex: 1,
  },
  metaLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  metaValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
    fontSize: 14,
    marginTop: 2,
  },
});
