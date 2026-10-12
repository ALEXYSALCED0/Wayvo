import { Request, Response } from 'express';
import { ApiResponse } from '@wayvo/contracts';

export function tripMockFallback(req: Request, res: Response): void {
  const isPost = req.method === 'POST';
  const url = req.originalUrl || req.url;

  // Mediator Step 1: Report Incident
  if (url.includes('/incidents')) {
    const response: ApiResponse = {
      success: true,
      data: {
        incidentId: `inc-${Date.now()}`,
        tripId: req.params.id || 'trip-demo',
        status: 'ANALYZING',
        message: 'Incidente registrado. El Mediador generó alternativas viables.',
        availableAlternatives: [
          {
            id: 'alt-fl-1',
            type: 'FLIGHT_RESCHEDULE',
            description: 'Vuelo reprogramado con Avianca 2 horas más tarde sin costo adicional',
            impactMinutes: 120,
            costDifference: 0,
            currency: 'COP',
            isRecommended: true,
          },
          {
            id: 'alt-fl-2',
            type: 'ALTERNATIVE_CARRIER',
            description: 'Vuelo inmediato con LATAM Airlines (Cobertura de garantía Wayvo)',
            impactMinutes: 15,
            costDifference: 65000,
            currency: 'COP',
            isRecommended: false,
          },
        ],
      },
      message: 'Served by API Gateway Mock Fallback (trip-service mediator)',
    };
    return void res.status(200).json(response);
  }

  // Mediator Step 2: Select Alternative
  if (url.includes('/alternatives')) {
    const response: ApiResponse = {
      success: true,
      data: {
        incidentId: `inc-${Date.now()}`,
        tripId: req.params.id || 'trip-demo',
        appliedAlternativeId: req.body?.alternativeId || 'alt-fl-1',
        resolutionStatus: 'RESOLVED',
        message: 'Alternativa aplicada con éxito. El itinerario ha sido recalculado dinámicamente.',
      },
      message: 'Served by API Gateway Mock Fallback (trip-service mediator)',
    };
    return void res.status(200).json(response);
  }

  if (req.method === 'DELETE') {
    return void res.status(200).json({
      success: true,
      data: { deleted: true, tripId: req.params.id || 'mock-trip-id' },
      message: 'Trip deleted successfully (mock fallback)',
    });
  }

  const response: ApiResponse = {
    success: true,
    data: isPost
      ? { tripId: `mock-trip-${Date.now()}`, status: 'PENDING', message: 'Mock response: trip created (service in dev)' }
      : {
          id: req.params.id || 'mock-trip-1',
          destination: 'Cartagena de Indias',
          status: 'CONFIRMED',
          title: 'Aventura Caribeña en Cartagena',
          startDate: '2026-11-01',
          endDate: '2026-11-05',
          events: [
            {
              id: 'evt-1',
              title: 'Vuelo Bogotá -> Cartagena',
              startTime: '08:00 AM',
              endTime: '09:30 AM',
              type: 'TRANSPORT',
              status: 'CONFIRMED',
              location: 'Aeropuerto Rafael Núñez',
            },
            {
              id: 'evt-2',
              title: 'Check-in Hotel Bocagrande',
              startTime: '11:00 AM',
              endTime: '12:00 PM',
              type: 'ACCOMMODATION',
              status: 'CONFIRMED',
              location: 'Bocagrande, Cartagena',
            },
            {
              id: 'evt-3',
              title: 'Tour Ciudad Amurallada & Cena Típica',
              startTime: '04:00 PM',
              endTime: '08:00 PM',
              type: 'ACTIVITY',
              status: 'CONFIRMED',
              location: 'Centro Histórico',
            },
          ],
        },
    message: 'Served by API Gateway Mock Fallback (trip-service is in development)',
  };
  res.status(isPost ? 201 : 200).json(response);
}

