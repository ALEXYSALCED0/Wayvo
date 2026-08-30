import { Trip, TimelineItem } from '../types/trip';
import { IssueScenario, AlternativeOption } from '../types/issue';
import { ReservationDetails } from '../types/reservation';
import { DiscoverCategory, RecommendedDestination, TrendingExperience, FutureConnectionCardData } from '../types/discover';
import { ChatMessage } from '../types/ai';
import { UserProfile } from '../types/user';

export const initialTimeline: TimelineItem[] = [
  {
    id: 'node-start',
    tripId: 'trip-euro-1',
    title: 'Departure from Home',
    description: 'Initial transfer to the central transport hub.',
    time: '08:00 AM',
    type: 'start',
    typeLabel: 'START',
    status: 'completed',
    statusLabel: 'Completed',
    location: 'Home Residence',
  },
  {
    id: 'node-museum',
    tripId: 'trip-euro-1',
    title: 'Museum Tour',
    description: 'Guided tour of the national gallery focusing on renaissance art.',
    time: '10:30 AM',
    type: 'activity',
    typeLabel: 'ACTIVITY',
    status: 'completed',
    statusLabel: 'Completed',
    location: 'National Gallery of Art',
  },
  {
    id: 'node-train',
    tripId: 'trip-euro-1',
    title: 'Train to France',
    description: 'High-speed Eurostar train connection from London St Pancras to Paris Gare du Nord.',
    time: '14:00 PM',
    type: 'transit',
    typeLabel: 'TRANSIT',
    status: 'pending',
    statusLabel: 'Pending',
    location: 'London St Pancras • Platform 9B',
    isExpandable: true,
    ticket: {
      platform: '9B',
      seat: 'Car 4, 12A',
      car: '4',
      bookingRef: 'WAY-TRN-9241',
      qrAvailable: true,
      price: 145,
      classType: 'Standard Premier',
      provider: 'Eurostar #9241',
    },
  },
  {
    id: 'node-hotel',
    tripId: 'trip-euro-1',
    title: 'Check-in Hotel Le Meurice',
    description: 'Luxury accommodation check-in with executive suite overlooking Tuileries Garden.',
    time: '18:00 PM',
    type: 'accommodation',
    typeLabel: 'ACCOMMODATION',
    status: 'pending',
    statusLabel: 'Upcoming',
    location: '228 Rue de Rivoli, Paris',
  },
  {
    id: 'node-dinner',
    tripId: 'trip-euro-1',
    title: 'Dinner at Le Gabriel',
    description: 'Two-star Michelin tasting menu and wine pairing.',
    time: '20:30 PM',
    type: 'dining',
    typeLabel: 'DINING',
    status: 'pending',
    statusLabel: 'Upcoming',
    location: 'Avenue Gabriel, Paris',
  },
];

export const mockTrips: Trip[] = [
  {
    id: 'trip-euro-1',
    title: 'European Adventure',
    destination: 'London • Paris • Rome',
    dates: 'Oct 12 - Oct 20, 2024',
    status: 'active',
    statusLabel: 'In Progress',
    progressDays: 'Day 4 of 8',
    progressPercent: 50,
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    description: 'Curated multi-city European journey combining cultural immersion, high-speed rail transit, and culinary landmarks.',
    timeline: initialTimeline,
  },
  {
    id: 'trip-swiss-2',
    title: 'Swiss Alps Retreat',
    destination: 'Zermatt • St. Moritz',
    dates: 'Dec 05 - Dec 12, 2024',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    progressDays: 'Day 1 of 7',
    progressPercent: 0,
    imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80',
    description: 'Alpine wellness and winter sports retreat with panoramic scenic rail views.',
    timeline: [],
  },
  {
    id: 'trip-tokyo-3',
    title: 'Tokyo: Tech & Tradition',
    destination: 'Tokyo • Kyoto',
    dates: 'Jan 15 - Jan 24, 2025',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    progressDays: 'Day 1 of 10',
    progressPercent: 0,
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    description: 'Curated journey through Tokyo innovation hubs and historic Kyoto heritage districts.',
    timeline: [],
  },
];

export const mockIssueScenarios: IssueScenario[] = [
  {
    id: 'missed_train',
    title: 'I missed my train',
    description: 'Scheduled departure has passed or connection was lost.',
    iconName: 'train',
  },
  {
    id: 'stay_longer_rome',
    title: 'I want to stay in Rome one more day',
    description: 'Extend current stay and reorganize subsequent destinations.',
    iconName: 'schedule',
  },
  {
    id: 'museum_closed',
    title: 'That museum is closed / Activity cancelled',
    description: 'Find top-rated nearby cultural and culinary alternatives.',
    iconName: 'event-busy',
  },
  {
    id: 'preference_change',
    title: 'Change travel preferences',
    description: 'Recalculate route for relaxing / scenic pace instead of fastest transit.',
    iconName: 'tune',
  },
];

