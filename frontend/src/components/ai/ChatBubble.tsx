/**
 * ChatBubble - Messages and action chips for Wayvo AI assistant
 * Source of Truth: Stitch Wayvo AI Assistant Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatMessage, QuickChip } from '../../types/ai';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

interface ChatBubbleProps {
  message: ChatMessage;
  onChipPress?: (chip: QuickChip) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onChipPress }) => {
  const isAI = message.sender === 'ai';

  if (!isAI) {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.text}</Text>
        </View>
        <Text style={styles.userTime}>{message.timestamp}</Text>
      </View>
    );
  }

  return (
    <View style={styles.aiContainer}>
      <View style={styles.aiRow}>
        {/* AI Avatar Orb */}
        <View style={styles.aiOrb}>
          <MaterialIcons name="auto-awesome" size={18} color="#ffffff" />
        </View>

        {/* Message Content */}
        <View style={styles.aiContentWrapper}>
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>{message.text}</Text>
          </View>
          <Text style={styles.aiTime}>{message.timestamp}</Text>

          {/* Quick Action Chips */}
          {message.quickChips && message.quickChips.length > 0 && (
            <View style={styles.chipsRow}>
              {message.quickChips.map((chip) => {
                return (
                  <TouchableOpacity
                    key={chip.id}
                    style={[
                      styles.chip,
                      chip.isPrimary ? styles.primaryChip : styles.secondaryChip,
                    ]}
                    onPress={() => onChipPress && onChipPress(chip)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        chip.isPrimary ? styles.primaryChipText : styles.secondaryChipText,
                      ]}
                    >
                      {chip.label}
                    </Text>
                    {chip.iconName && (
                      <MaterialIcons
                        name={(chip.iconName as any) || 'arrow-forward'}
                        size={14}
                        color={chip.isPrimary ? '#ffffff' : colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userContainer: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.xl,
    borderBottomRightRadius: radii.xs,
  },
  userText: {
    ...typography.bodyMd,
    color: '#ffffff',
    lineHeight: 20,
    fontSize: 14,
  },
  userTime: {
    ...typography.labelSm,
    color: colors.outline,
    fontSize: 10,
    marginTop: 3,
    marginRight: 4,
  },
  aiContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    width: '100%',
  },
  aiOrb: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiContentWrapper: {
    flex: 1,
  },
  aiBubble: {
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radii.xl,
    borderTopLeftRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  aiText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    lineHeight: 21,
    fontSize: 14,
  },
  aiTime: {
    ...typography.labelSm,
    color: colors.outline,
    fontSize: 10,
    marginTop: 4,
    marginLeft: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm + 2,
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs + 4,
    borderRadius: radii.full,
    gap: 6,
  },
  primaryChip: {
    backgroundColor: colors.havelockBlue,
  },
  secondaryChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.labelMd,
    fontSize: 12,
  },
  primaryChipText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryChipText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
