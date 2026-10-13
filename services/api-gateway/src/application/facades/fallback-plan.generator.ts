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
 * Emulates the 4 specialized LangGraph agents based on the user's input,
 * generating complete round-trip flights (ida y vuelta), multi-day itinerary,
 * and rich event details.
 */
export function generateFallbackPlan(input: AIPlanRecommendationInput): AIPlanRecommendationResult {
  const currency = input.currency || 'COP';
  const travelers = input.travelers || 1;
  const destination = input.destination;
  const origin = input.origin;

  // 1. Calculate duration and dates
  const sDate = new Date(input.startDate);
  const eDate = new Date(input.endDate);
  const rawDiff = Math.round(Math.abs(eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24));
  const numDays = Math.max(2, Math.min(7, rawDiff || 4));

  // 2. Emulate personality_agent
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

  // 3. Emulate budget_agent
  const baseMultiplier =
    input.budgetCategory === BudgetCategory.LUJO
      ? 2.2
      : input.budgetCategory === BudgetCategory.ECONOMICO
        ? 0.75
        : 1.0;

  const estimatedTotalCost = input.approximateBudgetAmount
    ? Math.round(input.approximateBudgetAmount)
    : Math.round(3600000 * baseMultiplier * travelers);
  const dailyBudget = Math.round(estimatedTotalCost / numDays);

  const budgetBreakdown = {
    transport: Math.round(estimatedTotalCost * 0.32),
    accommodation: Math.round(estimatedTotalCost * 0.38),
    activities: Math.round(estimatedTotalCost * 0.16),
    food: Math.round(estimatedTotalCost * 0.14),
    emergencyFund: Math.round(estimatedTotalCost * 0.05),
  };

  // 4. Emulate transport_agent (Ida y Vuelta)
  const oneWayFlightCostPerPerson = Math.round((budgetBreakdown.transport / 2) / travelers);
  const outboundSegment = {
    origin,
    destination,
    mode: 'flight' as const,
    departureTime: `${input.startDate}T08:15:00Z`,
    arrivalTime: `${input.startDate}T10:30:00Z`,
    estimatedDuration: '2h 15m',
    estimatedCost: oneWayFlightCostPerPerson * travelers,
    providerHint: 'Avianca AV9542 / LATAM LA4120',
  };

  const returnSegment = {
    origin: destination,
    destination: origin,
    mode: 'flight' as const,
    departureTime: `${input.endDate}T18:30:00Z`,
    arrivalTime: `${input.endDate}T20:45:00Z`,
    estimatedDuration: '2h 15m',
    estimatedCost: oneWayFlightCostPerPerson * travelers,
    providerHint: 'Avianca AV9543 / LATAM LA4121',
  };

  // 5. Emulate activities_food_agent
  const gastronomy = [
    {
      dish: `Degustación Tradicional Insignia de ${destination}`,
      typicalPlace: `Centro Gastronómico Tradicional de ${destination}`,
      description: 'Platos autóctonos con ingredientes de origen y maridaje local.',
      mealType: 'lunch' as const,
      estimatedCost: 45000,
      dietaryMatch: true,
    },
    {
      dish: 'Cena de Autor Caribeño / Andino',
      typicalPlace: `Restaurante de autor en ${destination}`,
      description: 'Experiencia culinaria seleccionada con alta valoración y ambiente exclusivo.',
      mealType: 'dinner' as const,
      estimatedCost: 85000,
      dietaryMatch: true,
    },
  ];

  const plannedActivities = [
    {
      title: `Tour Patrimonial e Histórico en ${destination}`,
      category: 'Cultura & Patrimonio',
      description: 'Recorrido inmersivo con historiador local por los puntos más emblemáticos.',
      duration: '3h',
      estimatedCost: 65000,
      bestTimeOfDay: 'morning' as const,
      bookingRequired: true,
    },
    {
      title: `Excursión Marina o Natural en ${destination}`,
      category: 'Naturaleza & Playas',
      description: 'Expedición ecológica y paisajística adaptada al ritmo de viaje.',
      duration: '4h 30m',
      estimatedCost: 120000,
      bestTimeOfDay: 'morning' as const,
      bookingRequired: true,
    },
    {
      title: 'Paseo al Atardecer y Miradores',
      category: 'Paisajes & Fotografía',
      description: 'Caminata escénica en los mejores miradores o murallas al caer el sol.',
      duration: '2h',
      estimatedCost: 30000,
      bestTimeOfDay: 'evening' as const,
      bookingRequired: false,
    },
  ];

  // 6. Build Multi-Day Itinerary with Rich Events (Including Vuelta)
  const days: DayPlan[] = [];

  // Helper date formatter
  const formatDateForDay = (dayIndex: number): string => {
    const cur = new Date(sDate);
    cur.setDate(cur.getDate() + dayIndex);
    return cur.toISOString().split('T')[0];
  };

  // Day 1: Ida, Check-in, Bienvenida
  days.push({
    dayNumber: 1,
    date: formatDateForDay(0),
    title: `Llegada a ${destination} e Instalación`,
    events: [
      {
        id: `evt-1-flight-outbound`,
        tripId: 'draft-trip',
        type: EventType.FLIGHT,
        typeLabel: 'Vuelo de Ida (Confirmado)',
        title: `Vuelo ${origin} ➔ ${destination}`,
        description: `Vuelo directo con Avianca AV9542. Equipaje de mano y bodega de 23kg incluidos.`,
        startDateTime: `${input.startDate}T08:15:00Z`,
        endDateTime: `${input.startDate}T10:30:00Z`,
        time: '08:15 AM - 10:30 AM',
        status: EventStatus.PENDING,
        statusLabel: 'PROGRAMADO',
        reservationStatus: ReservationStatus.CONFIRMED,
        order: 1,
        location: `Aeropuerto de ${origin} ➔ Aeropuerto de ${destination}`,
        details: {
          classType: input.budgetCategory === BudgetCategory.LUJO ? 'Ejecutiva' : 'Económica Plus',
          provider: 'Avianca / LATAM Airlines',
          price: oneWayFlightCostPerPerson * travelers,
          notes: 'Presentarse en puerta de embarque con 2h de anticipación.',
        },
      },
      {
        id: `evt-1-hotel-checkin`,
        tripId: 'draft-trip',
        type: EventType.HOTEL,
        typeLabel: 'Alojamiento Boutique',
        title: `Check-in Hotel Seleccionado en ${destination}`,
        description: `Hospedaje céntrico y confortable con desayuno buffet y wifi incluidos.`,
        startDateTime: `${input.startDate}T14:00:00Z`,
        time: '02:00 PM',
        status: EventStatus.PENDING,
        statusLabel: 'CONFIRMADO',
        reservationStatus: ReservationStatus.NOT_RESERVED,
        order: 2,
        location: `Centro Histórico / Zona Turística, ${destination}`,
        details: {
          provider: 'Hotel Boutique Colonial & Suites',
          price: Math.round(budgetBreakdown.accommodation / numDays),
          notes: 'Habitación climatizada con amenidades premium y balcón.',
        },
      },
      {
        id: `evt-1-welcome-lunch`,
        tripId: 'draft-trip',
        type: EventType.MEAL,
        typeLabel: 'Almuerzo de Bienvenida',
        title: `Degustación Gastronómica de Bienvenida`,
        description: gastronomy[0].description,
        startDateTime: `${input.startDate}T12:30:00Z`,
        time: '12:30 PM - 02:00 PM',
        status: EventStatus.PENDING,
        statusLabel: 'SUGERIDO',
        reservationStatus: ReservationStatus.NOT_RESERVED,
        order: 3,
        location: gastronomy[0].typicalPlace,
        details: {
          provider: 'Cocina Local Tradicional',
          price: gastronomy[0].estimatedCost * travelers,
          notes: 'Mesa con reservación preferente.',
        },
      },
      {
        id: `evt-1-sunset-walk`,
        tripId: 'draft-trip',
        type: EventType.ACTIVITY,
        typeLabel: 'Paseo Escénico',
        title: plannedActivities[2].title,
        description: plannedActivities[2].description,
        startDateTime: `${input.startDate}T17:30:00Z`,
        time: '05:30 PM - 07:00 PM',
        status: EventStatus.PENDING,
        statusLabel: 'PROGRAMADO',
        reservationStatus: ReservationStatus.NOT_RESERVED,
        order: 4,
        location: `Mirador Principal / Murallas, ${destination}`,
        details: {
          provider: 'Wayvo Curated Experiences',
          price: plannedActivities[2].estimatedCost,
          notes: 'Excelente momento para fotografía al atardecer.',
        },
      },
    ],
  });

  // Intermediate Days
  for (let d = 2; d < numDays; d++) {
    const isOdd = d % 2 === 1;
    days.push({
      dayNumber: d,
      date: formatDateForDay(d - 1),
      title: isOdd ? `Exploración y Patrimonio de ${destination}` : `Naturaleza y Aventura en ${destination}`,
      events: [
        {
          id: `evt-${d}-morning-tour`,
          tripId: 'draft-trip',
          type: EventType.TOUR,
          typeLabel: 'Experiencia Curada',
          title: isOdd ? plannedActivities[0].title : plannedActivities[1].title,
          description: isOdd ? plannedActivities[0].description : plannedActivities[1].description,
          startDateTime: `${formatDateForDay(d - 1)}T09:00:00Z`,
          time: '09:00 AM - 12:30 PM',
          status: EventStatus.PENDING,
          statusLabel: 'PROGRAMADO',
          reservationStatus: ReservationStatus.NOT_RESERVED,
          order: 1,
          location: `Atractivos Principales, ${destination}`,
          details: {
            provider: 'Operador Certificado Nacional',
            price: (isOdd ? plannedActivities[0].estimatedCost : plannedActivities[1].estimatedCost) * travelers,
            notes: 'Guía bilingüe acreditado, hidratación y seguro de asistencia incluidos.',
          },
        },
        {
          id: `evt-${d}-free-afternoon`,
          tripId: 'draft-trip',
          type: EventType.ACTIVITY,
          typeLabel: 'Tiempo Libre & Descanso',
          title: 'Tarde de Relajación / Exploración a tu Ritmo',
          description: 'Espacio flexible diseñado para descubrimientos espontáneos, compras locales o descanso.',
          startDateTime: `${formatDateForDay(d - 1)}T15:00:00Z`,
          time: '03:00 PM - 06:00 PM',
          status: EventStatus.PENDING,
          statusLabel: 'FLEXIBLE',
          reservationStatus: ReservationStatus.NOT_RESERVED,
          order: 2,
          location: `Distrito Histórico y Comercial de ${destination}`,
          details: {
            notes: 'Recomendaciones activas en el Concierge IA.',
          },
        },
        {
          id: `evt-${d}-dinner`,
          tripId: 'draft-trip',
          type: EventType.MEAL,
          typeLabel: 'Cena Especial',
          title: gastronomy[1].dish,
          description: gastronomy[1].description,
          startDateTime: `${formatDateForDay(d - 1)}T20:00:00Z`,
          time: '08:00 PM - 10:00 PM',
          status: EventStatus.PENDING,
          statusLabel: 'SUGERIDO',
          reservationStatus: ReservationStatus.NOT_RESERVED,
          order: 3,
          location: gastronomy[1].typicalPlace,
          details: {
            provider: 'Restaurante Selecto',
            price: gastronomy[1].estimatedCost * travelers,
            notes: 'Menú degustación con maridaje caribeño/andino.',
          },
        },
      ],
    });
  }

  // Final Day: Despedida, Check-out y VUELO DE VUELTA
  days.push({
    dayNumber: numDays,
    date: formatDateForDay(numDays - 1),
    title: `Check-out y Vuelo de Regreso a ${origin}`,
    events: [
      {
        id: `evt-${numDays}-checkout`,
        tripId: 'draft-trip',
        type: EventType.HOTEL,
        typeLabel: 'Check-out Hotel',
        title: `Check-out y Custodia de Equipaje`,
        description: 'Entrega de habitación con custodia gratuita de maletas hasta la hora del traslado.',
        startDateTime: `${input.endDate}T11:00:00Z`,
        time: '11:00 AM',
        status: EventStatus.PENDING,
        statusLabel: 'PROGRAMADO',
        reservationStatus: ReservationStatus.CONFIRMED,
        order: 1,
        location: `Hotel en ${destination}`,
        details: {
          notes: 'Revisar pertenencias personales y solicitar custodia en recepción.',
        },
      },
      {
        id: `evt-${numDays}-souvenirs`,
        tripId: 'draft-trip',
        type: EventType.ACTIVITY,
        typeLabel: 'Paseo Final',
        title: `Compras de Recuerdos y Café de Origen`,
        description: 'Paseo tranquilo por galerías artesanales y degustación de café especial de despedida.',
        startDateTime: `${input.endDate}T12:00:00Z`,
        time: '12:00 PM - 02:30 PM',
        status: EventStatus.PENDING,
        statusLabel: 'FLEXIBLE',
        reservationStatus: ReservationStatus.NOT_RESERVED,
        order: 2,
        location: `Mercado de Artesanos / Bóvedas en ${destination}`,
        details: {
          notes: 'Productos locales y café premium empacado al vacío para vuelo.',
        },
      },
      {
        id: `evt-${numDays}-airport-transfer`,
        tripId: 'draft-trip',
        type: EventType.TRANSPORT,
        typeLabel: 'Traslado al Aeropuerto',
        title: `Traslado Privado Hotel ➔ Aeropuerto`,
        description: 'Vehículo privado climatizado con conductor asignado para llegada puntual a terminal aérea.',
        startDateTime: `${input.endDate}T16:00:00Z`,
        time: '04:00 PM - 04:45 PM',
        status: EventStatus.PENDING,
        statusLabel: 'PROGRAMADO',
        reservationStatus: ReservationStatus.NOT_RESERVED,
        order: 3,
        location: `Hotel ➔ Aeropuerto de ${destination}`,
        details: {
          provider: 'Transportes Ejecutivos Colombia',
          price: 55000,
          notes: 'Vehículo con aire acondicionado y espacio para equipaje completo.',
        },
      },
      {
        id: `evt-${numDays}-flight-inbound`,
        tripId: 'draft-trip',
        type: EventType.FLIGHT,
        typeLabel: 'Vuelo de Regreso (Vuelta)',
        title: `Vuelo de Regreso ${destination} ➔ ${origin}`,
        description: `Vuelo de vuelta confirmado con Avianca AV9543 / LATAM LA4121. Retorno seguro a casa.`,
        startDateTime: `${input.endDate}T18:30:00Z`,
        endDateTime: `${input.endDate}T20:45:00Z`,
        time: '06:30 PM - 08:45 PM',
        status: EventStatus.PENDING,
        statusLabel: 'PROGRAMADO',
        reservationStatus: ReservationStatus.CONFIRMED,
        order: 4,
        location: `Aeropuerto de ${destination} ➔ Aeropuerto de ${origin}`,
        details: {
          classType: input.budgetCategory === BudgetCategory.LUJO ? 'Ejecutiva' : 'Económica Plus',
          provider: 'Avianca / LATAM Airlines',
          price: oneWayFlightCostPerPerson * travelers,
          notes: 'Equipaje en bodega y asignación de asiento contiguo incluidos.',
        },
      },
    ],
  });

  // 7. Build Suggested Booking Items for Checkout (Including IDA and VUELTA)
  const suggestedBookingItems: CreateBookingItemInput[] = [
    {
      type: BookingItemType.TRANSPORT,
      providerId: 'prov-aerocaribe',
      offerId: `flight-ida-${origin.slice(0, 3)}-${destination.slice(0, 3)}`,
      description: `Vuelo de Ida: ${origin} ➔ ${destination} (${travelers} pasajero${travelers > 1 ? 's' : ''})`,
      quantity: travelers,
      unitPrice: oneWayFlightCostPerPerson,
    },
    {
      type: BookingItemType.TRANSPORT,
      providerId: 'prov-aerocaribe',
      offerId: `flight-vuelta-${destination.slice(0, 3)}-${origin.slice(0, 3)}`,
      description: `Vuelo de Vuelta: ${destination} ➔ ${origin} (${travelers} pasajero${travelers > 1 ? 's' : ''})`,
      quantity: travelers,
      unitPrice: oneWayFlightCostPerPerson,
    },
    {
      type: BookingItemType.ACCOMMODATION,
      providerId: 'prov-hotel-colonial',
      offerId: `hotel-${destination.toLowerCase().slice(0, 3)}-nights`,
      description: `Estadía Hotel Boutique en ${destination} (${numDays - 1} noches para ${travelers} viajero${travelers > 1 ? 's' : ''})`,
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
        'Utiliza el transporte sugerido para traslados cómodos y seguros.',
      ],
    },
    transport: {
      routeSummary: `Ruta óptima completa de ida y vuelta entre ${origin} y ${destination}.`,
      outbound: [outboundSegment],
      inbound: [returnSegment],
      totalTransportCost: budgetBreakdown.transport,
      localTransitTips: [
        'Traslados al aeropuerto programados con suficiente margen de tiempo.',
        'Usa aplicaciones de transporte verificado en zonas nocturnas.',
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
      days,
    },
    suggestedBookingItems,
  };
}
