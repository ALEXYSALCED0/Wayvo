import React from 'react';
import { Event as PlanEvent } from '@wayvo/contracts';

interface EventDetailModalProps {
  event: PlanEvent | null;
  destination: string;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  destination,
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

  // Construcción dinámica de botones específicos (sin buscadores genéricos ni muros de login)
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
        url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotelName + ' ' + destination)}`,
        icon: 'hotel',
        color: 'bg-primary text-on-primary',
        badge: 'Reserva Directa',
      });
      links.push({
        label: `Ver Tarifas en Hoteles.com`,
        url: `https://es.hoteles.com/Hotel-Search?destination=${encodeURIComponent(hotelName + ' ' + destination)}`,
        icon: 'travel_explore',
        color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
      });
      return links;
    }

    // 2. VUELOS Y TRANSPORTE AÉREO (Página de la aerolínea directa, NO Google Flights)
    if (type === 'FLIGHT' || type === 'TRANSPORT') {
      const airline = details.airline || (event.title.includes('LATAM') ? 'LATAM Airlines' : 'Avianca');
      const airlineBookingUrl = details.airlineBookingUrl || (
        airline.toLowerCase().includes('latam')
          ? 'https://www.latamairlines.com/co/es/ofertas-vuelos'
          : airline.toLowerCase().includes('wingo')
          ? 'https://www.wingo.com/'
          : 'https://www.avianca.com/es/'
      );

      links.push({
        label: `Reservar Vuelo Directamente en ${airline}`,
        url: airlineBookingUrl,
        icon: 'flight_takeoff',
        color: 'bg-primary text-on-primary',
        badge: 'Web Oficial Aerolínea',
      });
      return links;
    }

    // 3. GASTRONOMÍA / RESTAURANTES
    if (type === 'MEAL') {
      const venue = details.venueName || (event.title.includes(':') ? event.title.split(':')[0].trim() : event.title);

      // Sitio web oficial si existe
      if (details.websiteUrl) {
        links.push({
          label: `Sitio Web Oficial de ${venue}`,
          url: details.websiteUrl,
          icon: 'language',
          color: 'bg-primary text-on-primary',
          badge: 'Sitio Web',
        });
      }

      // Perfil directo de Instagram (sin hashtags ni exploradores que pidan login)
      if (details.instagramUrl || details.instagramHandle) {
        const handle = details.instagramHandle ? details.instagramHandle.replace('@', '') : venue.toLowerCase().replace(/[^a-z0-9]/g, '');
        const igUrl = details.instagramUrl || `https://www.instagram.com/${handle}/`;
        links.push({
          label: `Perfil Oficial en Instagram (@${handle})`,
          url: igUrl,
          icon: 'photo_camera',
          color: 'bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary',
          badge: 'Instagram',
        });
      }

      // Reserva de mesa directa si existe
      if (details.directBookingUrl) {
        links.push({
          label: `Reservar Mesa en ${venue}`,
          url: details.directBookingUrl,
          icon: 'table_restaurant',
          color: 'bg-secondary text-on-secondary',
          badge: 'Reserva Online',
        });
      }

      // Ficha directa en Google Maps (fotos, cartas y reseñas)
      links.push({
        label: `Ver Carta y Ubicación en Google Maps`,
        url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue + ' ' + destination)}`,
        icon: 'location_on',
        color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
      });

      return links;
    }

    // 4. ACTIVIDADES, TOURS Y MUSEOS
    const actName = event.title;
    const operator = details.operatorName;

    // Boletería o checkout directo del tour
    if (details.directBookingUrl) {
      links.push({
        label: `Comprar Entradas / Reservar Tour Oficial`,
        url: details.directBookingUrl,
        icon: 'confirmation_number',
        color: 'bg-primary text-on-primary',
        badge: 'Tickets Oficiales',
      });
    }

    // Sitio web oficial del operador o museo
    if (details.websiteUrl) {
      links.push({
        label: `Sitio Web Oficial ${operator ? `(${operator})` : ''}`,
        url: details.websiteUrl,
        icon: 'language',
        color: 'bg-primary text-on-primary',
        badge: 'Página Oficial',
      });
    }

    // Perfil directo en Instagram del operador o atracción
    if (details.instagramUrl || details.instagramHandle) {
      const handle = details.instagramHandle ? details.instagramHandle.replace('@', '') : (operator || actName).toLowerCase().replace(/[^a-z0-9]/g, '');
      const igUrl = details.instagramUrl || `https://www.instagram.com/${handle}/`;
      links.push({
        label: `Instagram Oficial (@${handle})`,
        url: igUrl,
        icon: 'photo_camera',
        color: 'bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary',
        badge: 'Instagram',
      });
    }

    // Ubicación en Google Maps
    links.push({
      label: `Ver en Google Maps`,
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(actName + ' ' + destination)}`,
      icon: 'location_on',
      color: 'bg-surface-container hover:bg-secondary-fixed text-primary',
    });

    return links;
  };

  const actionLinks = getActionLinks();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
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

          {/* Enlaces directos para reservar y redes sociales específicas */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2.5">
            <span className="font-bold text-primary text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">link</span>
              Canales Oficiales y Acceso Directo
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
    </div>
  );
};
