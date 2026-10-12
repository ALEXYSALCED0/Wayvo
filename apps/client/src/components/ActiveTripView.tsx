import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentModal } from './IncidentModal';

export const ActiveTripView: React.FC = () => {
  const { activeTrip, setCurrentView, appMode } = useApp();
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');

  if (!activeTrip) {
    return (
      <div className="w-full max-w-4xl mx-auto my-16 p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-secondary mb-3">luggage</span>
        <h2 className="text-xl font-bold text-primary mb-2">No hay un viaje activo confirmado</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Ejecuta la reserva en el Checkout para activar tu viaje y monitorearlo en tiempo real.
        </p>
        <button
          onClick={() => setCurrentView('CHECKOUT')}
          className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-sm font-semibold hover:bg-primary transition-all shadow-sm"
        >
          Ir al Checkout
        </button>
      </div>
    );
  }

  const events = activeTrip.events && activeTrip.events.length > 0 ? activeTrip.events : [
    {
      id: 'evt-1',
      title: 'Vuelo Bogotá (BOG) ➔ Cartagena (CTG)',
      time: '08:00 AM - 09:30 AM',
      type: 'TRANSPORT',
      status: 'COMPLETED',
      location: 'Aeropuerto Rafael Núñez',
      description: 'Avianca AV9543 • Vuelo confirmado y arribado a tiempo.',
    },
    {
      id: 'evt-2',
      title: 'Check-in Hotel Colonial Cartagena',
      time: '11:00 AM',
      type: 'ACCOMMODATION',
      status: 'COMPLETED',
      location: 'Centro Histórico',
      description: 'Habitación estándar con vista al jardín colonial.',
    },
    {
      id: 'evt-3',
      title: 'Excursión Lancha Rápida Islas del Rosario',
      time: '02:30 PM',
      type: 'ACTIVITY',
      status: 'DISRUPTED',
      location: 'Muelle de la Bodeguita',
      description: 'Alerta por oleaje anómalo (DIMAR). El Mediador tiene alternativas listas.',
    },
    {
      id: 'evt-4',
      title: 'Cena de Degustación en Celele',
      time: '08:00 PM',
      type: 'MEAL',
      status: 'PENDING',
      location: 'Barrio Getsemaní',
      description: 'Mesa reservada para 2 personas en jardín interior.',
    },
  ];

  return (
    <div className="w-full bg-surface pb-12 animate-fade-in">
      {/* Top Banner (from Stitch active_trip.html) */}
      <section className="w-full px-4 md:px-8 py-6 bg-surface-container-low border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-mono text-xs font-semibold">
                IATA DEST: {activeTrip.destination.slice(0, 3).toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                {activeTrip.startDate} — {activeTrip.endDate}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-secondary font-mono text-xs shadow-sm">
                Hora Local: COT (GMT-5)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
              {activeTrip.destination}, Colombia
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

            {/* Estado Operativo & Mediador */}
            <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm min-w-[240px] border border-outline-variant/20">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-on-surface-variant uppercase font-medium">Estado Operativo</span>
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              </div>
              <div className="flex items-center gap-1.5 text-primary text-sm font-bold mb-1">
                <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
                <span>En Curso</span>
              </div>
              <button
                onClick={() => setIsIncidentModalOpen(true)}
                className="w-full mt-2 py-1.5 px-3 rounded-lg bg-surface-container-highest text-primary hover:bg-secondary-fixed transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
                <span>Simular Imprevisto (Mediador)</span>
              </button>
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
            {events.map((evt) => {
              const isDisrupted = evt.status === 'DISRUPTED';
              const isCompleted = evt.status === 'COMPLETED';

              return (
                <div
                  key={evt.id}
                  className={`stitch-card p-5 rounded-xl flex items-start justify-between gap-4 transition-all ${
                    isDisrupted
                      ? 'bg-error-container/30 border-error/40'
                      : 'bg-surface-container-lowest hover:border-secondary'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                        <h3 className={`text-sm font-bold ${isDisrupted ? 'text-error' : 'text-primary'}`}>
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

                  <div className="text-right flex-shrink-0">
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
                    {isDisrupted && (
                      <button
                        onClick={() => setIsIncidentModalOpen(true)}
                        className="block mt-2 text-xs font-bold text-error hover:underline"
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
                Condición marítima anómala en bahía de Cartagena. El <strong>TripMediator</strong> de Santiago recalculó
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
        </div>
      </div>

      {/* Incident Modal Trigger */}
      {isIncidentModalOpen && (
        <IncidentModal
          tripId={activeTrip.id}
          onClose={() => setIsIncidentModalOpen(false)}
        />
      )}
    </div>
  );
};
