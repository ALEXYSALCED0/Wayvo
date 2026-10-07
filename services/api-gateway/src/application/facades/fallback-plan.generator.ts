import {
  AIPlanRecommendationInput,
  AIPlanRecommendationResult,
  BookingItemType,
  BudgetCategory,
  CreateBookingItemInput,
  DayPlan,
  EventStatus,
  EventType,
  PacePreference,
  ReservationStatus,
  TravelStyle,
} from '@wayvo/contracts';

/**
 * Generates a contract-compliant AI recommendation plan when
 * ai-recommendation (LangGraph) is offline or under active development.
 * Emulates the 4 specialized LangGraph agents based on the user's input.
 */
export function generateFallbackPlan(input: AIPlanRecommendationInput): AIPlanRecommendationResult {
  const currency = input.currency || 'COP';
  const travelers = input.travelers || 1;
  const destination = input.destination;
  const origin = input.origin;

  // 1. Emulate personality_agent
  const style =
    input.preferredStyle ||
    (input.psychologicalAssessment.spontaneityScore >= 4
      ? TravelStyle.AVENTURA
      : input.psychologicalAssessment.comfortPriority >= 4
        ? TravelStyle.RELAX
        : TravelStyle.CULTURAL);

  const dominantPace =
    input.psychologicalAssessment.physicalActivityLevel === 'high'
      ? PacePreference.INTENSO
      : input.psychologicalAssessment.physicalActivityLevel === 'moderate'
        ? PacePreference.MODERADO
        : PacePreference.RELAJADO;

  // 2. Emulate budget_agent
  const baseMultiplier =
    input.budgetCategory === BudgetCategory.LUJO
      ? 2.5
      : input.budgetCategory === BudgetCategory.ECONOMICO
        ? 0.7
        : 1.0;

  const estimatedTotalCost = Math.round(
    (input.approximateBudgetAmount || 1800000) * baseMultiplier * travelers,
  );
  const dailyBudget = Math.round(estimatedTotalCost / 5);

  const budgetBreakdown = {
    transport: Math.round(estimatedTotalCost * 0.35),
    accommodation: Math.round(estimatedTotalCost * 0.35),
    activities: Math.round(estimatedTotalCost * 0.15),
    food: Math.round(estimatedTotalCost * 0.15),
    emergencyFund: Math.round(estimatedTotalCost * 0.05),
  };

  // 3. Emulate transport_agent
  const outboundFlightCost = Math.round(budgetBreakdown.transport * 0.55);
  const outboundSegment = {
    origin,
    destination,
    mode: 'flight' as const,
    departureTime: `${input.startDate}T08:00:00Z`,
    arrivalTime: `${input.startDate}T10:15:00Z`,
    estimatedDuration: '2h 15m',
    estimatedCost: outboundFlightCost,
    providerHint: 'Avianca / LATAM Airlines',
  };

  // 4. Emulate activities_food_agent
  const gastronomy = [
    {
      dish: `Plato típico insignia de ${destination}`,
      typicalPlace: `Mercado gastronómico local de ${destination}`,
      description: 'Gastronomía tradicional recomendada según tu perfil cultural.',
      mealType: 'lunch' as const,
      estimatedCost: 35000,
      dietaryMatch: true,
    },
    {
      dish: 'Cena gourmet con maridaje',
      typicalPlace: 'Restaurante con vista panorámica',
      description: 'Experiencia gastronómica seleccionada por alta valoración y ambiente relajado.',
      mealType: 'dinner' as const,
      estimatedCost: 75000,
      dietaryMatch: true,
    },
  ];

  const plannedActivities = [
    {
      title: `Tour histórico guiado por ${destination}`,
      category: 'Cultura e Historia',
      description: 'Recorrido patrimonial adaptado al ritmo de viaje seleccionado.',
      duration: '3h',
      estimatedCost: 50000,
      bestTimeOfDay: 'morning' as const,
      bookingRequired: true,
    },
    {
      title: 'Paseo panorámico y miradores',
      category: 'Naturaleza y Fotografía',
      description: 'Caminata escénica en los puntos más representativos de la ciudad.',
      duration: '2h 30m',
      estimatedCost: 25000,
      bestTimeOfDay: 'afternoon' as const,
      bookingRequired: false,
    },
  ];

  // 5. Build Days and Events for Itinerary
  const day1: DayPlan = {
    dayNumber: 1,
    date: input.startDate,
    title: `Llegada a ${destination} y bienvenida`,
    events: [
      {
        id: `evt-1-arrival`,
        tripId: 'draft-trip',
        type: EventType.FLIGHT,
        typeLabel: 'Vuelo de Llegada',
        title: `Vuelo ${origin} -> ${destination}`,
        description: `Vuelo operado por aerolínea sugerida.`,
        startDateTime: `${input.startDate}T08:00:00Z`,
        endDateTime: `${input.startDate}T10:15:00Z`,
        time: '08:00 - 10:15',
        status: EventStatus.PENDING,
        statusLabel: 'Programado',
        reservationStatus: ReservationStatus.CONFIRMED,
        order: 1,
        details: {
          classType: 'Económica',
          provider: 'Avianca',
          price: outboundFlightCost,
        },
      },
      {
        id: `evt-2-hotel`,
        tripId: 'draft-trip',
        type: EventType.HOTEL,
        typeLabel: 'Alojamiento',
        title: `Check-in Hotel en ${destination}`,
        description: 'Alojamiento céntrico seleccionado según categoría de confort.',
        startDateTime: `${input.startDate}T14:00:00Z`,
        time: '14:00',
        status: EventStatus.PENDING,
        statusLabel: 'Pendiente',
        reservationStatus: ReservationStatus.NOT_RESERVED,
        order: 2,
        details: {
          price: Math.round(budgetBreakdown.accommodation / 3),
        },
      },
      {
        id: `evt-3-dinner`,
        tripId: 'draft-trip',
        type: EventType.MEAL,
        typeLabel: 'Cena de Bienvenida',
        title: 'Cena gastronómica local',
        description: gastronomy[1].description,
        startDateTime: `${input.startDate}T19:30:00Z`,
        time: '19:30 - 21:00',
        status: EventStatus.PENDING,
        reservationStatus: ReservationStatus.NOT_RESERVED,
        order: 3,
      },
    ],
  };

  const day2: DayPlan = {
    dayNumber: 2,
    date: input.endDate,
    title: `Experiencias y despedida de ${destination}`,
    events: [
      {
        id: `evt-4-tour`,
        tripId: 'draft-trip',
        type: EventType.TOUR,
        typeLabel: 'Tour Cultural',
        title: plannedActivities[0].title,
        description: plannedActivities[0].description,
        startDateTime: `${input.endDate}T09:00:00Z`,
        time: '09:00 - 12:00',
        status: EventStatus.PENDING,
        reservationStatus: ReservationStatus.NOT_RESERVED,
        order: 1,
        details: {
          price: plannedActivities[0].estimatedCost,
        },
      },
    ],
  };

  // 6. Build Suggested Booking Items for Checkout
  const suggestedBookingItems: CreateBookingItemInput[] = [
    {
      type: BookingItemType.TRANSPORT,
      providerId: 'prov-airline-avianca',
      offerId: `flight-${origin.toLowerCase().slice(0, 3)}-${destination.toLowerCase().slice(0, 3)}`,
      description: `Vuelo ida ${origin} - ${destination} (${travelers} pasajero${travelers > 1 ? 's' : ''})`,
      quantity: travelers,
      unitPrice: outboundFlightCost,
    },
    {
      type: BookingItemType.ACCOMMODATION,
      providerId: 'prov-hotel-premium',
      offerId: `hotel-stay-${destination.toLowerCase().slice(0, 3)}`,
      description: `Estadía Hotel Estándar en ${destination} (3 noches)`,
      quantity: 1,
      unitPrice: budgetBreakdown.accommodation,
    },
    {
      type: BookingItemType.ACTIVITY,
      providerId: 'prov-local-tours',
      offerId: `tour-cultural-${destination.toLowerCase().slice(0, 3)}`,
      description: plannedActivities[0].title,
      quantity: travelers,
      unitPrice: plannedActivities[0].estimatedCost,
    },
  ];

  return {
    planId: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tripDraft: {
      userId: input.userId,
      origin: input.origin,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      title: `Viaje a ${destination} (${style})`,
      travelers: input.travelers,
    },
    personality: {
      analyzedStyle: style,
      traitSummary: `Perfil de viajero enfocado en experiencias de tipo ${style} con ritmo ${dominantPace}.`,
      dominantPace,
      recommendedVibe: `Vibra de inmersión ${style.toLowerCase()} con balance de actividades programadas y tiempo libre.`,
      psychologicalNotes: `Nivel de espontaneidad: ${input.psychologicalAssessment.spontaneityScore}/5, Confort: ${input.psychologicalAssessment.comfortPriority}/5.`,
    },
    budget: {
      category: input.budgetCategory,
      currency,
      estimatedTotalCost,
      dailyBudget,
      breakdown: budgetBreakdown,
      savingsTips: [
        'Reserva actividades con antelación para asegurar tarifa preferencial.',
        'Utiliza el transporte público sugerido para traslados entre atractivos turísticos.',
      ],
    },
    transport: {
      routeSummary: `Ruta óptima recomendada entre ${origin} y ${destination}.`,
      outbound: [outboundSegment],
      totalTransportCost: budgetBreakdown.transport,
      localTransitTips: [
        'Metro / transporte integrado disponible desde el aeropuerto.',
        'Usa aplicaciones de taxi verificadas en zonas nocturnas.',
      ],
    },
    experiences: {
      gastronomy,
      activities: plannedActivities,
      culturalHighlights: [
        `Visita al centro histórico y monumentos destacados de ${destination}.`,
        'Degustación en plazas de mercado tradicionales.',
      ],
    },
    itinerary: {
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      days: [day1, day2],
    },
    suggestedBookingItems,
  };
}
