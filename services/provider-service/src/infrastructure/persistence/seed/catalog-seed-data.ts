import { flightNumbersFor, hotelCodesFor } from '../../mock/mock-inventory';
import { ProviderType } from '../../../domain/value-objects/provider-type';
import { ServiceOfferType } from '../../../domain/value-objects/service-offer-type';
import { VerificationStatus } from '../../../domain/value-objects/verification-status';

// Catálogo precargado de proveedores turísticos ficticios
// - Las ofertas de transporte y alojamiento llevan en `metadata` los datos con los que los adapters
//   buscan en la API externa. Usan los números de vuelo y códigos de hotel del simulador
//   Con las APIs reales hay que poner allí un número de vuelo o un id de hotel real.

export interface SeedProvider {
  id: string;
  name: string;
  type: ProviderType;
  contactEmail: string;
  contactPhone?: string;
  rating?: number;
  websiteUrl?: string;
  status: VerificationStatus;
  rejectionReason?: string;
}

export interface SeedOffer {
  id: string;
  providerId: string;
  type: ServiceOfferType;
  title: string;
  description: string;
  unitPrice: number;
  currency: string;
  availableCapacity: number;
  active?: boolean;
  metadata: Record<string, unknown>;
}

export const SEED_PROVIDERS: SeedProvider[] = [
  {
    id: 'prov-aerocaribe',
    name: 'AeroCaribe',
    type: ProviderType.TRANSPORT,
    contactEmail: 'reservas@aerocaribe.example.com',
    contactPhone: '+57 601 555 0101',
    rating: 4.5,
    websiteUrl: 'https://aerocaribe.example.com',
    status: VerificationStatus.VERIFIED,
  },
  {
    id: 'prov-andes-air',
    name: 'Andes Air',
    type: ProviderType.TRANSPORT,
    contactEmail: 'ventas@andesair.example.com',
    contactPhone: '+57 604 555 0102',
    rating: 4.2,
    websiteUrl: 'https://andesair.example.com',
    status: VerificationStatus.VERIFIED,
  },
  {
    id: 'prov-hotel-colonial',
    name: 'Hotel Colonial Cartagena',
    type: ProviderType.ACCOMMODATION,
    contactEmail: 'reservas@hotelcolonial.example.com',
    contactPhone: '+57 605 555 0103',
    rating: 4.7,
    websiteUrl: 'https://hotelcolonial.example.com',
    status: VerificationStatus.VERIFIED,
  },
  {
    id: 'prov-casas-del-mar',
    name: 'Casas del Mar Inmobiliaria',
    type: ProviderType.ACCOMMODATION,
    contactEmail: 'alquileres@casasdelmar.example.com',
    contactPhone: '+57 300 555 0104',
    rating: 4.4,
    status: VerificationStatus.VERIFIED,
  },
  {
    id: 'prov-ruta-cafetera',
    name: 'Ruta Cafetera Tours',
    type: ProviderType.ACTIVITY,
    contactEmail: 'info@rutacafetera.example.com',
    contactPhone: '+57 606 555 0105',
    rating: 4.8,
    status: VerificationStatus.VERIFIED,
  },
  {
    id: 'prov-guias-cartagena',
    name: 'Guías Cartagena Histórica',
    type: ProviderType.TOUR_GUIDE,
    contactEmail: 'guias@cartagenahistorica.example.com',
    rating: 4.6,
    status: VerificationStatus.VERIFIED,
  },
  {
    id: 'prov-brisas-hostal',
    name: 'Hostal Brisas del Tayrona',
    type: ProviderType.ACCOMMODATION,
    contactEmail: 'contacto@brisastayrona.example.com',
    status: VerificationStatus.PENDING,
  },
  {
    id: 'prov-transportes-express',
    name: 'Transportes Express del Norte',
    type: ProviderType.TRANSPORT,
    contactEmail: 'operaciones@expressnorte.example.com',
    status: VerificationStatus.REJECTED,
    rejectionReason: 'Licencia de operación vencida',
  },
];

