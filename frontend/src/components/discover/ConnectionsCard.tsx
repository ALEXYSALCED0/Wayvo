/**
 * ConnectionsCard - Subtle preview card in Discover for future traveler connections
 * Source of Truth: Wayvo Specification Section 12
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

interface ConnectionsCardProps {
  onPress?: () => void;
}

export const ConnectionsCard: React.FC<ConnectionsCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Decorative background glow */}
      <View style={styles.glowOverlay} />

      {/* Header Tag */}
      <View style={styles.tagRow}>
        <View style={styles.comingSoonTag}>
          <Text style={styles.tagText}>COMING SOON</Text>
        </View>
        <View style={styles.membersCount}>
          <MaterialIcons name="group" size={14} color={colors.secondary} />
          <Text style={styles.membersText}>12.4k+ joining</Text>
        </View>
      </View>

      {/* Title & Content */}
      <View style={styles.contentRow}>
        <View style={styles.textWrapper}>
          <Text style={styles.title}>Meet people who share your journey</Text>
          <Text style={styles.description}>
            Connect with verified travelers, local experts, and professional communities heading to your next destinations.
          </Text>
        </View>

        <View style={styles.iconOrb}>
          <MaterialIcons name="person-add" size={24} color={colors.primary} />
        </View>
      </View>

      {/* Bottom CTA preview */}
      <View style={styles.bottomRow}>
        <View style={styles.avatarStack}>
          <View style={[styles.miniAvatar, { backgroundColor: '#92c1fd' }]}>
            <MaterialIcons name="person" size={12} color="#fff" />
          </View>
          <View style={[styles.miniAvatar, { backgroundColor: '#669bcb', marginLeft: -8 }]}>
            <MaterialIcons name="person" size={12} color="#fff" />
          </View>
          <View style={[styles.miniAvatar, { backgroundColor: '#28628f', marginLeft: -8 }]}>
            <MaterialIcons name="person" size={12} color="#fff" />
          </View>
        </View>

        <View style={styles.previewButton}>
          <Text style={styles.previewButtonText}>Join Early Access</Text>
          <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: radii.xl,
    padding: spacing.cardPadding + 2,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOverlay: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryFixed,
    opacity: 0.35,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
  },
  comingSoonTag: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  tagText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  membersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membersText: {
    ...typography.labelSm,
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  description: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  iconOrb: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border + '60',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewButtonText: {
    ...typography.labelMd,
    color: colors.primary,
    fontSize: 13,
  },
});
