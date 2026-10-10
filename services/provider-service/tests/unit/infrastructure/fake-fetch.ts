// fetch de mentira: devuelve la respuesta configurada y recuerda cómo lo llamaron.
export interface RecordedCall { url: string; headers: Record<string, string> }

export function fakeFetch(respond: () => Response | Promise<Response>) {
  const calls: RecordedCall[] = [];
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), headers: (init?.headers ?? {}) as Record<string, string> });
    return respond();
  }) as typeof fetch;
  return { fn, calls };
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// Resultado de SerpApi con la estructura real (campos recortados a los que usamos)
export const serpResponse = {
  search_metadata: { status: 'Success' },
  search_parameters: { engine: 'google_flights', departure_id: 'CDG', arrival_id: 'AUS', outbound_date: '2026-10-10' },
  best_flights: [
    {
      flights: [
        {
          departure_airport: { name: 'Aéroport de Paris-Charles de Gaulle', id: 'CDG', time: '2026-10-10 12:15' },
          arrival_airport: { name: 'Charlotte Douglas International Airport', id: 'CLT', time: '2026-10-10 15:25' },
          duration: 550,
          airline: 'American',
          travel_class: 'Economy',
          flight_number: 'AA 787',
        },
        {
          departure_airport: { id: 'CLT', time: '2026-10-10 17:00' },
          arrival_airport: { id: 'AUS', time: '2026-10-10 18:57' },
          airline: 'American',
          flight_number: 'AA 1457',
        },
      ],
      total_duration: 882,
      price: 905,
      type: 'One way',
    },
  ],
  other_flights: [
    {
      flights: [
        {
          departure_airport: { id: 'CDG', time: '2026-10-10 09:00' },
          arrival_airport: { id: 'AUS', time: '2026-10-10 13:30' },
          airline: 'Air France',
          flight_number: 'AF 100',
        },
      ],
      price: 1200,
    },
    // sin precio: no se puede ofrecer
    { flights: [{ airline: 'X', flight_number: 'XX 1' }] },
  ],
};

export const hotelsResponse = {
  success: true,
  data: [
    {
      id: 698731,
      name: 'NH Collection Madrid Abascal',
      city: 'Madrid',
      country: 'Spain',
      country_code: 'ES',
      rating: 4,
      amenities: ['bar', 'free_wifi'],
    },
    { id: 698733, name: 'Hyatt Regency Hesperia Madrid', city: 'Madrid', country: 'Spain', rating: 5 },
  ],
  message: null,
  timestamp: 1768924228,
};