export const mockAlternativesMap: Record<string, AlternativeOption[]> = {
  missed_train: [
    {
      id: 'alt-train-next',
      type: 'transit',
      title: 'Next available train',
      subtitle: 'Direct high-speed Eurostar',
      iconName: 'train',
      isFastest: true,
      isRecommended: true,
      departureTime: '15:30',
      arrivalTime: '18:45',
      duration: '2h 15m',
      price: '$160.00',
      priceDiff: '+$15.00 diff',
      description: 'Eurostar #9245 departing from London St Pancras with confirmed seat assignment.',
      newItemsToInject: [
        {
          title: 'Next Train to France (Eurostar #9245)',
          description: 'Confirmed replacement high-speed rail transit.',
          time: '15:30 PM',
          type: 'transit',
          typeLabel: 'REPLACEMENT TRANSIT',
        },
      ],
    },
    {
      id: 'alt-bus-scenic',
      type: 'transit',
      title: 'Bus to France',
      subtitle: 'Scenic route, 1 transfer',
      iconName: 'directions-bus',
      departureTime: '16:15',
      arrivalTime: '21:00',
      duration: '4h 45m',
      price: '$55.00',
      priceDiff: '-$90.00 refund',
      description: 'FlixBus Premium route with comfortable reclining seats and Wi-Fi.',
      newItemsToInject: [
        {
          title: 'Express Bus to France',
          description: 'Comfortable coach transit across the channel.',
          time: '16:15 PM',
          type: 'transit',
          typeLabel: 'BUS TRANSIT',
        },
      ],
    },
  ],
  stay_longer_rome: [
    {
      id: 'alt-rome-extended',
      type: 'combined',
      title: 'Extend Rome Stay + New Curated Activities',
      subtitle: '24-hour itinerary extension',
      iconName: 'hotel',
      isRecommended: true,
      duration: '+1 Day',
      price: '$210.00',
      description: 'Extends luxury boutique hotel in Rome, reschedules Paris transit for tomorrow, and unlocks VIP Colosseum evening tour.',
      additionalActivities: [
        'Colosseum Under the Stars VIP Tour (07:00 PM)',
        'Trastevere Historic Food & Wine Walk (09:00 PM)',
        'Rescheduled Eurostar Departure: Tomorrow 11:00 AM',
      ],
      newItemsToInject: [
        {
          title: 'Colosseum Night Tour (VIP Access)',
          description: 'Exclusive after-hours guided tour of the underground chambers.',
          time: '19:00 PM',
          type: 'activity',
          typeLabel: 'NEW ACTIVITY',
        },
        {
          title: 'Trastevere Food & Wine Walk',
          description: 'Private sommelier-led local culinary journey.',
          time: '21:00 PM',
          type: 'dining',
          typeLabel: 'CURATED DINING',
        },
      ],
    },
    {
      id: 'alt-rome-wellness',
      type: 'activity',
      title: 'Rome Art & Thermal Spa Day',
      subtitle: 'Relaxation & Cultural focus',
      iconName: 'spa',
      duration: '+1 Day',
      price: '$180.00',
      description: 'Adds private Borghese Gallery booking followed by luxury thermal baths in historic center.',
      newItemsToInject: [
        {
          title: 'Galleria Borghese Masterpieces',
          description: 'Private morning viewing of Caravaggio and Bernini collections.',
          time: '11:00 AM',
          type: 'activity',
          typeLabel: 'NEW ACTIVITY',
        },
      ],
    },
  ],
  museum_closed: [
    {
      id: 'alt-museum-food',
      type: 'activity',
      title: 'Contemporary Art & Wine Experience',
      subtitle: 'Nearby landmark (5 min walk)',
      iconName: 'palette',
      isRecommended: true,
      departureTime: '11:00 AM',
      duration: '2h',
      price: '$45.00',
      description: 'Priority entrance to the Modern Art Pavilion followed by an artisan cellar tasting.',
      newItemsToInject: [
        {
          title: 'Modern Art Pavilion & Cellar Tasting',
          description: 'Curated cultural alternative with local sommelier tasting.',
          time: '11:00 AM',
          type: 'activity',
          typeLabel: 'REPLACEMENT ACTIVITY',
        },
      ],
    },
  ],
  preference_change: [
    {
      id: 'alt-scenic-train',
      type: 'transit',
      title: 'Scenic Panorama Train via Alps',
      subtitle: 'Leisurely scenic journey',
      iconName: 'landscape',
      departureTime: '14:45',
      arrivalTime: '19:30',
      duration: '4h 45m',
      price: '$135.00',
      description: 'Travel through breathtaking mountain vistas with glass-dome observation cars.',
      newItemsToInject: [
        {
          title: 'Glacier & Valley Panorama Rail',
          description: 'Scenic journey through Alpine passes with gourmet dining on board.',
          time: '14:45 PM',
          type: 'transit',
          typeLabel: 'SCENIC TRANSIT',
        },
      ],
    },
  ],
};

