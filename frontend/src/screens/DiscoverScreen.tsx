/**
 * DiscoverScreen - Personalized Exploration, Trending Experiences & Future Connections
 * Source of Truth: Stitch Discover Screen (Rubik)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radii } from '../theme/spacing';
import { TopAppBar } from '../components/common/TopAppBar';
import { ConnectionsCard } from '../components/discover/ConnectionsCard';
import { ScreenTransition } from '../components/common/ScreenTransition';
import {
  mockDiscoverCategories,
  mockRecommendedDestinations,
  mockTrendingExperiences,
} from '../data/mockData';

export const DiscoverScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-beaches');

  const categories = mockDiscoverCategories;
  const recommended = mockRecommendedDestinations;
  const trending = mockTrendingExperiences;

  return (
    <View style={styles.container}>
      <TopAppBar title="Wayvo" />

      <ScreenTransition>
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section with AI Search */}
          <View style={styles.heroBanner}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
              }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <View style={styles.heroBannerOverlay} />

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Explore the World with AI</Text>

              {/* Glass Search Bar */}
              <View style={styles.searchBarWrapper}>
                <MaterialIcons name="search" size={22} color={colors.primary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Where do you want to go?"
                  placeholderTextColor={colors.outline}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.searchButton} activeOpacity={0.85}>
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Categories Scroll */}
          <View style={styles.categoriesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryPill,
                      isSelected && styles.selectedCategoryPill,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={(cat.iconName as any) || 'place'}
                      size={16}
                      color={isSelected ? '#ffffff' : colors.primary}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.selectedCategoryText,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Recommended for you Bento Grid */}
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>Recommended for you</Text>

            {/* Large Destination Card (Santorini) */}
            <TouchableOpacity style={styles.largeDestinationCard} activeOpacity={0.92}>
              <Image
                source={{ uri: recommended[0].imageUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              <View style={styles.destinationGradient} />

              <View style={styles.destinationContent}>
                <View style={styles.matchScoreBadge}>
                  <Text style={styles.matchScoreText}>{recommended[0].matchScore}% Match</Text>
                </View>
                <Text style={styles.destinationTitle}>{recommended[0].title}</Text>
                <Text style={styles.destinationDesc} numberOfLines={2}>
                  {recommended[0].description}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 2 Smaller Cards Grid */}
            <View style={styles.smallCardsGrid}>
              {recommended.slice(1).map((dest) => (
                <TouchableOpacity
                  key={dest.id}
                  style={styles.smallDestinationCard}
                  activeOpacity={0.88}
                >
                  <Image
                    source={{ uri: dest.imageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  <View style={styles.destinationGradient} />

                  <View style={styles.smallDestinationContent}>
                    <Text style={styles.smallDestinationTitle}>{dest.title}</Text>
                    <Text style={styles.smallDestinationScore}>{dest.matchScore}% AI Match</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* FUTURE CONNECTIONS PREVIEW CARD (Section 12) */}
          <ConnectionsCard onPress={() => {}} />

          {/* Trending Experiences */}
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>Trending Experiences</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingScroll}
            >
              {trending.map((exp) => (
                <TouchableOpacity
                  key={exp.id}
                  style={styles.experienceCard}
                  activeOpacity={0.88}
                >
                  <Image
                    source={{ uri: exp.imageUrl }}
                    style={styles.expImage}
                    resizeMode="cover"
                  />
                  <View style={styles.expContent}>
                    <View style={styles.expHeader}>
                      <Text style={styles.expTitle} numberOfLines={1}>
                        {exp.title}
                      </Text>
                      <View style={styles.ratingRow}>
                        <MaterialIcons name="star" size={14} color={colors.statusWarning} />
                        <Text style={styles.ratingText}>{exp.rating}</Text>
                      </View>
                    </View>

                    <Text style={styles.expLocation}>{exp.location}</Text>
                    {exp.price && <Text style={styles.expPrice}>{exp.price}</Text>}

                    <TouchableOpacity style={styles.viewExpBtn} activeOpacity={0.8}>
                      <Text style={styles.viewExpBtnText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
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
  heroBanner: {
    height: 205,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 50, 85, 0.44)',
  },
  heroContent: {
    padding: spacing.md,
    alignItems: 'center',
  },
  heroTitle: {
    ...typography.displaySm,
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radii.full,
    paddingLeft: spacing.sm + 4,
    paddingRight: 6,
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: colors.onSurface,
    paddingVertical: 0,
    paddingHorizontal: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  searchButton: {
    backgroundColor: colors.havelockBlue,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    ...typography.labelSm,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  categoriesScroll: {
    gap: spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.full,
    gap: 6,
  },
  selectedCategoryPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...typography.labelMd,
    color: colors.primary,
    fontSize: 12,
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
  sectionWrapper: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  largeDestinationCard: {
    height: 195,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  destinationGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 28, 58, 0.44)',
  },
  destinationContent: {
    padding: spacing.cardPadding,
  },
  matchScoreBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  matchScoreText: {
    ...typography.labelSm,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  destinationTitle: {
    ...typography.headlineMd,
    color: '#ffffff',
    fontSize: 18,
  },
  destinationDesc: {
    ...typography.bodySm,
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12,
    marginTop: 2,
  },
  smallCardsGrid: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
  },
  smallDestinationCard: {
    flex: 1,
    height: 125,
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallDestinationContent: {
    padding: spacing.sm + 2,
  },
  smallDestinationTitle: {
    ...typography.labelMd,
    color: '#ffffff',
    fontSize: 13,
  },
  smallDestinationScore: {
    ...typography.labelSm,
    color: colors.secondaryFixed,
    fontSize: 10,
  },
  trendingScroll: {
    gap: spacing.md,
  },
  experienceCard: {
    width: 230,
    backgroundColor: '#ffffff',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  expImage: {
    width: '100%',
    height: 120,
  },
  expContent: {
    padding: spacing.md,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  expTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontSize: 14,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
  },
  expLocation: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  expPrice: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  viewExpBtn: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  viewExpBtnText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
});
