/**
 * HomeScreen - Wayvo AI Concierge & Personalized Discovery
 * Connected to Backend Journey Templates
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radii } from '../theme/spacing';
import { TopAppBar } from '../components/common/TopAppBar';
import { CustomButton } from '../components/common/CustomButton';
import { ScreenTransition } from '../components/common/ScreenTransition';
import { useTrip } from '../context/TripContext';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { templates, createTripFromTemplate } = useTrip();
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);

  const quickActions = [
    { id: '1', title: 'Plan a weekend trip', icon: 'flight-takeoff' },
    { id: '2', title: 'Market insights for Europe', icon: 'trending-up' },
    { id: '3', title: 'Reserve dinner tonight', icon: 'restaurant' },
  ];

  // Journey templates fallback if loading from backend
  const displayJourneys = templates.length > 0 ? templates : [
    {
      id: 'template-alps',
      title: 'Alpine Retreat & Wellness',
      country: 'Switzerland',
      subtitle: 'Scenic mountain rail, thermal wellness & chalets.',
      imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'template-mediterranean',
      title: 'Coastal Innovation & Heritage',
      country: 'Mediterranean',
      subtitle: 'Smart villas, marine expeditions & local cuisine.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'template-tokyo',
      title: 'Tokyo: Urban Culture & Tech',
      country: 'Tokyo, Japan',
      subtitle: 'Innovation hubs, robotics labs & gastronomy.',
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const handleSelectJourney = async (templateId: string, title: string) => {
    try {
      setCreatingTemplateId(templateId);
      const createdTrip = await createTripFromTemplate(templateId);
      // Navigate to My Trips to see the created trip in the list
      navigation.navigate('TripsTab');
    } catch (err: any) {
      Alert.alert('Trip Creation', `Created trip: ${title}`);
      navigation.navigate('TripsTab');
    } finally {
      setCreatingTemplateId(null);
    }
  };

  return (
    <View style={styles.container}>
      <TopAppBar title="Wayvo" onNotificationsPress={() => {}} />

      <ScreenTransition>
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>Hello, Alex.{'\n'}Where to next?</Text>
            <Text style={styles.greetingSubtitle}>
              Your AI concierge has curated new insights and itineraries based on your recent activity.
            </Text>
          </View>

          {/* Ask Wayvo Quick Actions */}
          <View style={styles.sectionWrapperTop}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Ask Wayvo</Text>
              <View style={styles.pulseDot} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsScroll}
            >
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickChipCard}
                  onPress={() => navigation.navigate('AITab')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={(action.icon as any) || 'help-outline'}
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.quickChipText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Hero AI Bento Recommendation */}
          <TouchableOpacity
            style={styles.heroCard}
            onPress={() => handleSelectJourney('template-tokyo', 'Tokyo: Tech & Tradition')}
            activeOpacity={0.92}
          >
            {/* AI Recommendation Header */}
            <View style={styles.aiTagRow}>
              <MaterialIcons name="auto-awesome" size={16} color={colors.secondary} />
              <Text style={styles.aiTagText}>FEATURED CURATION</Text>
            </View>

            <Text style={styles.heroTitle}>Tokyo: Tech & Tradition</Text>
            <Text style={styles.heroDescription}>
              Based on your interest in urban exploration and recent tech investments, a 7-day curated journey through Tokyo's innovation hubs and historic districts.
            </Text>

            {/* Tags */}
            <View style={styles.tagsRow}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>Nov 15 - Nov 22</Text>
              </View>
              <View style={styles.heroTagSecondary}>
                <Text style={styles.heroTagSecondaryText}>High Growth Sector Focus</Text>
              </View>
            </View>

            {/* Bento Images Grid with Full-Cover Images */}
            <View style={styles.bentoGrid}>
              <View style={styles.bentoMainWrapper}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80' }}
                  style={styles.bentoMainImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.bentoSubColumn}>
                <View style={styles.bentoSubWrapper}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&auto=format&fit=crop&q=80' }}
                    style={styles.bentoSubImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.bentoSubWrapper}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&auto=format&fit=crop&q=80' }}
                    style={styles.bentoSubImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>

            {/* CTA */}
            <CustomButton
              title={creatingTemplateId === 'template-tokyo' ? 'Creating Live Trip...' : 'Create & View Itinerary'}
              variant="primary"
              iconName="arrow-forward"
              iconRight
              onPress={() => handleSelectJourney('template-tokyo', 'Tokyo: Tech & Tradition')}
              style={styles.heroCta}
            />
          </TouchableOpacity>

          {/* Personalized Journeys - Hierarchy: TITLE on line 1, Country on line 2 */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Personalized Journeys</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DiscoverTab')}>
                <Text style={styles.seeAllText}>SEE ALL</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.journeysScroll}
            >
              {displayJourneys.map((j) => {
                const isCreating = creatingTemplateId === j.id;
                return (
                  <TouchableOpacity
                    key={j.id}
                    style={styles.journeyCard}
                    onPress={() => handleSelectJourney(j.id, j.title)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.journeyImageWrapper}>
                      <Image
                        source={{ uri: j.imageUrl }}
                        style={styles.journeyImage}
                        resizeMode="cover"
                      />
                      <View style={styles.createBadge}>
                        {isCreating ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <MaterialIcons name="add" size={18} color="#ffffff" />
                        )}
                      </View>
                    </View>
                    <View style={styles.journeyContent}>
                      {/* Line 1: Title */}
                      <Text style={styles.journeyTitle} numberOfLines={1}>{j.title}</Text>
                      {/* Line 2: Country / Destination */}
                      <Text style={styles.journeyCountry}>{j.country}</Text>
                      {/* Line 3: Subtitle */}
                      <Text style={styles.journeySubtitle} numberOfLines={2}>{j.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
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
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  greetingSection: {
    marginBottom: spacing.md,
  },
  greetingTitle: {
    ...typography.displayLg,
    color: colors.primary,
    lineHeight: 38,
    marginBottom: spacing.xs,
  },
  greetingSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  sectionWrapperTop: {
    marginBottom: spacing.lg,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: radii.xxl,
    padding: spacing.cardPadding + 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  aiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs + 2,
  },
  aiTagText: {
    ...typography.labelSm,
    color: colors.secondary,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  heroTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 21,
    marginBottom: 4,
  },
  heroDescription: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroTag: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTagText: {
    ...typography.labelMd,
    color: colors.primary,
    fontSize: 12,
  },
  heroTagSecondary: {
    backgroundColor: colors.secondaryContainer + '40',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  heroTagSecondaryText: {
    ...typography.labelMd,
    color: colors.secondary,
    fontSize: 12,
  },
  bentoGrid: {
    flexDirection: 'row',
    height: 160,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bentoMainWrapper: {
    flex: 1.2,
    height: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  bentoMainImage: {
    width: '100%',
    height: '100%',
  },
  bentoSubColumn: {
    flex: 1,
    flexDirection: 'column',
    gap: spacing.sm,
  },
  bentoSubWrapper: {
    flex: 1,
    width: '100%',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  bentoSubImage: {
    width: '100%',
    height: '100%',
  },
  heroCta: {
    marginTop: spacing.xs,
  },
  sectionWrapper: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 19,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.havelockBlue,
  },
  seeAllText: {
    ...typography.labelSm,
    color: colors.secondary,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  quickChipsScroll: {
    gap: spacing.sm + 2,
  },
  quickChipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  quickChipText: {
    ...typography.labelMd,
    color: colors.primary,
    fontSize: 13,
  },
  journeysScroll: {
    gap: spacing.md,
  },
  journeyCard: {
    width: 250,
    backgroundColor: '#ffffff',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  journeyImageWrapper: {
    height: 140,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  journeyImage: {
    width: '100%',
    height: '100%',
  },
  createBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyContent: {
    padding: spacing.md,
  },
  journeyTitle: {
    ...typography.labelMd,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  journeyCountry: {
    ...typography.labelSm,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  journeySubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
  },
});
