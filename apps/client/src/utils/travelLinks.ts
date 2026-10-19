/**
 * Utilidad para resolución de códigos aeroportuarios y construcción
 * de enlaces dinámicos verificados (vuelos con fechas y pasajeros cargados,
 * hoteles, restaurantes en Google Maps y tours en Civitatis / TripAdvisor).
 */

export interface FlightSearchParams {
  origin?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  airline?: 'AVIANCA' | 'LATAM' | 'WINGO' | 'ALL';
}

/**
 * Resuelve el código IATA del aeropuerto para ciudades colombianas
 * e internacionales frecuentes.
 */
export function resolveAirportCode(cityOrText?: string, isDestination: boolean = false): string {
  if (!cityOrText) return isDestination ? 'CTG' : 'BOG';

  // Si contiene un código IATA de 3 letras entre paréntesis, ej: "Bogotá (BOG)" o "Cartagena (CTG)"
  const parenMatch = cityOrText.match(/\(([A-Z]{3})\)/);
  if (parenMatch) {
    return parenMatch[1];
  }

  // Si ya es un código de 3 letras directamente, ej: "CTG" o "MDE"
  const exactCodeMatch = cityOrText.trim().match(/^[A-Z]{3}$/);
  if (exactCodeMatch) {
    return exactCodeMatch[0];
  }

  const norm = cityOrText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Colombia
  if (norm.includes('cartagena')) return 'CTG';
  if (norm.includes('medellin') || norm.includes('rionegro')) return 'MDE';
  if (norm.includes('santa marta') || norm.includes('santamarta') || norm.includes('tayrona') || norm.includes('rodadero')) return 'SMR';
  if (norm.includes('san andres') || norm.includes('sanandres') || norm.includes('providencia')) return 'ADZ';
  if (norm.includes('cali')) return 'CLO';
  if (norm.includes('barranquilla')) return 'BAQ';
  if (norm.includes('pereira') || norm.includes('matecana')) return 'PEI';
  if (norm.includes('bucaramanga')) return 'BGA';
  if (norm.includes('cucuta')) return 'CUC';
  if (norm.includes('monteria')) return 'MTR';
  if (norm.includes('leticia') || norm.includes('amazonas')) return 'LET';
  if (norm.includes('riohacha') || norm.includes('guajira')) return 'RCH';
  if (norm.includes('pasto')) return 'PSO';
  if (norm.includes('popayan')) return 'PPN';
  if (norm.includes('armenia') || norm.includes('eje cafetero') || norm.includes('quindio') || norm.includes('salento')) return 'AXM';
  if (norm.includes('manizales') || norm.includes('caldas')) return 'MZL';
  if (norm.includes('neiva')) return 'NVA';
  if (norm.includes('valledupar')) return 'VUP';
  if (norm.includes('ibague')) return 'IBE';
  if (norm.includes('villavicencio')) return 'VVC';
  if (norm.includes('yopal')) return 'EYP';
  if (norm.includes('florencia')) return 'FLA';
  if (norm.includes('arauca')) return 'AUC';
  if (norm.includes('apartado')) return 'APO';
  if (norm.includes('barrancabermeja')) return 'EJA';
  if (norm.includes('corozal') || norm.includes('sincelejo')) return 'CZU';
  if (norm.includes('ipiales')) return 'IPI';
  if (norm.includes('quibdo') || norm.includes('choco')) return 'UIB';
  if (norm.includes('tumaco')) return 'TCO';
  if (norm.includes('tolu') || norm.includes('covenas')) return 'TLQ';
  if (norm.includes('bahia solano')) return 'BSC';
  if (norm.includes('nuqui')) return 'NQU';
  if (norm.includes('bogota') || norm.includes('eldorado')) return 'BOG';

  // Internacionales frecuentes
  if (norm.includes('miami')) return 'MIA';
  if (norm.includes('orlando')) return 'MCO';
  if (norm.includes('madrid')) return 'MAD';
  if (norm.includes('cancun')) return 'CUN';
  if (norm.includes('mexico') || norm.includes('cdmx')) return 'MEX';
  if (norm.includes('buenos aires')) return 'EZE';
  if (norm.includes('lima')) return 'LIM';
  if (norm.includes('panama')) return 'PTY';
  if (norm.includes('nueva york') || norm.includes('new york')) return 'JFK';
  if (norm.includes('sao paulo')) return 'GRU';
  if (norm.includes('rio de janeiro')) return 'GIG';
  if (norm.includes('santiago')) return 'SCL';
  if (norm.includes('cusco') || norm.includes('cuzco') || norm.includes('machu picchu')) return 'CUZ';
  if (norm.includes('paris')) return 'CDG';
  if (norm.includes('barcelona')) return 'BCN';
  if (norm.includes('londres') || norm.includes('london')) return 'LHR';
  if (norm.includes('roma') || norm.includes('rome')) return 'FCO';
  if (norm.includes('tokio') || norm.includes('tokyo')) return 'NRT';
  if (norm.includes('quito')) return 'UIO';
  if (norm.includes('guayaquil')) return 'GYE';
  if (norm.includes('punta cana')) return 'PUJ';
  if (norm.includes('santo domingo')) return 'SDQ';
  if (norm.includes('los angeles')) return 'LAX';
  if (norm.includes('amsterdam')) return 'AMS';

  return isDestination ? 'CTG' : 'BOG';
}

