import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotifications?: boolean;
  onNotificationsPress?: () => void;
  rightAction?: React.ReactNode;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title = 'Wayvo',
  showBack = false,
  onBack,
  showNotifications = true,
  onNotificationsPress,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        {/* Leading Item */}
        <View style={styles.leading}>
          {showBack ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          ) : (
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                }}
                style={styles.avatar}
              />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Trailing Item */}
        <View style={styles.trailing}>
          {rightAction ? (
            rightAction
          ) : showNotifications ? (
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={onNotificationsPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="notifications-none" size={22} color={colors.primary} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#001c3a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        position: 'sticky',
        top: 0,
      } as any,
    }),
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pageMargin,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHighest,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.displaySm,
    color: colors.primary,
    fontSize: 22,
    lineHeight: 28,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: radii.full,
    backgroundColor: colors.statusError,
    borderWidth: 1,
    borderColor: colors.surface,
  },
});
