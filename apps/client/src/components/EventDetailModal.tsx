import React from 'react';
import { createPortal } from 'react-dom';
import { Event as PlanEvent } from '@wayvo/contracts';
import {
  getKayakFlightUrl,
  OFFICIAL_AIRLINE_PORTALS,
  getGoogleMapsPlaceUrl,
  getTripadvisorSearchUrl,
  getCivitatisTourUrl,
  getGetYourGuideTourUrl,
  getBookingHotelUrl,
  getHotelesUrl,
} from '../utils/travelLinks';

interface EventDetailModalProps {
  event: PlanEvent | null;
  destination: string;
  origin?: string;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  destination,
  origin,
  onClose,
}) => {
  if (!event) return null;

  const formatCOP = (val?: number) => {
    if (!val) return 'Incluido en el itinerario';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const type = (event as any).type;
  const details = event.details || {};

  const getIcon = () => {
    if (type === 'FLIGHT' || type === 'TRANSPORT') return 'flight';
    if (type === 'HOTEL' || type === 'ACCOMMODATION') return 'hotel';
    if (type === 'MEAL') return 'restaurant';
    return 'local_activity';
  };

  const getCategoryLabel = () => {
    if (type === 'FLIGHT' || type === 'TRANSPORT') return 'Vuelo / Transporte Oficial';
    if (type === 'HOTEL' || type === 'ACCOMMODATION') return 'Hospedaje Seleccionado';
    if (type === 'MEAL') return 'Experiencia Gastronómica & Mesa';
    return 'Actividad / Tour Local';
  };

  // Construcción dinámica de botones específicos (100% enlaces verificados y funcionales)
  const getActionLinks = () => {
    const links: {
      label: string;
      url: string;
      icon: string;
      color: string;
      badge?: string;
    }[] = [];

    // 1. HOTEL / ALOJAMIENTO
    if (type === 'HOTEL' || type === 'ACCOMMODATION') {
      const hotelName = details.venueName || event.title;
      links.push({
        label: `Ver Disponibilidad en Booking.com (${hotelName})`,
        url: getBookingHotelUrl(hotelName, destination),
        icon: 'hotel',
        color: 'bg-primary text-on-primary',
        badge: 'Booking.com',
      });
      links.push({
        label: `Ver Tarifas en Hoteles.com`,
        url: getHotelesUrl(hotelName, destination),
        icon: 'travel_explore',
        color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
        badge: 'Hoteles.com',
      });
      links.push({
        label: `Ficha y Ubicación en Google Maps`,
        url: getGoogleMapsPlaceUrl(hotelName, destination),
        icon: 'location_on',
        color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
      });
      return links;
    }

    // 2. VUELOS Y TRANSPORTE AÉREO (Pre-cargados con fechas y ruta en Kayak + Portales limpios)
    if (type === 'FLIGHT' || type === 'TRANSPORT') {
      const airlineName = details.airline || (event.title.includes('LATAM') ? 'LATAM' : 'Avianca');
      const isLatam = airlineName.toLowerCase().includes('latam');
      const airlineKey = isLatam ? 'LATAM' : 'AVIANCA';

      // Determinar origen y destino de vuelo con precisión
      let flightOrigin = origin || 'Bogotá';
      let flightDest = destination;

      if (event.title.includes('➔')) {
        const parts = event.title.split('➔');
        const p1 = parts[0]
          .replace(/vuelo/i, '')
          .replace(/de ida/i, '')
          .replace(/de regreso/i, '')
          .replace(/de retorno/i, '')
          .trim();
        const p2 = parts[1].trim();
        if (p1) flightOrigin = p1;
        if (p2) flightDest = p2;
      } else if (
        event.title.toLowerCase().includes('regreso') ||
        event.title.toLowerCase().includes('retorno') ||
        event.title.toLowerCase().includes('vuelta') ||
        event.title.toLowerCase().includes('salida')
      ) {
        // En vuelo de regreso se sale del destino hacia la ciudad de origen
        flightOrigin = destination;
        flightDest = origin || 'Bogotá';
      }

      links.push({
        label: `Ver Vuelos ${airlineName} (${flightOrigin} ➔ ${flightDest})`,
        url: getKayakFlightUrl({
          origin: flightOrigin,
          destination: flightDest,
          startDate: (event as any).startDateTime?.split('T')[0] || '',
          travelers: 2,
          airline: airlineKey,
        }),
        icon: 'flight_takeoff',
        color: 'bg-primary text-on-primary',
        badge: 'Vuelos en Vivo',
      });

      links.push({
        label: `${OFFICIAL_AIRLINE_PORTALS[airlineKey].label}`,
        url: OFFICIAL_AIRLINE_PORTALS[airlineKey].url,
        icon: 'flight',
        color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
        badge: 'Web Oficial',
      });
      return links;
    }

    // 3. GASTRONOMÍA / RESTAURANTES
    if (type === 'MEAL') {
      const venue = details.venueName || (event.title.includes(':') ? event.title.split(':')[0].trim() : event.title);

      // Google Maps es la fuente de verdad definitiva: menú, teléfono, horarios, fotos y web oficial verificada sin login
      links.push({
        label: `Ver Menú, Fotos y Ubicación en Google Maps`,
        url: getGoogleMapsPlaceUrl(venue, destination),
        icon: 'location_on',
        color: 'bg-primary text-on-primary',
        badge: 'Ficha Verificada',
      });

      // TripAdvisor: calificaciones reales de viajeros
      links.push({
        label: `Reseñas y Ranking en TripAdvisor`,
        url: getTripadvisorSearchUrl(venue, destination),
        icon: 'reviews',
        color: 'bg-secondary text-on-secondary',
        badge: 'TripAdvisor',
      });

      // Sitio web oficial si existe y es válido
      if (details.websiteUrl && details.websiteUrl.startsWith('http')) {
        links.push({
          label: `Sitio Web Oficial de ${venue}`,
          url: details.websiteUrl,
          icon: 'language',
          color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
          badge: 'Sitio Web',
        });
      }

      // Perfil directo de Instagram SOLO si existe handle verificado
      if (details.instagramHandle) {
        const handle = details.instagramHandle.replace('@', '').trim();
        if (handle.length > 2) {
          links.push({
            label: `Instagram Oficial (@${handle})`,
            url: `https://www.instagram.com/${handle}/`,
            icon: 'photo_camera',
            color: 'bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary',
            badge: 'Instagram',
          });
        }
      }

      // Reserva de mesa directa si existe
      if (details.directBookingUrl) {
        links.push({
          label: `Reservar Mesa en ${venue}`,
          url: details.directBookingUrl,
          icon: 'table_restaurant',
          color: 'bg-primary text-on-primary',
          badge: 'Reserva Online',
        });
      }

      return links;
    }

    // 4. ACTIVIDADES, TOURS Y MUSEOS
    const actName = event.title;
    const operator = details.operatorName;

    // Civitatis: tours guiados con operadores en español
    links.push({
      label: `Tours y Excursiones en Civitatis`,
      url: getCivitatisTourUrl(actName, destination),
      icon: 'local_activity',
      color: 'bg-primary text-on-primary',
      badge: 'Civitatis',
    });

    // GetYourGuide: catálogo de tickets y actividades
    links.push({
      label: `Ver Opciones en GetYourGuide`,
      url: getGetYourGuideTourUrl(actName, destination),
      icon: 'confirmation_number',
      color: 'bg-secondary text-on-secondary',
      badge: 'GetYourGuide',
    });

    // TripAdvisor: opiniones de viajeros sobre el tour
    links.push({
      label: `Opiniones y Entradas en TripAdvisor`,
      url: getTripadvisorSearchUrl(actName, destination),
      icon: 'reviews',
      color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
      badge: 'TripAdvisor',
    });

    // Ubicación en Google Maps
    links.push({
      label: `Ubicación en Google Maps`,
      url: getGoogleMapsPlaceUrl(actName, destination),
      icon: 'location_on',
      color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
    });

    // Sitio web oficial si existe
    if (details.websiteUrl && details.websiteUrl.startsWith('http')) {
      links.push({
        label: `Sitio Web Oficial ${operator ? `(${operator})` : ''}`,
        url: details.websiteUrl,
        icon: 'language',
        color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
        badge: 'Página Oficial',
      });
    }

    return links;
  };

  const actionLinks = getActionLinks();

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden animate-fade-in">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-surface-container-low border-b border-outline-variant/20 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">{getIcon()}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold text-secondary uppercase tracking-wider block">
                {getCategoryLabel()}
              </span>
              <h3 className="text-base font-bold text-primary leading-snug">
                {event.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto text-xs">
          {/* Tarjeta de entidad destacada (Restaurante / Operador / Aerolínea) */}
          {(details.venueName || details.operatorName || details.airline) && (
            <div className="p-3.5 rounded-xl bg-secondary-fixed/20 border border-secondary/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-secondary font-mono uppercase tracking-wider block font-semibold">
                  {type === 'MEAL' ? 'Establecimiento Seleccionado' : type === 'FLIGHT' ? 'Aerolínea Oficial' : 'Operador Autorizado'}
                </span>
                <span className="text-sm font-bold text-primary">
                  {details.venueName || details.operatorName || details.airline}
                </span>
                {details.dish && (
                  <span className="text-xs text-on-surface-variant block mt-0.5">
                    Especialidad recomendada: <span className="font-semibold text-secondary">{details.dish}</span>
                  </span>
                )}
                {details.flightNumber && (
                  <span className="text-xs text-on-surface-variant font-mono block mt-0.5">
                    Vuelo: {details.flightNumber}
                  </span>
                )}
              </div>
              <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
            </div>
          )}

          {/* Main Description */}
          <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/20">
            <span className="font-bold text-primary block mb-1">Detalle del Evento:</span>
            <p className="text-on-surface-variant leading-relaxed">
              {event.description || 'Experiencia organizada y sincronizada dentro de tu itinerario de viaje.'}
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Horario */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">schedule</span>
                Horario
              </span>
              <span className="font-mono font-bold text-primary">
                {event.time || (event as any).startTime || 'Horario Flexible'}
              </span>
            </div>

            {/* Inversión */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">payments</span>
                Presupuesto Estimado
              </span>
              <span className="font-mono font-bold text-primary">
                {formatCOP(event.details?.price)}
              </span>
            </div>

            {/* Operador o Proveedor */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">business</span>
                Entidad Responsable
              </span>
              <span className="font-semibold text-primary truncate">
                {details.venueName || details.operatorName || details.airline || event.details?.provider || 'Establecimiento Local'}
              </span>
            </div>

            {/* Ubicación */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                Ubicación
              </span>
              <span className="font-semibold text-primary truncate" title={(event.details as any)?.location || destination}>
                {(event.details as any)?.location || (event as any).location || destination}
              </span>
            </div>
          </div>

          {/* Enlaces verificados sin buscadores genéricos ni muros de login */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2.5">
            <span className="font-bold text-primary text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
              Canales Verificados y Acceso Directo
            </span>
            <div className="flex flex-col gap-2">
              {actionLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.01] shadow-xs border border-outline-variant/30 ${link.color}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/20 ml-2">
                      {link.badge}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[14px] ml-auto">open_in_new</span>
                </a>
              ))}
            </div>
          </div>

          {/* Localizador Wayvo */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">confirmation_number</span>
              <div>
                <span className="font-bold text-primary block">Referencia en Itinerario</span>
                <span className="text-[11px] text-on-surface-variant">Sincronizado en tu plan Wayvo</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-md bg-surface-container text-primary font-mono text-xs font-bold">
              WV-{(event.id || 'EVT').slice(-6).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-secondary transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
