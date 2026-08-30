/**
 * ProfileScreen - User Preferences, Elite Status & Settings
 * Source of Truth: Stitch Profile Screen (Rubik)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radii, shadows } from '../theme/spacing';
import { TopAppBar } from '../components/common/TopAppBar';
import { ScreenTransition } from '../components/common/ScreenTransition';
import { mockUserProfile } from '../data/mockData';

export const ProfileScreen: React.FC = () => {
  const user = mockUserProfile;

  const menuItems = [
    {
      id: 'pref',
      title: 'Travel Preferences',
      subtitle: 'Seat choices, meal requirements, preferred airlines.',
      icon: 'flight-takeoff',
    },
    {
      id: 'saved',
      title: 'Saved Places',
      subtitle: "Hotels, restaurants, and sights you've saved.",
      icon: 'favorite-border',
    },
    {
      id: 'past',
      title: 'Past Trips',
      subtitle: 'Review your travel history and receipts.',
      icon: 'history',
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      subtitle: 'Manage cards and billing information.',
      icon: 'payment',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Control email, SMS, and push alerts.',
      icon: 'notifications-none',
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Account security, privacy, and app preferences.',
      icon: 'settings',
    },
  ];

  return (
    <View style={styles.container}>
      <TopAppBar title="Wayvo" />

      <ScreenTransition>
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarImageWrapper}>
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
              <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.85}>
                <MaterialIcons name="edit" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{user.name}</Text>

            <View style={styles.eliteBadge}>
              <MaterialIcons name="stars" size={16} color={colors.secondary} />
              <Text style={styles.eliteText}>{user.statusTier}</Text>
            </View>
          </View>

          {/* Menu Cards Grid */}
          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                activeOpacity={0.85}
              >
                <View style={styles.menuIconCircle}>
                  <MaterialIcons name={(item.icon as any) || 'help-outline'} size={20} color={colors.primary} />
                </View>

                <View style={styles.menuTextWrapper}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>

                <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Log Out CTA */}
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenTransition>
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
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: colors.surfaceContainerLow,
    ...shadows.card,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    zIndex: 10,
    elevation: 4,
  },
  userName: {
    ...typography.displaySm,
    color: colors.onSurface,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  eliteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  eliteText: {
    ...typography.labelSm,
    color: colors.secondary,
    fontWeight: '700',
  },
  menuList: {
    gap: spacing.sm + 2,
    marginBottom: spacing.xl,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrapper: {
    flex: 1,
  },
  menuTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 15,
  },
  menuSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  logoutText: {
    ...typography.labelMd,
    color: colors.statusError,
    fontWeight: '700',
    fontSize: 15,
  },
});