const addDays = (date: Date, days: number): string => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function buildSeedOffers(now: Date = new Date()): SeedOffer[] {
  const departureDate = addDays(now, 60);
  const checkInDate = addDays(now, 60);
  const checkOutDate = addDays(now, 63);

  const [bogCtgMorning, , bogCtgNight] = flightNumbersFor('BOG', 'CTG');
  const [bogMdeMorning, bogMdeAfternoon] = flightNumbersFor('BOG', 'MDE');
  const [ctgHotel1, ctgHotel2, ctgHotel3] = hotelCodesFor('Cartagena');
  const [smrHotel1] = hotelCodesFor('Santa Marta');

  const flight = (
    id: string, providerId: string, title: string, description: string,
    unitPrice: number, availableCapacity: number, originAirport: string,
    destinationAirport: string, flightNumber: string,
  ): SeedOffer => ({
    id, providerId, type: ServiceOfferType.TRANSPORT, title, description, unitPrice,
    currency: 'COP', availableCapacity,
    metadata: { originAirport, destinationAirport, departureDate, flightNumber },
  });

  const stay = (
    id: string, providerId: string, title: string, description: string,
    unitPrice: number, availableCapacity: number, cityCode: string, hotelCode: string,
    roomType: string,
  ): SeedOffer => ({
    id, providerId, type: ServiceOfferType.ACCOMMODATION, title, description, unitPrice,
    currency: 'COP', availableCapacity,
    metadata: { cityCode, hotelCode, checkInDate, checkOutDate, roomType },
  });

  return [
    flight('offer-aerocaribe-bog-ctg-am', 'prov-aerocaribe', 'Bogotá - Cartagena (mañana)',
      'Vuelo directo, 1h 30m, salida 06:30', 320_000, 30, 'BOG', 'CTG', bogCtgMorning),
    flight('offer-aerocaribe-bog-ctg-pm', 'prov-aerocaribe', 'Bogotá - Cartagena (noche, últimos cupos)',
      'Vuelo directo, 1h 30m, salida 19:45', 290_000, 2, 'BOG', 'CTG', bogCtgNight),
    flight('offer-andes-bog-mde-am', 'prov-andes-air', 'Bogotá - Medellín (mañana)',
      'Vuelo directo, 1h 05m, salida 06:30', 210_000, 30, 'BOG', 'MDE', bogMdeMorning),
    flight('offer-andes-bog-mde-pm', 'prov-andes-air', 'Bogotá - Medellín (tarde)',
      'Vuelo directo, 1h 05m, salida 13:00', 235_000, 8, 'BOG', 'MDE', bogMdeAfternoon),

    stay('offer-colonial-standard', 'prov-hotel-colonial', 'Habitación estándar en el Centro Histórico',
      'Habitación doble con desayuno, por noche', 420_000, 12, 'Cartagena', ctgHotel1, 'standard'),
    stay('offer-colonial-suite', 'prov-hotel-colonial', 'Suite con vista al mar',
      'Suite con balcón y desayuno, por noche', 780_000, 5, 'Cartagena', ctgHotel2, 'suite'),
    stay('offer-casasdelmar-ctg-penthouse', 'prov-casas-del-mar', 'Penthouse en Bocagrande (última unidad)',
      'Apartamento para 4 personas frente al mar, por noche', 950_000, 1, 'Cartagena', ctgHotel3, 'apartment'),
    stay('offer-casasdelmar-smr-apto', 'prov-casas-del-mar', 'Apartamento en El Rodadero',
      'Apartamento para 4 personas, por noche', 360_000, 12, 'Santa Marta', smrHotel1, 'apartment'),

    {
      id: 'offer-cafetera-finca', providerId: 'prov-ruta-cafetera', type: ServiceOfferType.ACTIVITY,
      title: 'Tour cafetero con almuerzo', description: 'Recorrido por finca cafetera, 5 horas, por persona',
      unitPrice: 130_000, currency: 'COP', availableCapacity: 20, metadata: {},
    },
    {
      id: 'offer-guia-ciudad-amurallada', providerId: 'prov-guias-cartagena', type: ServiceOfferType.ACTIVITY,
      title: 'Guía por la Ciudad Amurallada', description: 'Recorrido a pie de 3 horas, por persona',
      unitPrice: 85_000, currency: 'COP', availableCapacity: 15, metadata: {},
    },
  ];
}
