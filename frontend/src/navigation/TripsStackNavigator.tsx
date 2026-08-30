/**
 * TripsStackNavigator - Stack navigation for Trips, Timeline & Reservation flow
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TripsScreen } from '../screens/TripsScreen';
import { DetailedTimelineScreen } from '../screens/DetailedTimelineScreen';
import { TransportDetailsScreen } from '../screens/TransportDetailsScreen';
import { ReservationConfirmationScreen } from '../screens/ReservationConfirmationScreen';
import { ReservationSuccessScreen } from '../screens/ReservationSuccessScreen';

export type TripsStackParamList = {
  TripsList: undefined;
  DetailedTimeline: undefined;
  TransportDetails: { itemId: string };
  ReservationConfirmation: { itemId?: string } | undefined;
  ReservationSuccess: { itemId?: string } | undefined;
};

const Stack = createNativeStackNavigator<TripsStackParamList>();

export const TripsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="TripsList"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="TripsList" component={TripsScreen} />
      <Stack.Screen name="DetailedTimeline" component={DetailedTimelineScreen} />
      <Stack.Screen name="TransportDetails" component={TransportDetailsScreen} />
      <Stack.Screen name="ReservationConfirmation" component={ReservationConfirmationScreen} />
      <Stack.Screen name="ReservationSuccess" component={ReservationSuccessScreen} />
    </Stack.Navigator>
  );
};
