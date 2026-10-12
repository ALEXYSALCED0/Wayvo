import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';

interface IncidentModalProps {
  tripId: string;
  onClose: () => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({ tripId, onClose }) => {
  const { setActiveTrip, activeTrip } = useApp();

  const [incidentType, setIncidentType] = useState('FLIGHT_DELAY');
  const [description, setDescription] = useState('Oleaje anómalo en bahía. Restricción preventiva de DIMAR.');
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
  const [incidentReported, setIncidentReported] = useState(true);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState('alt-1');
  const [isApplying, setIsApplying] = useState(false);

  const alternatives = [
    {
      id: 'alt-1',
      title: 'Tour Cultural & Cata de Ron en Getsemaní',
      provider: 'Guías Cartagena Histórica',
      timeImpact: '+0 min de retraso',
      costDifference: '$0 COP (Cobertura total)',
      compatibility: '98%',
      isRecommended: true,
      description: 'Experiencia inmersiva en el barrio Getsemaní con maridaje caribeño, sin alterar la reserva nocturna en Celele.',
    },
    {
      id: 'alt-2',
      title: 'Pasadía Terrestre en Isla Barú (Punta Iguana)',
      provider: 'Transportes Express del Norte',
      timeImpact: '+45 min de traslado',
      costDifference: '+$65,000 COP',
      compatibility: '84%',
      isRecommended: false,
      description: 'Traslado terrestre privado hasta playa continental asegurando regreso antes de las 18:00 COT.',
    },
  ];

  const handleApplyAlternative = async (altId: string) => {
    setIsApplying(true);
    try {
      await WayvoApi.selectAlternative(tripId, {
        eventId: 'evt-3',
        alternativeId: altId,
      });

      // Update activeTrip state to reflect resolution
      if (activeTrip) {
        const updatedEvents = (activeTrip.events || []).map((e: any) => {
          if (e.id === 'evt-3' || e.status === 'DISRUPTED') {
            return {
              ...e,
              title: altId === 'alt-1' ? 'Tour Cultural & Cata de Ron en Getsemaní' : 'Pasadía Terrestre en Isla Barú',
              status: 'RESOLVED',
              description: 'Alternativa aplicada por el Mediador. Horarios recalculados.',
            };
          }
          return e;
        });

        setActiveTrip({
          ...activeTrip,
          events: updatedEvents,
        });
      }

      alert('¡Alternativa aplicada con éxito! El patrón Mediator de Santiago ha recalculado el itinerario.');
      onClose();
    } catch {
      // Local fallback simulation
      if (activeTrip) {
        const updatedEvents = (activeTrip.events || []).map((e: any) => {
          if (e.id === 'evt-3' || e.status === 'DISRUPTED') {
            return {
              ...e,
              title: 'Tour Cultural & Cata de Ron en Getsemaní',
              status: 'RESOLVED',
              description: 'Alternativa aplicada por el Mediador. Horarios recalculados.',
            };
          }
          return e;
        });

        setActiveTrip({
          ...activeTrip,
          events: updatedEvents,
        });
      }
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-md overflow-y-auto animate-fade-in">
      {/* Modal Shell (Stitch incident_modal.html) */}
      <div className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto border border-outline-variant/30">
        {/* 1. Cabecera del Modal */}
        <div className="bg-primary text-on-primary p-6 md:p-8 flex flex-col gap-2 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
                PATRÓN MEDIATOR • RESOLUCIÓN DESACOPLADA EN CALIENTE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container font-mono text-xs font-semibold">
                TRIP SERVICE :3003
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
              Mediador Autónomo de Incidencias: Reconfiguración de Itinerario
            </h2>
            <p className="text-xs md:text-sm text-secondary-fixed mt-1">
              Detectada alerta en nodo: <strong>Lancha Exprés Islas del Rosario</strong>. El Mediador desacopló el impacto y negoció alternativas de alto nivel sin romper tu reserva de la noche ni exceder tu presupuesto.
            </p>
          </div>
        </div>

        {/* 2. Cuerpo del Modal */}
        <div className="p-6 md:p-8 flex flex-col gap-6 bg-surface-container-low/30">
          {/* Diagnóstico de Disrupción */}
          <div className="p-4 md:p-5 rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-4 border border-outline-variant/30">
            <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">crisis_alert</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-error-container text-error font-mono text-xs font-bold">
                  Fuerza Mayor / Restricción DIMAR
                </span>
                <span className="text-xs text-on-surface-variant font-mono">Alerta Activa • Bahía de Cartagena</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                El evento marítimo programado a las 14:30 ha sido suspendido. Las siguientes alternativas fueron
                calculadas por el TripMediator para no afectar tu cena en Celele (20:00 COT).
              </p>
            </div>
          </div>

          {/* Alternativas Disponibles */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
              Alternativas Negociadas por el Mediador
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alternatives.map((alt) => {
                const isSelected = selectedAlternativeId === alt.id;
                return (
                  <div
                    key={alt.id}
                    onClick={() => setSelectedAlternativeId(alt.id)}
                    className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-secondary bg-secondary-fixed/20 shadow-md ring-2 ring-secondary/20'
                        : 'border-outline-variant/40 bg-surface-container-lowest hover:border-secondary/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        {alt.isRecommended ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-mono text-[10px] font-bold">
                            RECOMENDADA • AFINIDAD {alt.compatibility}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono text-[10px] font-medium">
                            AFINIDAD {alt.compatibility}
                          </span>
                        )}
                        <input
                          type="radio"
                          name="alternative"
                          checked={isSelected}
                          onChange={() => setSelectedAlternativeId(alt.id)}
                          className="accent-[#004a75]"
                        />
                      </div>
                      <h4 className="text-sm font-bold text-primary mb-1">{alt.title}</h4>
                      <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">{alt.description}</p>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                      <span className="font-mono text-secondary font-semibold">{alt.timeImpact}</span>
                      <span className="font-mono font-bold text-primary">{alt.costDifference}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30 flex-wrap gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            >
              Mantener Tiempo Libre
            </button>
            <button
              onClick={() => handleApplyAlternative(selectedAlternativeId)}
              disabled={isApplying}
              className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  <span>Recalculando Itinerario...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Aplicar Alternativa y Recalcular Itinerario</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
