import { Request, Response } from 'express';
import { ApiResponse } from '@wayvo/contracts';

export function tripMockFallback(req: Request, res: Response): void {
  const isPost = req.method === 'POST';
  const response: ApiResponse = {
    success: true,
    data: isPost
      ? { tripId: `mock-trip-${Date.now()}`, status: 'PENDING', message: 'Mock response: trip created (service in dev)' }
      : { id: req.params.id || 'mock-trip-1', destination: 'Cartagena', status: 'active', events: [] },
    message: 'Served by API Gateway Mock Fallback (trip-service is in development)',
  };
  res.status(isPost ? 201 : 200).json(response);
}

export function providerMockFallback(req: Request, res: Response): void {
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
