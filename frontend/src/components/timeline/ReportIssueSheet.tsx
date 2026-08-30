/**
 * ReportIssueSheet - Generic Modal for Reporting Disruptions or Plan Changes
 * Dynamically adapts options to the selected event type
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radii, shadows } from '../../theme/spacing';
import { CustomButton } from '../common/CustomButton';

export interface IssueOptionItem {
  id: string;
  issueType: 'MISSED' | 'CANCELLED' | 'USER_CHANGED_PLAN' | 'UNAVAILABLE';
  title: string;
  description: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
}

interface ReportIssueSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (issueType: string, reason: string) => void;
  targetItemTitle?: string;
  eventType?: string;
}

export const ReportIssueSheet: React.FC<ReportIssueSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  targetItemTitle = 'Train to France',
  eventType = 'TRANSPORT',
}) => {
  const normalizedType = eventType.toUpperCase();

  const getOptionsForType = (): IssueOptionItem[] => {
    switch (normalizedType) {
      case 'TRANSPORT':
        return [
          {
            id: 'opt-missed-train',
            issueType: 'MISSED',
            title: 'I missed my train / transport',
            description: 'Recalculate route and find the next available train or alternative coach.',
            iconName: 'train',
          },
          {
            id: 'opt-stay-longer',
            issueType: 'USER_CHANGED_PLAN',
            title: 'I want to change plans / stay longer',
            description: 'Extend current stay and reorganize subsequent travel connections.',
            iconName: 'schedule',
          },
          {
            id: 'opt-cancelled-train',
            issueType: 'CANCELLED',
            title: 'Transit service cancelled / strike',
            description: 'Find immediate detour routes, alternative lines, or private shuttles.',
            iconName: 'cancel',
          },
        ];

      case 'FLIGHT':
        return [
          {
            id: 'opt-missed-flight',
            issueType: 'MISSED',
            title: 'I missed my flight / gate closed',
            description: 'Check next scheduled departures and rebooking options.',
            iconName: 'flight-takeoff',
          },
          {
            id: 'opt-cancelled-flight',
            issueType: 'CANCELLED',
            title: 'Flight cancelled / weather delay',
            description: 'Find partner airlines and priority standby seating.',
            iconName: 'airplanemode-inactive',
          },
          {
            id: 'opt-change-flight',
            issueType: 'USER_CHANGED_PLAN',
            title: 'Change flight departure time',
            description: 'Reschedule flight and coordinate hotel arrival.',
            iconName: 'edit-calendar',
          },
        ];

      case 'MUSEUM':
      case 'TOUR':
        return [
          {
            id: 'opt-closed-museum',
            issueType: 'CANCELLED',
            title: 'Venue / Museum is closed today',
            description: 'Find nearby galleries, architectural walks, or cultural experiences.',
            iconName: 'museum',
          },
          {
            id: 'opt-unavail-tour',
            issueType: 'UNAVAILABLE',
            title: 'Guide or tickets unavailable',
            description: 'Suggest alternative VIP access tours in the historic district.',
            iconName: 'tour',
          },
          {
            id: 'opt-change-museum',
            issueType: 'USER_CHANGED_PLAN',
            title: 'Reschedule to another day',
            description: 'Move cultural visit to later in the itinerary.',
            iconName: 'event',
          },
        ];

      case 'MEAL':
        return [
          {
            id: 'opt-unavail-dine',
            issueType: 'UNAVAILABLE',
            title: 'Restaurant is fully booked / closed',
            description: 'Find top-rated culinary alternatives and reserved artisan tables.',
            iconName: 'restaurant',
          },
          {
            id: 'opt-change-dine',
            issueType: 'USER_CHANGED_PLAN',
            title: 'Change dining time or cuisine style',
            description: 'Discover casual bistros or Michelin-rated experiences.',
            iconName: 'local-dining',
          },
        ];

      default:
        return [
          {
            id: 'opt-generic-missed',
            issueType: 'MISSED',
            title: 'Could not attend / missed scheduled time',
            description: 'Find alternative times or replacement activities.',
            iconName: 'event-busy',
          },
          {
            id: 'opt-generic-cancelled',
            issueType: 'CANCELLED',
            title: 'Activity cancelled by provider',
            description: 'Recommend replacement local experiences.',
            iconName: 'block',
          },
          {
            id: 'opt-generic-plan',
            issueType: 'USER_CHANGED_PLAN',
            title: 'I want to change my plans',
            description: 'Reorganize this part of the journey.',
            iconName: 'tune',
          },
        ];
    }
  };

  const options = getOptionsForType();
  const [selectedOption, setSelectedOption] = useState<IssueOptionItem>(options[0]);

  useEffect(() => {
    const newOptions = getOptionsForType();
    setSelectedOption(newOptions[0]);
  }, [eventType]);

  const handleConfirm = () => {
    onSubmit(selectedOption.issueType, selectedOption.title);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              {/* Sheet Header */}
              <View style={styles.header}>
                <View style={styles.headerTextCol}>
                  <Text style={styles.title}>Report an Issue / Adjust Trip</Text>
                  <Text style={styles.subtitle}>
                    Target item: <Text style={styles.targetTitle}>{targetItemTitle}</Text>
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {/* Dynamic Options List */}
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>SELECT SITUATION / DECISION:</Text>

                {options.map((option) => {
                  const isSelected = selectedOption?.id === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.scenarioCard,
                        isSelected && styles.selectedScenarioCard,
                      ]}
                      onPress={() => setSelectedOption(option)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.iconCircle, isSelected && styles.selectedIconCircle]}>
                        <MaterialIcons
                          name={(option.iconName as any) || 'error-outline'}
                          size={22}
                          color={isSelected ? colors.primary : colors.onSurfaceVariant}
                        />
                      </View>

                      <View style={styles.scenarioInfo}>
                        <Text style={[styles.scenarioTitle, isSelected && styles.selectedScenarioTitle]}>
                          {option.title}
                        </Text>
                        <Text style={styles.scenarioDesc}>{option.description}</Text>
                      </View>

                      <View style={[styles.radio, isSelected && styles.selectedRadio]}>
                        {isSelected && <View style={styles.innerDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Footer CTA */}
              <View style={styles.footer}>
                <CustomButton
                  title="Recalculate with Wayvo AI"
                  variant="primary"
                  iconName="auto-awesome"
                  size="lg"
                  onPress={handleConfirm}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 28, 58, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.pageMargin,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
    maxHeight: '82%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.card,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 18,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    marginTop: 2,
  },
  targetTitle: {
    color: colors.primary,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  scrollList: {
    marginBottom: spacing.md,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  selectedScenarioCard: {
    borderColor: colors.primary,
    backgroundColor: '#f6f9fc',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconCircle: {
    backgroundColor: colors.primaryFixed,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontSize: 14,
  },
  selectedScenarioTitle: {
    color: colors.primary,
    fontWeight: '700',
  },
  scenarioDesc: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: colors.primary,
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingTop: spacing.xs,
  },
});
