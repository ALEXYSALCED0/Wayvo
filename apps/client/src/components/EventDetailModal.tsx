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
    if (!val) return 'Incluido en el paquete';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getIcon = () => {
    const type = (event as any).type;
    if (type === 'FLIGHT' || type === 'TRANSPORT') return 'flight';
    if (type === 'HOTEL' || type === 'ACCOMMODATION') return 'hotel';
    if (type === 'MEAL') return 'restaurant';
    return 'local_activity';
  };

  const getCategoryLabel = () => {
    const type = (event as any).type;
    if (type === 'FLIGHT' || type === 'TRANSPORT') return 'Transporte Aéreo / Terrestre';
    if (type === 'HOTEL' || type === 'ACCOMMODATION') return 'Alojamiento & Hospitalidad';
    if (type === 'MEAL') return 'Experiencia Gastronómica';
    return 'Actividad / Tour Guiado';
  };

  const titleRaw = event.title || 'experiencia';
  const tagSafe = titleRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
  const type = (event as any).type;

  // Enlaces directos según tipo: Booking.com, Hoteles.com, Web oficial o Redes Sociales (Instagram / Maps / TripAdvisor)
  const getActionLinks = () => {
    if (type === 'HOTEL' || type === 'ACCOMMODATION') {
      return [
        {
          label: 'Reservar en Booking.com',
          url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(titleRaw + ' ' + destination)}`,
          icon: 'hotel',
          color: 'bg-primary text-on-primary',
        },
        {
          label: 'Ver en Hoteles.com',
          url: `https://www.hoteles.com/Hotel-Search?destination=${encodeURIComponent(titleRaw + ' ' + destination)}`,
          icon: 'travel_explore',
          color: 'bg-surface-container text-primary',
        },
        {
          label: 'Ver en Google Travel Hotels',
          url: `https://www.google.com/travel/hotels/${encodeURIComponent(destination)}`,
          icon: 'open_in_new',
          color: 'bg-surface-container text-primary',
        },
      ];
    }

    if (type === 'FLIGHT' || type === 'TRANSPORT') {
      return [
        {
          label: 'Buscar Vuelo en Google Flights',
          url: `https://www.google.com/travel/flights?q=vuelos+a+${encodeURIComponent(destination)}`,
          icon: 'flight_takeoff',
          color: 'bg-primary text-on-primary',
        },
        {
          label: 'Comparar en Skyscanner',
          url: `https://www.skyscanner.net/transport/flights/`,
          icon: 'travel_explore',
          color: 'bg-surface-container text-primary',
        },
      ];
    }

    if (type === 'MEAL') {
      return [
        {
          label: 'Menú y Reseñas en Google Maps',
          url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(titleRaw + ' ' + destination)}`,
          icon: 'restaurant',
          color: 'bg-primary text-on-primary',
        },
        {
          label: 'Ver en Instagram / Redes Sociales',
          url: `https://www.instagram.com/explore/tags/${tagSafe}/`,
          icon: 'photo_camera',
          color: 'bg-secondary-fixed text-on-secondary-fixed',
        },
        {
          label: 'Ficha en TripAdvisor',
          url: `https://www.tripadvisor.co/Search?q=${encodeURIComponent(titleRaw + ' ' + destination)}`,
          icon: 'reviews',
          color: 'bg-surface-container text-primary',
        },
      ];
    }

    // Actividades, Tours y Museos
    return [
      {
        label: 'Sitio Web Oficial & Entradas',
        url: `https://www.google.com/search?q=${encodeURIComponent(titleRaw + ' ' + destination + ' sitio web oficial entradas tickets')}`,
        icon: 'confirmation_number',
        color: 'bg-primary text-on-primary',
      },
      {
        label: 'Ver en Instagram / Redes Sociales',
        url: `https://www.instagram.com/explore/tags/${tagSafe}/`,
        icon: 'photo_camera',
        color: 'bg-secondary-fixed text-on-secondary-fixed',
      },
      {
        label: 'Ver Tours en TripAdvisor / Viator',
        url: `https://www.tripadvisor.co/Search?q=${encodeURIComponent(titleRaw + ' ' + destination)}`,
        icon: 'reviews',
        color: 'bg-surface-container text-primary',
      },
    ];
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
          {/* Main Description */}
          <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/20">
            <span className="font-bold text-primary block mb-1">Descripción:</span>
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
                Costo
              </span>
              <span className="font-mono font-bold text-primary">
                {formatCOP(event.details?.price)}
              </span>
            </div>

            {/* Operador */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">business</span>
                Operador Verificado
              </span>
              <span className="font-semibold text-primary truncate">
                {event.details?.provider || 'Wayvo Verified Partners'}
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

          {/* Enlaces directos para reservar y redes sociales */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2.5">
            <span className="font-bold text-primary text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">link</span>
              Enlaces Directos de Reserva y Redes Oficiales
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
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              ))}
            </div>
          </div>

          {/* Notes & Tips */}
          {event.details?.notes && (
            <div className="p-3.5 rounded-xl bg-secondary-fixed/30 border border-secondary/30 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">tips_and_updates</span>
              <div>
                <span className="font-bold text-primary block mb-0.5">Recomendaciones para el Viajero:</span>
                <p className="text-on-surface-variant leading-relaxed">
                  {event.details.notes}
                </p>
              </div>
            </div>
          )}

          {/* Voucher and Check-in Info */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">confirmation_number</span>
              <div>
                <span className="font-bold text-primary block">Localizador Wayvo</span>
                <span className="text-[11px] text-on-surface-variant">Presentar digitalmente</span>
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
