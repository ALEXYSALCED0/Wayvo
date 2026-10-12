import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentModal } from './IncidentModal';
import { EventDetailModal } from './EventDetailModal';

export const ActiveTripView: React.FC = () => {
  const { activeTrip, planResult, setActiveTrip, setCurrentView, appMode } = useApp();
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [selectedEventModal, setSelectedEventModal] = useState<any | null>(null);

  // Allow previewing planResult if trip is not yet confirmed through checkout
  const currentTrip =
    activeTrip ||
    (planResult
      ? ({
          id: planResult.planId || 'trip-preview',
          userId: planResult.tripDraft.userId || 'usr-client',
          title: planResult.tripDraft.title || `Viaje a ${planResult.tripDraft.destination}`,
          destination: planResult.tripDraft.destination,
          startDate: planResult.tripDraft.startDate,
          endDate: planResult.tripDraft.endDate,
          status: 'CONFIRMED',
          isPreview: true,
          events: planResult.itinerary?.days?.flatMap((d) => d.events) || [],
        } as any)
      : null);

  const handleLoadDemoTrip = () => {
    setActiveTrip({
      id: 'trip-demo-medellin',
      userId: 'usr-client',
      title: 'Expedición Cultural en Medellín',
      destination: 'Medellín',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      status: 'CONFIRMED',
      events: [
        {
          id: 'evt-1',
          title: 'Vuelo Bogotá (BOG) ➔ Medellín (MDE)',
          time: '07:30 AM - 08:35 AM',
          type: 'TRANSPORT',
          status: 'COMPLETED',
          location: 'Aeropuerto José María Córdova',
          description: 'Avianca AV8422 • Arribo a tiempo y equipaje reclamado.',
          details: { provider: 'Avianca Airlines', price: 280000, notes: 'Terminal 1 Puerta 4' },
        },
        {
          id: 'evt-2',
          title: 'Check-in Hotel Boutique El Poblado',
          time: '11:00 AM',
          type: 'ACCOMMODATION',
          status: 'COMPLETED',
          location: 'El Poblado, Medellín',
          description: 'Habitación Superior con vista panorámica y desayuno.',
          details: { provider: 'Wayvo Boutique Hotels', price: 650000, notes: 'Clave WiFi y tarjeta llave activa' },
        },
        {
          id: 'evt-3',
          title: 'Tour de Transformación Social Comuna 13 & Graffitour',
          time: '02:30 PM',
          type: 'ACTIVITY',
          status: 'COMPLETED',
          location: 'San Javier - Escaleras Eléctricas',
          description: 'Recorrido con guía local, escaleras eléctricas y degustación de helado de mango biche.',
          details: { provider: 'Guías Comuna 13 Oficiales', price: 85000, notes: 'Llevar calzado deportivo y agua' },
        },
        {
          id: 'evt-4',
          title: 'Cena de Alta Cocina Paisa en El Chato / Carmen',
          time: '08:00 PM',
          type: 'MEAL',
          status: 'PENDING',
          location: 'Manila, El Poblado',
          description: 'Mesa reservada para degustación de 6 pasos con maridaje.',
          details: { provider: 'Carmen Medellín', price: 210000, notes: 'Código de vestimenta smart casual' },
        },
      ],
    } as any);
  };

  if (!currentTrip) {
    return (
      <div className="w-full max-w-4xl mx-auto my-16 p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm animate-fade-in">
        <span className="material-symbols-outlined text-[48px] text-secondary mb-3">luggage</span>
        <h2 className="text-xl font-bold text-primary mb-2">No hay un viaje activo cargado</h2>
        <p className="text-sm text-on-surface-variant mb-6 max-w-md mx-auto">
          Diseña tu viaje personalizado con IA para hacer el seguimiento en vivo, o carga un viaje de prueba para explorar la experiencia.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => setCurrentView('ONBOARDING')}
            className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-sm font-semibold hover:bg-primary transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>Planificar con IA</span>
          </button>
          <button
            onClick={handleLoadDemoTrip}
            className="px-6 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary text-sm font-semibold transition-all border border-outline-variant/30 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">magic_button</span>
            <span>Cargar Viaje Demo</span>
          </button>
        </div>
      </div>
    );
  }

  const events = (currentTrip.events && currentTrip.events.length > 0 ? currentTrip.events : []).map((evt: any) => ({
    ...evt,
    time: evt.time || evt.startTime || '09:00 AM',
  }));

  return (
    <div className="w-full bg-surface pb-12 animate-fade-in">
      {/* Top Banner (from Stitch active_trip.html) */}
      <section className="w-full px-4 md:px-8 py-6 bg-surface-container-low border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-mono text-xs font-semibold">
                IATA DEST: {currentTrip.destination.slice(0, 3).toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                {currentTrip.startDate} — {currentTrip.endDate}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-secondary font-mono text-xs shadow-sm">
                Hora Local: COT (GMT-5)
              </span>
              {(currentTrip as any).isPreview && (
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-bold">
                  Vista Previa del Itinerario
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
              {currentTrip.destination}
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant">
              {appMode === 'DEV'
                ? 'Expedición Cultural Inteligente • Monitoreo Autónomo con Patrón Mediator'
                : 'Expedición Cultural Inteligente • Asistencia Proactiva 24/7'}
            </p>
            <div className="flex items-center gap-6 pt-1 text-xs text-on-surface">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">sunny</span>
                <span>31°C Soleado con brisa marina</span>
              </span>
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">air</span>
                <span>Viento NE 16 kt • Oleaje moderado</span>
              </span>
            </div>
          </div>

          {/* Cards de Métricas & Estado */}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full lg:w-auto">
            {/* Ciclo del Viaje */}
            <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm min-w-[220px] border border-outline-variant/20">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-on-surface-variant uppercase font-medium">Ciclo del Viaje</span>
                <span className="font-mono font-bold text-primary">50% Listo</span>
              </div>
              <div className="text-sm font-bold text-primary mb-2">Día 2 <span className="text-xs font-normal text-on-surface-variant">de 4 días</span></div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>

            {/* Estado Operativo */}
            <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm min-w-[240px] border border-outline-variant/20">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-on-surface-variant uppercase font-medium">Estado Operativo</span>
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              </div>
              <div className="flex items-center gap-1.5 text-primary text-sm font-bold mb-1">
                <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
                <span>En Curso</span>
              </div>
              {appMode === 'DEV' ? (
                <button
                  onClick={() => setIsIncidentModalOpen(true)}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-surface-container-highest text-primary hover:bg-secondary-fixed transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
                  <span>Simular Imprevisto (Mediador)</span>
                </button>
              ) : (
                <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center gap-1.5 text-xs text-secondary font-medium">
                  <span className="material-symbols-outlined text-[16px]">security</span>
                  <span>Protección y Monitoreo Activo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content (Stitch: 8 cols left, 4 cols right) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Timeline Cronológico */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h2 className="text-lg font-bold text-primary">Timeline Cronológico en Vivo</h2>
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-full text-xs">
              <button
                onClick={() => setSelectedDayFilter('ALL')}
                className={`px-3 py-1 rounded-full transition-all ${
                  selectedDayFilter === 'ALL'
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Todos los Eventos
              </button>
              <button
                onClick={() => setSelectedDayFilter('TODAY')}
                className={`px-3 py-1 rounded-full transition-all ${
                  selectedDayFilter === 'TODAY'
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Hoy (Día 2)
              </button>
            </div>
          </div>

          {/* Cards de Eventos */}
          <div className="flex flex-col gap-4">
            {events.map((evt: any) => {
              const isDisrupted = evt.status === 'DISRUPTED';
              const isCompleted = evt.status === 'COMPLETED';

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventModal(evt)}
                  className={`stitch-card p-5 rounded-xl flex items-start justify-between gap-4 transition-all cursor-pointer group hover:shadow-sm ${
                    isDisrupted
                      ? 'bg-error-container/30 border-error/40'
                      : 'bg-surface-container-lowest hover:border-secondary'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                        isDisrupted
                          ? 'bg-error-container text-error'
                          : isCompleted
                          ? 'bg-surface-container-highest text-secondary'
                          : 'bg-surface-container text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isDisrupted
                          ? 'crisis_alert'
                          : evt.type === 'TRANSPORT'
                          ? 'flight'
                          : evt.type === 'ACCOMMODATION'
                          ? 'hotel'
                          : evt.type === 'MEAL'
                          ? 'restaurant'
                          : 'tour'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-secondary">{evt.time}</span>
                        <h3 className={`text-sm font-bold group-hover:text-secondary transition-colors ${isDisrupted ? 'text-error' : 'text-primary'}`}>
                          {evt.title}
                        </h3>
                      </div>
                      <p className="text-xs text-on-surface-variant">{evt.description}</p>
                      {evt.location && (
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {evt.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isDisrupted
                          ? 'bg-error text-on-error shadow-sm'
                          : isCompleted
                          ? 'bg-surface-container-high text-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {isDisrupted ? 'ALERTA DISRUPCIÓN' : isCompleted ? '✓ COMPLETADO' : 'PROGRAMADO'}
                    </span>
                    <span className="text-[11px] text-secondary font-semibold group-hover:underline flex items-center gap-0.5 mt-1">
                      <span>Ver Ficha</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </span>
                    {isDisrupted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsIncidentModalOpen(true);
                        }}
                        className="block mt-1 text-xs font-bold text-error hover:underline"
                      >
                        Resolver Ahora ➔
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Mediador & Concierge Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {appMode === 'DEV' ? (
            <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-secondary text-[22px]">alt_route</span>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Patrón Mediator Autónomo
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 mb-4">
                <span className="text-xs font-mono font-bold text-error block mb-1">
                  Disrupción Registrada en Cola
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Condición marítima anómala en bahía de Cartagena. El <strong>TripMediator</strong> recalculó
                  alternativas terrestres y gastronómicas de igual valor.
                </p>
              </div>

              <button
                onClick={() => setIsIncidentModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">handshake</span>
                <span>Abrir Mediador de Incidentes</span>
              </button>
            </div>
          ) : (
            <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-secondary text-[22px]">support_agent</span>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Asistencia & Concierge Wayvo
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                  <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
                  <span>Protección Continua Activa</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Monitoreamos el clima, estado de vuelos y novedades locales en tiempo real para anticiparnos a cualquier cambio en tu itinerario.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[18px]">emergency</span>
                  <span>Línea Concierge 24/7</span>
                </div>
                <span className="font-mono text-secondary font-semibold">Disponible</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Incident Modal Trigger */}
      {isIncidentModalOpen && (
        <IncidentModal
          tripId={currentTrip.id}
          onClose={() => setIsIncidentModalOpen(false)}
        />
      )}

      {/* Event Details Full Modal */}
      {selectedEventModal && (
        <EventDetailModal
          event={selectedEventModal}
          destination={currentTrip.destination}
          onClose={() => setSelectedEventModal(null)}
        />
      )}
    </div>
  );
};
