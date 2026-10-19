import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import { AlternativeOption, Trip } from '@wayvo/contracts';

interface IncidentModalProps {
  tripId: string;
  event: any;
  destination: string;
  surroundingItinerary?: any[];
  onClose: () => void;
  onAlternativeApplied?: (updatedTrip: Trip) => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  tripId,
  event,
  destination,
  surroundingItinerary = [],
  onClose,
  onAlternativeApplied,
}) => {
  const { setActiveTrip, activeTrip, appMode } = useApp();

  const [incidentType, setIncidentType] = useState('MISSED');
  const [userReason, setUserReason] = useState('Perdí el transporte programado en este horario');
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeOption[]>([]);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);

  // Consulta dinámica al agente de IA
  const handleQueryAI = async () => {
    setIsLoadingAlternatives(true);
    try {
      const response = await WayvoApi.resolveIncidentAI({
        tripId,
        eventId: event.id,
        destination: destination || 'Destino',
        eventTitle: event.title,
        eventType: event.type,
        time: event.time,
        incidentType,
        userReason,
        surroundingItinerary: surroundingItinerary.map((e) => ({
          title: e.title,
          time: e.time,
          type: e.type,
        })),
      });

      if (response && response.alternatives && response.alternatives.length > 0) {
        setAiDiagnosis(response.aiDiagnosis);
        setAlternatives(response.alternatives);
        const recommended = response.alternatives.find((a) => a.isRecommended);
        setSelectedAlternativeId(recommended ? recommended.id : response.alternatives[0].id);
      }
    } catch (err: any) {
      alert(`No se pudieron generar alternativas dinámicas: ${err.message}`);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  // Aplicar alternativa seleccionada al itinerario
  const handleApplyAlternative = async (altId: string) => {
    if (!altId) return;
    setIsApplying(true);

    const chosenAlt = alternatives.find((a) => a.id === altId);
    const replacementTitle = chosenAlt?.title || 'Actividad alternativa propuesta por IA';
    const replacementDescription = chosenAlt?.description || 'Alternativa seleccionada tras reportar eventualidad.';

    try {
      const rawEventsToInject = (chosenAlt?.newEventsToInject && chosenAlt.newEventsToInject.length > 0)
        ? chosenAlt.newEventsToInject
        : [
            {
              title: replacementTitle,
              description: replacementDescription,
              time: chosenAlt?.timeImpact || event.time || 'Horario Flexible',
              type: (chosenAlt?.type || 'ACTIVITY').toUpperCase(),
              typeLabel: chosenAlt?.typeLabel || 'Sustituto IA',
              location: destination,
            },
          ];

      const newEventsFromAI = rawEventsToInject.map((ne: any, idx: number) => ({
        id: `ai-rep-${Date.now()}-${idx}`,
        tripId: activeTrip?.id || tripId,
        type: ne.type || 'ACTIVITY',
        typeLabel: ne.typeLabel || 'Sustituto IA',
        title: ne.title || replacementTitle,
        description: ne.description || replacementDescription,
        location: ne.location || destination,
        time: ne.time || event.time || 'Horario Flexible',
        startDateTime: event.startDateTime || new Date().toISOString(),
        endDateTime: event.endDateTime,
        status: 'PENDING',
        reservationStatus: 'CONFIRMED',
        order: (event.order || 0) + idx + 0.5,
        isAlternative: true,
        alternativeBadge: 'Sustituto IA',
        replacesEventId: event.id,
        replacesEventTitle: event.title,
      }));

      // 1. Construir estado local donde el evento original queda CANCELADO
      // y la alternativa seleccionada entra inmediatamente después
      const updatedEvents = (activeTrip?.events || []).flatMap((e: any) => {
        if (e.id === event.id) {
          const cancelledOriginal = {
            ...e,
            status: 'CANCELLED',
            issueReason: userReason || 'Evento cancelado por eventualidad reportada',
            replacedByTitle: replacementTitle,
            replacedById: newEventsFromAI[0]?.id,
          };
          return [cancelledOriginal, ...newEventsFromAI];
        }
        return [e];
      });

      let updatedTripData: any = {
        ...(activeTrip || {}),
        events: updatedEvents,
      };

      // 2. Intentar persistir en el microservicio backend
      try {
        const backendRes = await WayvoApi.resolveIncidentItinerary(tripId, {
          eventId: event.id,
          reason: userReason || 'Evento cancelado por eventualidad reportada',
          replacedByTitle: replacementTitle,
          newEvents: newEventsFromAI,
        });
        if (backendRes && backendRes.events && backendRes.events.length > 0) {
          updatedTripData = backendRes;
        }
      } catch (backendErr) {
        // En caso de modo mock o error de red, el estado local ya está correctamente orquestado
        console.warn('[IncidentModal] Persistencia en backend trip-service en fallback local:', backendErr);
      }

      setActiveTrip(updatedTripData);
      if (onAlternativeApplied) {
        onAlternativeApplied(updatedTripData);
      }

      onClose();
    } catch (err: any) {
      alert(`Error al aplicar la alternativa: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-primary/60 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/30">
        
        {/* 1. Header */}
        <div className="bg-primary text-on-primary p-6 md:p-8 flex flex-col gap-2 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
                <span>RESOLUCIÓN REACTIVA DINÁMICA CON IA</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container font-mono text-xs font-semibold">
                EVENTO #{event.id}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-on-primary flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="mt-2">
            <h2 className="text-xl md:text-2xl font-bold text-on-primary tracking-tight">
              Ajuste Inmediato de Itinerario con Inteligencia Artificial
            </h2>
            <p className="text-xs md:text-sm text-secondary-fixed mt-1">
              Evento actual: <strong>{event.title}</strong> ({event.time}) en {destination}.
            </p>
          </div>
        </div>

        {/* 2. Body */}
        <div className="p-6 md:p-8 flex flex-col gap-6 bg-surface-container-low/30 max-h-[75vh] overflow-y-auto">
          
          {/* Formulario para reportar eventualidad */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <span className="material-symbols-outlined text-secondary text-[20px]">report_problem</span>
              <span>1. Indica la eventualidad ocurrida:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Tipo de Disrupción
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs font-medium text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="MISSED">Pérdida de transporte (tren, vuelo, bus, etc.)</option>
                  <option value="CANCELLED">Cancelación por clima / fuerza mayor</option>
                  <option value="UNAVAILABLE">Lugar cerrado / no disponible</option>
                  <option value="USER_CHANGED_PLAN">Cambio de plan voluntario / fatiga</option>
                  <option value="CUSTOM">Otro imprevisto</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Detalle de lo ocurrido
                </label>
                <input
                  type="text"
                  value={userReason}
                  onChange={(e) => setUserReason(e.target.value)}
                  placeholder="Ej: Perdí el último tren de las 6pm, llovió muy fuerte..."
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs font-medium text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            <button
              onClick={handleQueryAI}
              disabled={isLoadingAlternatives}
              className="py-3 px-4 rounded-xl bg-secondary hover:bg-primary text-on-primary text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              {isLoadingAlternatives ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span>Razonando y calculando alternativas en tiempo real con IA...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>{alternatives.length > 0 ? 'Volver a Consultar a Wayvo AI' : 'Consultar Alternativas Dinámicas a Wayvo AI'}</span>
                </>
              )}
            </button>
          </div>

          {/* Diagnóstico de la IA si ya se consultó */}
          {aiDiagnosis && (
            <div className="p-4 rounded-xl bg-secondary-fixed/30 border border-secondary/30 flex items-start gap-3 shadow-sm animate-fade-in">
              <span className="material-symbols-outlined text-secondary text-[24px] flex-shrink-0">smart_toy</span>
              <div>
                <span className="text-xs font-bold text-primary block mb-0.5">Diagnóstico & Estrategia Wayvo AI:</span>
                <p className="text-xs text-on-surface leading-relaxed">{aiDiagnosis}</p>
              </div>
            </div>
          )}

          {/* Alternativas Generadas por la IA */}
          {alternatives.length > 0 && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                2. Selecciona la alternativa calculada para tu itinerario:
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {alternatives.map((alt) => {
                  const isSelected = selectedAlternativeId === alt.id;
                  return (
                    <div
                      key={alt.id}
                      onClick={() => setSelectedAlternativeId(alt.id)}
                      className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col gap-3 ${
                        isSelected
                          ? 'border-secondary bg-secondary-fixed/20 shadow-md ring-2 ring-secondary/30'
                          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-secondary/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="ai-alternative"
                            checked={isSelected}
                            onChange={() => setSelectedAlternativeId(alt.id)}
                            className="accent-secondary h-4 w-4"
                          />
                          <h4 className="text-sm font-bold text-primary">{alt.title}</h4>
                        </div>
                        {alt.isRecommended && (
                          <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-mono text-[10px] font-bold">
                            RECOMENDADA
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-on-surface-variant leading-relaxed pl-6">
                        {alt.description}
                      </p>

                      {/* Eventos a inyectar */}
                      {alt.newEventsToInject && alt.newEventsToInject.length > 0 && (
                        <div className="pl-6 pt-2 border-t border-outline-variant/20 flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold text-secondary">
                            Eventos que se inyectarán en la agenda:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {alt.newEventsToInject.map((ne, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-surface-container text-primary text-[11px] font-medium flex items-center gap-1 border border-outline-variant/20"
                              >
                                <span className="material-symbols-outlined text-[13px] text-secondary">add_circle</span>
                                <strong>{ne.time}:</strong> {ne.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pl-6 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                        <span className="font-mono text-secondary font-semibold">
                          Impacto: {alt.timeImpact || 'Tiempo ajustado'}
                        </span>
                        <span className="font-mono font-bold text-primary">
                          {alt.costDifference || '$0 COP'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30 flex-wrap gap-4 mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            >
              Cerrar sin Cambios
            </button>
            <button
              onClick={() => handleApplyAlternative(selectedAlternativeId)}
              disabled={isApplying || alternatives.length === 0}
              className="px-6 py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  <span>Inyectando Cambios en Itinerario...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Aplicar Solución y Actualizar Itinerario</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
