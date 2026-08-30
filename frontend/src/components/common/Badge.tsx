import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'pending' | 'primary' | 'secondary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'pending',
  style,
  textStyle,
  dot = false,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successContainer;
      case 'warning':
        return styles.warningContainer;
      case 'error':
        return styles.errorContainer;
      case 'primary':
        return styles.primaryContainer;
      case 'secondary':
        return styles.secondaryContainer;
      case 'pending':
      default:
        return styles.pendingContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successText;
      case 'warning':
        return styles.warningText;
      case 'error':
        return styles.errorText;
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'pending':
      default:
        return styles.pendingText;
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case 'success':
        return colors.statusSuccess;
      case 'warning':
        return colors.statusWarning;
      case 'error':
        return colors.statusError;
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'pending':
      default:
        return colors.statusPending;
    }
  };

  return (
    <View style={[styles.container, getContainerStyle(), style]}>
      {dot && <View style={[styles.dot, { backgroundColor: getDotColor() }]} />}
      <Text style={[styles.text, getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    marginRight: 4,
  },
  text: {
    ...typography.labelSm,
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
  },
  successText: {
    color: '#2e7d32',
  },
  warningContainer: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.statusWarning,
  },
  warningText: {
    color: '#b27b00',
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: colors.errorContainer,
  },
  errorText: {
    color: colors.onErrorContainer,
  },
  primaryContainer: {
    backgroundColor: colors.primaryFixed,
  },
  primaryText: {
    color: colors.primary,
  },
  secondaryContainer: {
    backgroundColor: colors.secondaryContainer,
  },
  secondaryText: {
    color: colors.onSecondaryContainer,
  },
  pendingContainer: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pendingText: {
    color: colors.onSurfaceVariant,
  },
});