/**
 * Genera el enlace de Kayak Colombia con origen, destino, fechas, pasajeros
 * y filtro opcional por aerolínea (Avianca = AV, LATAM = LA, Wingo = P5).
 * Al abrirse en navegador, carga la búsqueda exacta con precios reales y
 * botones directos "Reservar con la aerolínea".
 */
export function getKayakFlightUrl(params: FlightSearchParams): string {
  const originCode = resolveAirportCode(params.origin, false);
  const destCode = resolveAirportCode(params.destination, true);
  const travelers = Math.max(1, params.travelers || 2);
  const start = params.startDate || new Date().toISOString().split('T')[0];

  let routePath = `${originCode}-${destCode}/${start}`;
  if (params.endDate) {
    routePath += `/${params.endDate}`;
  }
  routePath += `/${travelers}adults`;

  let filter = '';
  if (params.airline === 'AVIANCA') {
    filter = '?fs=airlines=AV';
  } else if (params.airline === 'LATAM') {
    filter = '?fs=airlines=LA';
  } else if (params.airline === 'WINGO') {
    filter = '?fs=airlines=P5';
  }

  return `https://www.kayak.com.co/flights/${routePath}${filter}`;
}

/**
 * Enlace directo a Despegar Colombia con fechas y pasajeros cargados.
 */
export function getDespegarFlightUrl(params: FlightSearchParams): string {
  const originCode = resolveAirportCode(params.origin);
  const destCode = resolveAirportCode(params.destination);
  const travelers = Math.max(1, params.travelers || 2);
  const start = params.startDate || new Date().toISOString().split('T')[0];

  if (params.endDate) {
    return `https://www.despegar.com.co/vuelos/${originCode.toLowerCase()}/${destCode.toLowerCase()}?from=${start}&to=${params.endDate}&passengers=${travelers}`;
  }
  return `https://www.despegar.com.co/vuelos/${originCode.toLowerCase()}/${destCode.toLowerCase()}?from=${start}&passengers=${travelers}`;
}

/**
 * Portales oficiales limpios de las aerolíneas aliadas (sin URLs rotas).
 */
export const OFFICIAL_AIRLINE_PORTALS = {
  AVIANCA: {
    name: 'Avianca',
    url: 'https://www.avianca.com/co/es/',
    label: 'Portal Oficial Avianca',
  },
  LATAM: {
    name: 'LATAM Airlines',
    url: 'https://www.latamairlines.com/co/es/',
    label: 'Portal Oficial LATAM',
  },
  WINGO: {
    name: 'Wingo',
    url: 'https://www.wingo.com/',
    label: 'Portal Oficial Wingo',
  },
};

/**
 * Enlace directo de Booking.com con hotel/destino, fechas y cantidad de huéspedes.
 */
export function getBookingHotelUrl(
  hotelOrDestination: string,
  destination: string,
  startDate?: string,
  endDate?: string,
  travelers: number = 2
): string {
  const query = `${hotelOrDestination} ${destination}`.trim();
  let url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}&group_adults=${Math.max(1, travelers)}&no_rooms=1`;
  if (startDate) url += `&checkin=${startDate}`;
  if (endDate) url += `&checkout=${endDate}`;
  return url;
}

/**
 * Enlace de Hoteles.com con destino y fechas.
 */
export function getHotelesUrl(
  hotelOrDestination: string,
  destination: string,
  startDate?: string,
  endDate?: string,
  travelers: number = 2
): string {
  const query = `${hotelOrDestination} ${destination}`.trim();
  let url = `https://es.hoteles.com/Hotel-Search?destination=${encodeURIComponent(query)}&adults=${Math.max(1, travelers)}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  return url;
}

/**
 * Enlace a Google Maps Place Search (100% verificado, sin logins obligatorios de IG).
 * Muestra el teléfono verificado, sitio web oficial reclamado, fotos de platos,
 * horarios de atención y reseñas de clientes.
 */
export function getGoogleMapsPlaceUrl(name: string, destination: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${destination}`)}`;
}

/**
 * Enlace a TripAdvisor para restaurantes o actividades.
 */
export function getTripadvisorSearchUrl(name: string, destination: string): string {
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${name} ${destination}`)}`;
}

/**
 * Enlace a Civitatis para tours y excursiones con guías oficiales en español.
 */
export function getCivitatisTourUrl(tourName: string, destination: string): string {
  return `https://www.civitatis.com/es/buscar?q=${encodeURIComponent(`${tourName} ${destination}`)}`;
}

/**
 * Enlace a GetYourGuide para tickets y actividades guiadas.
 */
export function getGetYourGuideTourUrl(tourName: string, destination: string): string {
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(`${tourName} ${destination}`)}`;
}
