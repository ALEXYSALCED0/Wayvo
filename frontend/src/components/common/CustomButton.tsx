import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'havelock' | 'outline' | 'danger' | 'surface';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconRight?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  iconName,
  iconRight = false,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 7,
    }).start();
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'havelock':
        return styles.havelockContainer;
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'surface':
        return styles.surfaceContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'surface':
        return styles.surfaceText;
      case 'secondary':
        return styles.secondaryText;
      case 'havelock':
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={[
          styles.baseContainer,
          getContainerStyle(),
          getSizeStyle(),
          disabled && styles.disabledContainer,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.88}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'surface' ? colors.primary : colors.onPrimary}
          />
        ) : (
          <>
            {iconName && !iconRight && (
              <MaterialIcons
                name={iconName}
                size={size === 'sm' ? 16 : 18}
                color={getTextStyle().color}
                style={styles.iconLeft}
              />
            )}
            <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
            {iconName && iconRight && (
              <MaterialIcons
                name={iconName}
                size={size === 'sm' ? 16 : 18}
                color={getTextStyle().color}
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
  },
  sizeMd: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
  },
  sizeLg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  havelockContainer: {
    backgroundColor: colors.havelockBlue,
  },
  secondaryContainer: {
    backgroundColor: colors.secondary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dangerContainer: {
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.statusError,
  },
  surfaceContainer: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  baseText: {
    ...typography.labelMd,
    textAlign: 'center',
  },
  primaryText: {
    color: colors.onPrimary,
  },
  secondaryText: {
    color: colors.onPrimary,
  },
  outlineText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.statusError,
  },
  surfaceText: {
    color: colors.primary,
  },
  iconLeft: {
    marginRight: spacing.xs + 2,
  },
  iconRight: {
    marginLeft: spacing.xs + 2,
  },
});