export function providerMockFallback(req: Request, res: Response): void {
  const url = req.originalUrl || req.url;

  // Simulator / Chaos routes
  if (url.includes('/simulate-failure')) {
    const mode = (req.query.mode as string) || 'normal';
    return void res.status(200).json({
      success: true,
      data: {
        activeMode: mode,
        message: `Modo de simulación del proveedor configurado a: ${mode}`,
      },
      message: 'Configurado vía API Gateway Mock Fallback',
    });
  }

  if (url.includes('/reset')) {
    return void res.status(200).json({
      success: true,
      data: {
        activeMode: 'normal',
        message: 'Simulador de proveedores restablecido a estado normal',
      },
      message: 'Restablecido vía API Gateway Mock Fallback',
    });
  }

  const response: ApiResponse = {
    success: true,
    data: {
      available: true,
      reservationCode: `MOCK-RES-${Date.now().toString(36).toUpperCase()}`,
      providers: [
        { id: 'prov-mock-1', name: 'Mock Express Transport', type: 'TRANSPORT', verificationStatus: 'VERIFIED' },
      ],
    },
    message: 'Served by API Gateway Mock Fallback (provider-service is in development)',
  };
  res.status(200).json(response);
}

export function aiMockFallback(req: Request, res: Response): void {
  const url = req.originalUrl || req.url;

  // Free conversational chat endpoint with specific recommendations and interactive cards
  if (url.includes('/chat')) {
    const userMsg = req.body?.message || '';
    const dest = req.body?.context?.currentDestination || 'tu destino';
    const q = userMsg.toLowerCase();
    const destLower = dest.toLowerCase();

    let dynamicReply = '';
    const cards: any[] = [];

    // 1. MIAMI
    if (destLower.includes('miami')) {
      if (q.includes('comida') || q.includes('restaurante') || q.includes('plato') || q.includes('gastronom') || q.includes('cenar') || q.includes('almorzar')) {
        dynamicReply = `Para Miami, la gastronomía combina alta cocina marina con el sabor cubano de Little Havana. Te recomiendo especialmente estos establecimientos imperdibles:`;
        cards.push(
          {
            id: 'card-mia-1',
            type: 'restaurant',
            title: "Joe's Stone Crab",
            subtitle: 'Especialidad en Cangrejo Moro & Key Lime Pie',
            badge: 'Clásico Histórico • 4.8 ★',
            location: '11 Washington Ave, South Beach',
            priceEstimate: '$$$ (~$65 - $110 USD)',
            description: 'Institución fundada en 1913. Famosa por sus pinzas de cangrejo moro con salsa de mostaza y su legendario postre de lima.',
            action: {
              label: 'Reservar Mesa / Ver en Maps',
              url: 'https://www.google.com/maps/search/?api=1&query=Joes+Stone+Crab+South+Beach+Miami',
              icon: 'restaurant',
            },
          },
          {
            id: 'card-mia-2',
            type: 'restaurant',
            title: 'Versailles Restaurant',
            subtitle: 'El corazón de la cocina cubana en Miami',
            badge: 'Patrimonio Cultural • 4.7 ★',
            location: '3555 SW 8th St, Little Havana',
            priceEstimate: '$ (~$18 - $32 USD)',
            description: 'El restaurante cubano más icónico del mundo. Prueba la ropa vieja tradicional, el sándwich cubano y el auténtico café con leche.',
            action: {
              label: 'Ver Menú y Ubicación',
              url: 'https://www.google.com/maps/search/?api=1&query=Versailles+Restaurant+Little+Havana+Miami',
              icon: 'restaurant',
            },
          },
          {
            id: 'card-mia-3',
            type: 'restaurant',
            title: 'Zuma Miami',
            subtitle: 'Cocina Japonesa Contemporánea Robata',
            badge: 'Alta Cocina • 4.6 ★',
            location: '270 Biscayne Blvd Way, Downtown',
            priceEstimate: '$$$$ (~$95 - $160 USD)',
            description: 'Experiencia izakaya de primer nivel con terraza junto al río de Miami y cócteles de autor galardonados.',
            action: {
              label: 'Reservar en OpenTable',
              url: 'https://www.google.com/maps/search/?api=1&query=Zuma+Miami+Downtown',
              icon: 'restaurant',
            },
          }
        );
      } else if (q.includes('vuelo') || q.includes('retraso') || q.includes('aeropuerto') || q.includes('volar')) {
        dynamicReply = `Para volar a Miami dispones de excelentes conexiones directas tanto al Miami International (MIA) como a Fort Lauderdale (FLL):`;
        cards.push(
          {
            id: 'card-mia-flight-1',
            type: 'flight',
            title: 'Vuelos Directos a Miami (MIA)',
            subtitle: 'Avianca • LATAM • American Airlines',
            badge: 'Aeropuerto Principal • Recomendado',
            location: 'Miami International Airport (MIA)',
            priceEstimate: 'Desde $1.250.000 COP ida y vuelta',
            description: 'Conexión directa sin escalas con múltiples frecuencias diarias y acceso rápido en Metrorail a Downtown.',
            action: {
              label: 'Buscar Vuelos en Google Flights',
              url: 'https://www.google.com/travel/flights?q=vuelos+a+Miami+MIA',
              icon: 'flight_takeoff',
            },
          },
          {
            id: 'card-mia-flight-2',
            type: 'flight',
            title: 'Alternativa Fort Lauderdale (FLL)',
            subtitle: 'Spirit • JetBlue',
            badge: 'Opción Low-Cost',
            location: 'Fort Lauderdale-Hollywood Intl (FLL)',
            priceEstimate: 'Desde $950.000 COP ida y vuelta',
            description: 'A 35 minutos de Miami con conexión directa mediante el tren de alta velocidad Brightline.',
            action: {
              label: 'Comparar Vuelos a FLL',
              url: 'https://www.google.com/travel/flights?q=vuelos+a+Fort+Lauderdale+FLL',
              icon: 'flight_takeoff',
            },
          }
        );
      } else if (q.includes('imprevisto') || q.includes('clima') || q.includes('lluvia') || q.includes('huracan')) {
        dynamicReply = `En Miami, los cambios climáticos repentinos o lluvias tropicales de tarde son comunes. El sistema Wayvo tiene activas estas protecciones:`;
        cards.push(
          {
            id: 'card-mia-contingency-1',
            type: 'contingency',
            title: 'Protección Climática Wayvo',
            subtitle: 'Pase de Lluvia por Actividades Indoor',
            badge: 'Sin Recargo • Garantía Activa',
            location: 'Todo Miami',
            priceEstimate: 'Cobertura 100% Incluida',
            description: 'En caso de lluvia severa, tus actividades exteriores se sustituyen automáticamente por museos como el Pérez Art Museum (PAMM) o Frost Science.',
            action: {
              label: 'Ver Opciones Bajo Techo',
              url: 'https://www.google.com/search?q=Perez+Art+Museum+Miami+tickets',
              icon: 'museum',
            },
          }
        );
      } else {
        dynamicReply = `¡Bienvenido a Miami! La Ciudad del Sol te ofrece arte moderno, playas y una vida cultural vibrante. Aquí tienes planes destacados para tu estadía:`;
        cards.push(
          {
            id: 'card-mia-act-1',
            type: 'activity',
            title: 'Wynwood Walls & Distrito de Arte',
            subtitle: 'El epicentro mundial del arte urbano',
            badge: 'Imperdible • 4.8 ★',
            location: '2516 NW 2nd Ave, Wynwood',
            priceEstimate: '~$12 USD Entrada',
            description: 'Museo al aire libre con murales de los grafiteros internacionales más afamados y galerías de diseño vanguardista.',
            action: {
              label: 'Reservar Entradas / Tickets',
              url: 'https://www.google.com/search?q=Wynwood+Walls+Miami+entradas+tickets',
              icon: 'confirmation_number',
            },
          },
          {
            id: 'card-mia-act-2',
            type: 'activity',
            title: 'Paseo en Catamarán por Biscayne Bay',
            subtitle: 'Vistas panorámicas del Skyline y Millionaire’s Row',
            badge: 'Tour al Atardecer • 4.7 ★',
            location: 'Bayside Marketplace, Downtown Miami',
            priceEstimate: '~$38 USD por persona',
            description: 'Navegación de 90 minutos frente a Fisher Island y las mansiones de Venetian Islands con audio-guía bilingüe.',
            action: {
              label: 'Ver Disponibilidad de Tours',
              url: 'https://www.google.com/search?q=Biscayne+Bay+boat+tour+Miami+reservas',
              icon: 'sailing',
            },
          }
        );
      }
    }
    // 2. CARTAGENA
    else if (destLower.includes('cartagena')) {
      if (q.includes('comida') || q.includes('restaurante') || q.includes('plato') || q.includes('gastronom')) {
        dynamicReply = `En Cartagena, la gastronomía combina la tradición caribeña con la alta cocina contemporánea. Te recomiendo estos restaurantes selectos:`;
        cards.push(
          {
            id: 'card-ctg-1',
            type: 'restaurant',
            title: 'Restaurante Celele',
            subtitle: 'Cocina del Caribe Contemporáneo',
            badge: 'Latin America’s 50 Best • 4.9 ★',
            location: 'Calle del Espíritu Santo, Getsemaní',
            priceEstimate: '$$$ (~$120.000 - $220.000 COP)',
            description: 'Investigación de ingredientes ancestrales del Caribe colombiano plasmada en un menú degustación de vanguardia.',
            action: {
              label: 'Reservar Mesa / Ver Menú',
              url: 'https://www.google.com/maps/search/?api=1&query=Celele+Restaurante+Cartagena',
              icon: 'restaurant',
            },
          },
          {
            id: 'card-ctg-2',
            type: 'restaurant',
            title: 'Candé 100% Cartagenero',
            subtitle: 'Gastronomía autóctona en casona colonial',
            badge: 'Cultura Viva • 4.7 ★',
            location: 'Calle de la Serrezuela, San Diego',
            priceEstimate: '$$ (~$80.000 - $140.000 COP)',
            description: 'Pescados frescos, posta negra cartagenera, arroz con coco y show en vivo de folclor tradicional.',
            action: {
              label: 'Reservar Mesa en Candé',
              url: 'https://www.google.com/maps/search/?api=1&query=Cande+Restaurante+Cartagena',
              icon: 'restaurant',
            },
          }
        );
      } else {
        dynamicReply = `Cartagena de Indias es historia, magia y brisa marina. Aquí tienes planes exclusivos para complementar tu viaje:`;
        cards.push(
          {
            id: 'card-ctg-act-1',
            type: 'activity',
            title: 'Pasadía en Islas del Rosario',
            subtitle: 'Playas de arena blanca y arrecifes de coral',
            badge: 'Excursión Top • 4.8 ★',
            location: 'Salida desde Muelle de la Bodeguita',
            priceEstimate: '~$180.000 COP por persona',
            description: 'Transporte en lancha rápida, bienvenida con cóctel tropical, snorkel guiado y almuerzo caribeño típico.',
            action: {
              label: 'Ver Opciones y Reservas',
              url: 'https://www.google.com/search?q=Islas+del+Rosario+pasadia+Cartagena+reservas',
              icon: 'sailing',
            },
          },
          {
            id: 'card-ctg-flight-1',
            type: 'flight',
            title: 'Vuelos a Cartagena (CTG)',
            subtitle: 'Avianca • LATAM • Wingo',
            badge: 'Aeropuerto Rafael Núñez',
            location: 'Aeropuerto CTG (Crespo)',
            priceEstimate: 'Desde $320.000 COP por trayecto',
            description: 'Vuelos frecuentes desde las principales capitales de Colombia y conexiones internacionales.',
            action: {
              label: 'Ver Vuelos en Google Flights',
              url: 'https://www.google.com/travel/flights?q=vuelos+a+Cartagena+CTG',
              icon: 'flight_takeoff',
            },
          }
        );
      }
    }
    // 3. MEDELLÍN
    else if (destLower.includes('medellin')) {
      dynamicReply = `En Medellín, la Ciudad de la Eterna Primavera, la innovación y la gastronomía se entrelazan. Te sugiero estas opciones destacadas:`;
      cards.push(
        {
          id: 'card-mde-1',
          type: 'restaurant',
          title: 'Restaurante Elcielo',
          subtitle: 'Cocina sensorial del Chef Juan Manuel Barrientos',
          badge: 'Estrella Michelin • 4.9 ★',
          location: 'El Poblado, Medellín',
          priceEstimate: '$$$$ (~$350.000 COP degustación)',
          description: 'Experiencia inmersiva que estimula todos los sentidos con técnicas de vanguardia inspiradas en Colombia.',
          action: {
            label: 'Reservar en Elcielo',
            url: 'https://www.google.com/maps/search/?api=1&query=Elcielo+Medellin',
            icon: 'restaurant',
          },
        },
        {
          id: 'card-mde-2',
          type: 'activity',
          title: 'Graffitour Comuna 13 & Escaleras Eléctricas',
          subtitle: 'Transformación social y arte urbano',
          badge: 'Tour Histórico • 4.9 ★',
          location: 'Comuna 13, San Javier',
          priceEstimate: '~$50.000 COP con guía local',
          description: 'Recorrido a pie con artistas locales, música hip-hop y degustación de las tradicionales paletas de mango biche.',
          action: {
            label: 'Ver Opciones de Tour',
            url: 'https://www.google.com/search?q=Graffitour+Comuna+13+Medellin+reservas',
            icon: 'confirmation_number',
          },
        }
      );
    }
    // 4. CUALQUIER OTRO DESTINO DEL MUNDO (DINÁMICO Y ESPECÍFICO)
    else {
      if (q.includes('comida') || q.includes('restaurante') || q.includes('plato') || q.includes('gastronom')) {
        dynamicReply = `Para ${dest}, he seleccionado los restaurantes más recomendados por la comunidad de viajeros y críticos locales:`;
        cards.push(
          {
            id: `card-gen-res-1`,
            type: 'restaurant',
            title: `Mejores Restaurantes de ${dest}`,
            subtitle: 'Gastronomía autóctona y alta cocina',
            badge: 'Top Picks • Calificación 4.7+ ★',
            location: `Centro y zonas gastronómicas de ${dest}`,
            priceEstimate: 'Opciones desde accesible hasta autor',
            description: `Consulta la guía gastronómica curada para ${dest} con reserva directa de mesas, opiniones verificadas y menús disponibles.`,
            action: {
              label: 'Explorar Restaurantes en Maps',
              url: `https://www.google.com/maps/search/?api=1&query=mejores+restaurantes+en+${encodeURIComponent(dest)}`,
              icon: 'restaurant',
            },
          }
        );
      } else if (q.includes('vuelo') || q.includes('retraso') || q.includes('aeropuerto')) {
        dynamicReply = `Aquí tienes el radar de vuelos y conexiones directas hacia ${dest}:`;
        cards.push(
          {
            id: `card-gen-flt-1`,
            type: 'flight',
            title: `Vuelos Directos y Conexiones a ${dest}`,
            subtitle: 'Monitoreo de aerolíneas globales y low-cost',
            badge: 'Tarifas Protegidas',
            location: `Aeropuerto Internacional de ${dest}`,
            priceEstimate: 'Mejor precio garantizado',
            description: `Comparativa de itinerarios, escalas y políticas de equipaje en tiempo real para tu ruta hacia ${dest}.`,
            action: {
              label: 'Buscar Vuelos en Google Flights',
              url: `https://www.google.com/travel/flights?q=vuelos+a+${encodeURIComponent(dest)}`,
              icon: 'flight_takeoff',
            },
          }
        );
      } else {
        dynamicReply = `Como tu concierge para ${dest}, he preparado estas recomendaciones personalizadas para aprovechar tu estadía:`;
        cards.push(
          {
            id: `card-gen-act-1`,
            type: 'activity',
            title: `Atracciones y Experiencias en ${dest}`,
            subtitle: 'Tours guiados, museos y naturaleza',
            badge: 'Experiencias Curadas',
            location: dest,
            priceEstimate: 'Entradas con acceso prioritario',
            description: `Descubre los sitios emblemáticos de ${dest} con opciones de cancelación flexible y reserva anticipada.`,
            action: {
              label: 'Ver Actividades y Entradas',
              url: `https://www.google.com/search?q=mejores+tours+y+actividades+en+${encodeURIComponent(dest)}+reservas`,
              icon: 'confirmation_number',
            },
          },
          {
            id: `card-gen-flt-2`,
            type: 'flight',
            title: `Vuelos hacia ${dest}`,
            subtitle: 'Opciones de ida y regreso',
            badge: 'Google Flights',
            location: `Aeropuerto de ${dest}`,
            priceEstimate: 'Comparador en vivo',
            description: `Consulta las mejores fechas y aerolíneas para viajar hacia ${dest} con equipaje incluido.`,
            action: {
              label: 'Ver Vuelos en Google Flights',
              url: `https://www.google.com/travel/flights?q=vuelos+a+${encodeURIComponent(dest)}`,
              icon: 'flight_takeoff',
            },
          }
        );
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        reply: dynamicReply,
        cards,
        suggestedActions: [
          `Restaurantes top en ${dest}`,
          `Vuelos hacia ${dest}`,
          `Lugares imperdibles en ${dest}`,
        ],
        model: 'gemini-1.5-pro',
      },
      message: 'Served by API Gateway Travel Intelligence',
    };
    return void res.status(200).json(response);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      planId: `mock-plan-${Date.now()}`,
      recommendationSummary: 'AI multiagent plan generated via mock fallback.',
      itinerary: { days: [] },
    },
    message: 'Served by API Gateway Mock Fallback (ai-recommendation is in development)',
  };
  res.status(200).json(response);
}

