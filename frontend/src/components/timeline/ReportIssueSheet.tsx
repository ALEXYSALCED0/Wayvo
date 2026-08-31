/**
 * ReportIssueSheet - 2-Step In-Modal Disruption & Alternative Selection Flow
 * Step 1: Select Issue / Situation
 * Step 2: Review & Choose Alternative inside the SAME modal
 * Closes cleanly on (X) without committing any changes until explicit confirmation.
 * Source of Truth: Stitch Visual Language (Rubik, Havelock Blue, Spacing)
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
import { AlternativeOption } from '../../types/issue';

export interface IssueOptionItem {
  id: string;
  issueType: string;
  title: string;
  description: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
}

interface ReportIssueSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirmAlternative: (
    issueType: string,
    reason: string,
    alternative: AlternativeOption
  ) => void;
  targetItemTitle?: string;
  eventType?: string;
}

export const ReportIssueSheet: React.FC<ReportIssueSheetProps> = ({
  visible,
  onClose,
  onConfirmAlternative,
  targetItemTitle = 'Train to France',
  eventType = 'TRANSPORT',
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIssue, setSelectedIssue] = useState<IssueOptionItem | null>(null);
  const [selectedAlt, setSelectedAlt] = useState<AlternativeOption | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const normalizedType = eventType.toUpperCase();

  // Reset local modal state whenever it opens/closes
  useEffect(() => {
    if (visible) {
      setStep(1);
      const defaultOptions = getOptionsForType();
      setSelectedIssue(defaultOptions[0] || null);
      setSelectedAlt(null);
      setSubmitting(false);
    }
  }, [visible, eventType]);

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

      case 'HOTEL':
        return [
          {
            id: 'opt-extend-hotel',
            issueType: 'USER_CHANGED_PLAN',
            title: 'Extend stay / add extra nights',
            description: 'Keep current room and adjust subsequent check-in dates.',
            iconName: 'hotel',
          },
          {
            id: 'opt-change-hotel',
            issueType: 'CANCELLED',
            title: 'Hotel reservation unavailable',
            description: 'Find matching 5-star boutique hotels in the district.',
            iconName: 'apartment',
          },
        ];

      default:
        return [
          {
            id: 'opt-generic-missed',
            issueType: 'MISSED',
            title: 'Could not attend / missed scheduled time',
            description: 'Find alternative times or replacement activities.',
            iconName: 'warning',
          },
          {
            id: 'opt-generic-plans',
            issueType: 'USER_CHANGED_PLAN',
            title: 'My plans have changed',
            description: 'Adjust schedule to fit new timing preferences.',
            iconName: 'schedule',
          },
        ];
    }
  };

  // Generate tailored alternatives preview based on event type & issue
  const getAlternatives = (): AlternativeOption[] => {
    const issueType = selectedIssue?.issueType || 'MISSED';

    if (normalizedType === 'TRANSPORT' || normalizedType === 'FLIGHT') {
      if (issueType === 'CANCELLED') {
        return [
          {
            id: 'alt-flight-replacement',
            type: 'flight',
            typeLabel: 'Express Air Shuttle',
            title: 'Air France Priority Direct Shuttle',
            provider: 'Air France Shuttle',
            departureTime: '16:20',
            arrivalTime: '18:00',
            duration: '1h 40m',
            price: 230.0,
            priceDiff: '+$61.50',
            description: 'Direct air connection with express luggage transfer.',
            isFastest: true,
            isEco: false,
          },
          {
            id: 'alt-train-detour',
            type: 'train',
            typeLabel: 'Detour High-Speed Rail',
            title: 'Trenitalia Executive + TGV Connection',
            provider: 'Trenitalia & SNCF',
            departureTime: '15:00',
            arrivalTime: '19:15',
            duration: '4h 15m',
            price: 195.0,
            priceDiff: '+$26.50',
            description: 'Guaranteed secondary high-speed route via Milan.',
            isFastest: false,
            isEco: true,
          },
        ];
      }

      // Default MISSED or USER_CHANGED_PLAN for Transport
      return [
        {
          id: 'alt-train-next',
          type: 'train',
          typeLabel: 'High-Speed Rail',
          title: 'Eurostar Next Express (Standard Premier)',
          provider: 'Eurostar Continental',
          departureTime: '15:30',
          arrivalTime: '18:45',
          duration: '3h 15m',
          price: 185.0,
          priceDiff: '+$16.50',
          description: 'Departs in 75 minutes from Platform 7. Seat guaranteed with lounge access.',
          isFastest: true,
          isEco: true,
        },
        {
          id: 'alt-bus',
          type: 'bus',
          typeLabel: 'Direct Coach',
          title: 'FlixBus Executive Direct',
          provider: 'FlixBus Central Europe',
          departureTime: '16:00',
          arrivalTime: '21:30',
          duration: '5h 30m',
          price: 72.0,
          priceDiff: '-$96.50',
          description: 'Comfort recline coach with high-speed Wi-Fi and power outlets.',
          isFastest: false,
          isEco: false,
        },
        {
          id: 'alt-morning-scenic',
          type: 'train',
          typeLabel: 'Scenic Nightjet',
          title: 'ÖBB Nightjet Alpine Sleeper',
          provider: 'ÖBB Nightjet',
          departureTime: '20:15',
          arrivalTime: '07:30',
          duration: '11h 15m',
          price: 210.0,
          priceDiff: '+$41.50',
          description: 'Overnight private couchette cabin crossing the Swiss Alps.',
          isFastest: false,
          isEco: true,
        },
      ];
    }

    if (normalizedType === 'MUSEUM' || normalizedType === 'TOUR') {
      return [
        {
          id: 'alt-museum-borghese',
          type: 'museum',
          typeLabel: 'VIP Cultural Pass',
          title: 'Galleria Borghese Masterpieces & Gardens',
          provider: 'Heritage Rome Tours',
          departureTime: '14:00',
          arrivalTime: '16:30',
          duration: '2h 30m',
          price: 65.0,
          priceDiff: '-$30.00',
          description: 'Direct entry to Bernini & Caravaggio collection with garden stroll.',
          isFastest: true,
          isEco: true,
        },
        {
          id: 'alt-tour-catacombs',
          type: 'tour',
          typeLabel: 'Guided Expedition',
          title: 'Appian Way & Roman Catacombs Tour',
          provider: 'Underground Rome VIP',
          departureTime: '15:00',
          arrivalTime: '18:00',
          duration: '3h 00m',
          price: 75.0,
          priceDiff: '-$20.00',
          description: 'Historical underground exploration with air-conditioned transport.',
          isFastest: false,
          isEco: false,
        },
      ];
    }

    if (normalizedType === 'MEAL') {
      return [
        {
          id: 'alt-meal-cinq',
          type: 'meal',
          typeLabel: '3-Star Gastronomy',
          title: 'Le Cinq at Four Seasons Hotel George V',
          provider: 'Four Seasons Dining',
          departureTime: '20:45',
          arrivalTime: '23:00',
          duration: '2h 15m',
          price: 240.0,
          priceDiff: '+$30.00',
          description: 'Reserved table by Chef Christian Le Squer.',
          isFastest: true,
          isEco: true,
        },
        {
          id: 'alt-meal-septime',
          type: 'meal',
          typeLabel: 'Modern French',
          title: 'Septime Paris (Seasonal Tasting Menu)',
          provider: 'Septime Charonne',
          departureTime: '21:15',
          arrivalTime: '23:30',
          duration: '2h 15m',
          price: 135.0,
          priceDiff: '-$75.00',
          description: 'Eco-conscious Michelin-starred dining in the 11th arrondissement.',
          isFastest: false,
          isEco: true,
        },
      ];
    }

    // Default fallback alternatives
    return [
      {
        id: 'alt-generic-1',
        type: 'activity',
        typeLabel: 'Recommended Choice',
        title: 'Priority Rescheduled Connection',
        provider: 'Wayvo Smart Concierge',
        departureTime: '16:00',
        arrivalTime: '18:30',
        duration: '2h 30m',
        price: 120.0,
        priceDiff: 'Included',
        description: 'Optimized replacement aligned with your remaining schedule.',
        isFastest: true,
        isEco: true,
      },
    ];
  };

  const currentOptions = getOptionsForType();
  const availableAlternatives = getAlternatives();

  // Set default selected alternative when entering Step 2
  const handleProceedToStep2 = () => {
    if (!selectedIssue) return;
    setSelectedAlt(availableAlternatives[0]);
    setStep(2);
  };

  const handleConfirmReplacement = () => {
    if (!selectedIssue || !selectedAlt) return;
    setSubmitting(true);
    onConfirmAlternative(selectedIssue.issueType, selectedIssue.title, selectedAlt);
  };

  const handleCancelAndClose = () => {
    // Pure local cancel: No changes committed
    setStep(1);
    setSelectedAlt(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancelAndClose}
    >
      <TouchableWithoutFeedback onPress={handleCancelAndClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandleWrapper}>
                <View style={styles.dragHandle} />
              </View>

              {/* Header with Title and Cancel (X) */}
              <View style={styles.header}>
                <View style={styles.headerTitleColumn}>
                  <View style={styles.badgeRow}>
                    <View style={styles.aiTagBadge}>
                      <MaterialIcons name="auto-awesome" size={13} color={colors.secondary} />
                      <Text style={styles.aiTagText}>
                        {step === 1 ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
                      </Text>
                    </View>
                    <Text style={styles.targetTitleText} numberOfLines={1}>
                      {targetItemTitle}
                    </Text>
                  </View>

                  <Text style={styles.sheetTitle}>
                    {step === 1 ? 'Report an Issue' : 'Choose an Alternative'}
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    {step === 1
                      ? 'What happened with this connection?'
                      : `Wayvo curated ${availableAlternatives.length} replacements for you.`}
                  </Text>
                </View>

                {/* Close Button (X) - Cancels with 0 changes */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCancelAndClose}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="close" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* STEP 1: SELECT ISSUE */}
              {step === 1 && (
                <View style={styles.stepContent}>
                  <ScrollView
                    style={styles.optionsScroll}
                    contentContainerStyle={styles.optionsScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {currentOptions.map((opt) => {
                      const isSelected = selectedIssue?.id === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.optionCard, isSelected && styles.selectedOptionCard]}
                          onPress={() => setSelectedIssue(opt)}
                          activeOpacity={0.85}
                        >
                          <View style={[styles.iconBox, isSelected && styles.selectedIconBox]}>
                            <MaterialIcons
                              name={opt.iconName}
                              size={22}
                              color={isSelected ? '#ffffff' : colors.primary}
                            />
                          </View>

                          <View style={styles.optionContent}>
                            <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
                              {opt.title}
                            </Text>
                            <Text style={styles.optionDescription}>{opt.description}</Text>
                          </View>

                          <View style={[styles.radioCircle, isSelected && styles.selectedRadioCircle]}>
                            {isSelected && <View style={styles.radioInnerDot} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Actions for Step 1 */}
                  <View style={styles.stepActions}>
                    <CustomButton
                      title="Review Available Alternatives"
                      variant="havelock"
                      iconName="arrow-forward"
                      iconRight
                      size="lg"
                      disabled={!selectedIssue}
                      onPress={handleProceedToStep2}
                    />
                  </View>
                </View>
              )}

              {/* STEP 2: REVIEW & CHOOSE ALTERNATIVE */}
              {step === 2 && (
                <View style={styles.stepContent}>
                  <ScrollView
                    style={styles.alternativesScroll}
                    contentContainerStyle={styles.alternativesScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {availableAlternatives.map((alt) => {
                      const isSelected = selectedAlt?.id === alt.id;
                      return (
                        <TouchableOpacity
                          key={alt.id}
                          style={[styles.altCard, isSelected && styles.selectedAltCard]}
                          onPress={() => setSelectedAlt(alt)}
                          activeOpacity={0.88}
                        >
                          {/* Top Badges */}
                          <View style={styles.altHeaderRow}>
                            <View style={styles.altBadgeRow}>
                              {alt.isFastest && (
                                <View style={styles.fastestBadge}>
                                  <MaterialIcons name="bolt" size={12} color="#ffffff" />
                                  <Text style={styles.fastestBadgeText}>FASTEST</Text>
                                </View>
                              )}
                              {alt.isEco && (
                                <View style={styles.ecoBadge}>
                                  <MaterialIcons name="eco" size={12} color="#2e7d32" />
                                  <Text style={styles.ecoBadgeText}>ECO CHOICE</Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.priceColumn}>
                              <Text style={styles.altPrice}>
                                ${typeof alt.price === 'number' ? alt.price.toFixed(2) : alt.price || '185.00'}
                              </Text>
                              <Text style={styles.altPriceDiff}>{alt.priceDiff}</Text>
                            </View>
                          </View>

                          {/* Title & Provider */}
                          <Text style={styles.altTitle}>{alt.title}</Text>
                          <Text style={styles.altProvider}>{alt.provider}</Text>

                          {/* Schedule Times */}
                          <View style={styles.altScheduleRow}>
                            <View style={styles.scheduleItem}>
                              <MaterialIcons name="schedule" size={14} color={colors.onSurfaceVariant} />
                              <Text style={styles.scheduleText}>
                                {alt.departureTime} - {alt.arrivalTime} ({alt.duration})
                              </Text>
                            </View>
                          </View>

                          {/* Description */}
                          <Text style={styles.altDesc}>{alt.description}</Text>

                          {/* Radio Selector State */}
                          <View style={styles.altFooterRow}>
                            <View style={[styles.selectPill, isSelected && styles.selectPillActive]}>
                              <MaterialIcons
                                name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                                size={16}
                                color={isSelected ? '#ffffff' : colors.onSurfaceVariant}
                              />
                              <Text style={[styles.selectPillText, isSelected && styles.selectPillTextActive]}>
                                {isSelected ? 'Selected Replacement' : 'Select This Route'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Actions for Step 2 */}
                  <View style={styles.step2ActionsRow}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setStep(1)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="arrow-back" size={18} color={colors.primary} />
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>

                    <CustomButton
                      title="Confirm Replacement"
                      variant="havelock"
                      iconName="check"
                      size="md"
                      loading={submitting}
                      disabled={!selectedAlt || submitting}
                      onPress={handleConfirmReplacement}
                      style={styles.confirmBtn}
                    />
                  </View>
                </View>
              )}
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
    backgroundColor: 'rgba(0, 28, 58, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    paddingHorizontal: spacing.pageMargin,
    maxHeight: '88%',
    ...shadows.card,
  },
  dragHandleWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.outlineVariant,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  headerTitleColumn: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  aiTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 4,
  },
  aiTagText: {
    ...typography.labelSm,
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  targetTitleText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    flex: 1,
  },
  sheetTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 20,
    marginTop: 2,
  },
  sheetSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    paddingBottom: spacing.sm,
  },
  optionsScroll: {
    maxHeight: 340,
  },
  optionsScrollContent: {
    gap: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.cardPadding - 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  selectedOptionCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLow,
    ...shadows.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconBox: {
    backgroundColor: colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  selectedOptionTitle: {
    color: colors.primary,
  },
  optionDescription: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioCircle: {
    borderColor: colors.primary,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  stepActions: {
    marginTop: spacing.md,
  },
  alternativesScroll: {
    maxHeight: 360,
  },
  alternativesScrollContent: {
    gap: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
  altCard: {
    backgroundColor: '#ffffff',
    borderRadius: radii.xl,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selectedAltCard: {
    borderColor: colors.primary,
    backgroundColor: '#f8fafc',
    ...shadows.sm,
  },
  altHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  altBadgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  fastestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 2,
  },
  fastestBadgeText: {
    ...typography.labelSm,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  ecoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 2,
  },
  ecoBadgeText: {
    ...typography.labelSm,
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 9,
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  altPrice: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 17,
  },
  altPriceDiff: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  altTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 15,
    marginBottom: 2,
  },
  altProvider: {
    ...typography.labelSm,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs + 2,
  },
  altScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  altDesc: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  altFooterRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs + 2,
  },
  selectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  selectPillActive: {
    backgroundColor: colors.primary,
  },
  selectPillText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  selectPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  step2ActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radii.xl,
    gap: 4,
  },
  backButtonText: {
    ...typography.labelMd,
    color: colors.primary,
    fontSize: 13,
  },
  confirmBtn: {
    flex: 1,
  },
});
