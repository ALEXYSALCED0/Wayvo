/**
 * WayvoAIScreen - Conversational Travel Assistant
 * Source of Truth: Stitch Wayvo AI Assistant (Rubik)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radii, shadows } from '../theme/spacing';
import { TopAppBar } from '../components/common/TopAppBar';
import { ChatBubble } from '../components/ai/ChatBubble';
import { ScreenTransition } from '../components/common/ScreenTransition';
import { useAI } from '../context/AIContext';
import { QuickChip } from '../types/ai';

export const WayvoAIScreen: React.FC = () => {
  const { messages, isThinking, sendMessage, handleChipPress } = useAI();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleChip = async (chip: QuickChip) => {
    await handleChipPress(chip);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <TopAppBar title="Wayvo AI" />

      <ScreenTransition style={styles.flexOne}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Chat Messages Canvas */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Timestamp header */}
            <View style={styles.timestampRow}>
              <View style={styles.timestampPill}>
                <Text style={styles.timestampText}>Today, 10:14 AM</Text>
              </View>
            </View>

            {/* Message List */}
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onChipPress={handleChip} />
            ))}

            {/* AI Thinking Indicator */}
            {isThinking && (
              <View style={styles.thinkingRow}>
                <View style={styles.aiOrbSmall}>
                  <MaterialIcons name="auto-awesome" size={14} color="#ffffff" />
                </View>
                <View style={styles.thinkingBubble}>
                  <Text style={styles.thinkingText}>Wayvo is analyzing options...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Chat Input Bar - Positioned cleanly above bottom tab bar */}
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
              <MaterialIcons name="add" size={22} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message or ask Wayvo..."
                placeholderTextColor={colors.outline}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
              activeOpacity={0.85}
            >
              <MaterialIcons name="send" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  chatScroll: {
    flex: 1,
  },
  chatContainer: {
    paddingHorizontal: spacing.pageMargin,
    paddingTop: spacing.md,
    paddingBottom: 24,
  },
  timestampRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timestampPill: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timestampText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aiOrbSmall: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingBubble: {
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thinkingText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.pageMargin,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    marginBottom: Platform.OS === 'ios' ? 98 : 82,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    height: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  textInput: {
    fontSize: 14,
    color: colors.onSurface,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
