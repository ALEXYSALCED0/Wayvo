/**
 * BottomTabNavigator - 5-Item Mobile Navigation with Smooth Sliding Bubble Indicator
 * Source of Truth: Stitch Bottom Navigation (Home, Trips, Wayvo AI, Discover, Profile)
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { TripsStackNavigator } from './TripsStackNavigator';
import { WayvoAIScreen } from '../screens/WayvoAIScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

export type BottomTabParamList = {
  HomeTab: undefined;
  TripsTab: undefined;
  AITab: undefined;
  DiscoverTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const tabRoutes: Array<{ name: keyof BottomTabParamList; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
  { name: 'HomeTab', label: 'Home', icon: 'home' },
  { name: 'TripsTab', label: 'Trips', icon: 'travel-explore' },
  { name: 'AITab', label: 'Wayvo AI', icon: 'auto-awesome' },
  { name: 'DiscoverTab', label: 'Discover', icon: 'search' },
  { name: 'ProfileTab', label: 'Profile', icon: 'person' },
];

const SlidingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;

  const tabWidth = tabBarWidth > 0 ? tabBarWidth / tabRoutes.length : 0;

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: state.index * tabWidth,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bubbleScale, {
            toValue: 0.94,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScale, {
            toValue: 1,
            tension: 90,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [state.index, tabWidth]);

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== tabBarWidth) {
      setTabBarWidth(width);
      translateX.setValue(state.index * (width / tabRoutes.length));
    }
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.tabBarInner} onLayout={onLayout}>
        {/* Sliding Active Bubble Indicator */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.slidingBubble,
              {
                width: tabWidth - 10,
                transform: [
                  { translateX },
                  { scale: bubbleScale },
                ],
              },
            ]}
          />
        )}

        {/* Tab Buttons */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = tabRoutes[index] || { label: route.name, icon: 'help-outline' };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabButton}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={config.icon}
                size={22}
                color={isFocused ? colors.onSecondaryContainer : colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.onSecondaryContainer : colors.onSurfaceVariant },
                  isFocused && styles.activeTabLabel,
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      tabBar={(props) => <SlidingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="TripsTab" component={TripsStackNavigator} />
      <Tab.Screen name="AITab" component={WayvoAIScreen} />
      <Tab.Screen name="DiscoverTab" component={DiscoverScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#001c3a',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        position: 'fixed',
        bottom: 0,
        zIndex: 100,
      } as any,
    }),
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 52,
    marginHorizontal: spacing.xs,
  },
  slidingBubble: {
    position: 'absolute',
    left: 5,
    top: 2,
    bottom: 2,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radii.full,
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  tabLabel: {
    ...typography.labelSm,
    fontSize: 10,
    marginTop: 2,
  },
  activeTabLabel: {
    fontWeight: '700',
  },
});
