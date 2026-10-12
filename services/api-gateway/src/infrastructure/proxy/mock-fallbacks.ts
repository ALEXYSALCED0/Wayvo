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

  // Free conversational chat endpoint
  if (url.includes('/chat')) {
    const userMsg = req.body?.message || '';
    const response: ApiResponse = {
      success: true,
      data: {
        reply: `¡Hola! Como asistente de viajes de Wayvo con Gemini, he analizado tu solicitud: "${userMsg}". Tu itinerario está optimizado para tus gustos. ¿Deseas modificar algún horario o explorar actividades alternativas?`,
        suggestedActions: ['Ver detalles del vuelo', 'Revisar recomendaciones de cena', 'Simular un imprevisto'],
        model: 'gemini-1.5-pro',
      },
      message: 'Served by API Gateway AI Assistant',
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