export const mockReservationDetails: ReservationDetails = {
  id: 'res-trn-9241',
  itemId: 'node-train',
  title: 'Train to France',
  provider: 'Eurostar #9241',
  transportNumber: 'Train #9241',
  origin: 'London St Pancras',
  destination: 'Paris Gare du Nord',
  departureTime: '14:00',
  arrivalTime: '16:30',
  passengers: [
    { id: 'p1', name: 'Alex Salcedo', type: 'Adult', isLead: true },
    { id: 'p2', name: 'Jane Salcedo', type: 'Adult' },
  ],
  classType: 'Standard Premier',
  seats: ['Car 4, 12A', 'Car 4, 12B'],
  baseFare: 120.00,
  taxesAndFees: 15.00,
  seatSelectionFee: 10.00,
  totalPrice: 145.00,
  status: 'PENDING',
  bookingReference: 'WAY-9241-EUR',
  imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80',
};

export const mockDiscoverCategories: DiscoverCategory[] = [
  { id: 'cat-beaches', name: 'Beaches', iconName: 'beach-access' },
  { id: 'cat-mountains', name: 'Mountains', iconName: 'landscape' },
  { id: 'cat-city', name: 'City Breaks', iconName: 'location-city' },
  { id: 'cat-nature', name: 'Nature', iconName: 'park' },
  { id: 'cat-culinary', name: 'Culinary', iconName: 'restaurant' },
];

export const mockRecommendedDestinations: RecommendedDestination[] = [
  {
    id: 'rec-santorini',
    title: 'Santorini, Greece',
    location: 'Cyclades, Greece',
    matchScore: 98,
    description: 'Experience breathtaking sunsets and iconic white architecture overlooking the deep blue Aegean Sea.',
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80',
    isLarge: true,
  },
  {
    id: 'rec-kyoto',
    title: 'Kyoto, Japan',
    location: 'Kansai, Japan',
    matchScore: 94,
    description: 'Historic wooden machiya, tranquil zen gardens, and cherry blossom pathways.',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-swiss',
    title: 'Swiss Alps',
    location: 'Valais, Switzerland',
    matchScore: 92,
    description: 'Pristine mountain valleys, eco-luxury chalets, and world-class alpine railways.',
    imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80',
  },
];

export const mockTrendingExperiences: TrendingExperience[] = [
  {
    id: 'exp-wine',
    title: 'Wine Tasting & Chateau Tour',
    location: 'Bordeaux, France',
    rating: 4.9,
    category: 'Culinary',
    price: '$85 / person',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'exp-dive',
    title: 'Coral Reef Scuba Expedition',
    location: 'Great Barrier Reef, Australia',
    rating: 4.8,
    category: 'Adventure',
    price: '$140 / person',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'exp-balloon',
    title: 'Sunrise Hot Air Balloon Flight',
    location: 'Cappadocia, Turkey',
    rating: 5.0,
    category: 'Sightseeing',
    price: '$195 / person',
    imageUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80',
  },
];

export const mockFutureConnectionsData: FutureConnectionCardData = {
  title: 'Meet people who share your journey',
  subtitle: 'Wayvo Connections Network',
  tag: 'Coming Soon',
  description: 'Connect with fellow verified travelers, local insider guides, and industry professionals at your upcoming destinations.',
  memberCount: '12.4k+ travelers joining',
  iconName: 'group',
};

export const mockInitialAIMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: "Hello Alex! I've analyzed your upcoming European itinerary. Your current connection to France is on track, but if anything changes or you'd like to adjust your plans, let me know anytime.",
    timestamp: '10:14 AM',
    quickChips: [
      { id: 'chip-1', label: 'Plan a weekend trip', iconName: 'flight-takeoff' },
      { id: 'chip-2', label: 'Market insights for Europe', iconName: 'trending-up' },
      { id: 'chip-3', label: 'Reserve dinner tonight', iconName: 'restaurant' },
    ],
  },
];

export const mockUserProfile: UserProfile = {
  id: 'usr-alex-1',
  name: 'Alex Salcedo',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  statusTier: 'Elite Traveler',
  email: 'alex.salcedo@wayvo.travel',
  tripsCount: 8,
  savedPlacesCount: 14,
};
