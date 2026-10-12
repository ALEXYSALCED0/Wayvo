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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col">
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
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh] text-xs">
          {/* Main Description */}
          <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/20">
            <span className="font-bold text-primary block mb-1">Descripción de la Experiencia:</span>
            <p className="text-on-surface-variant leading-relaxed">
              {event.description || 'Detalle reservado y coordinado por el motor de inteligencia de Wayvo.'}
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Horario */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">schedule</span>
                Horario Asignado
              </span>
              <span className="font-mono font-bold text-primary">
                {event.time || (event as any).startTime || 'Horario Flexible'}
              </span>
            </div>

            {/* Inversión */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">payments</span>
                Costo Estimado
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
              <span className="font-semibold text-primary">
                {event.details?.provider || 'Wayvo Curated Partners'}
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
            className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-secondary transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
