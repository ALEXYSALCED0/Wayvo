import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentModal } from './IncidentModal';
import { EventDetailModal } from './EventDetailModal';
import { WayvoApi } from '../services/api';

const generateFallbackEventsForTrip = (trip: any) => {
  const dest = trip.destination || 'Cartagena';
  const orig = trip.origin || 'Bogotá';
  const sDate = (trip.startDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const eDate = (trip.endDate || sDate).slice(0, 10);

  return [
    {
      id: `evt-${trip.id || 'gen'}-1`,
      tripId: trip.id,
      title: `Vuelo ${orig} ➔ ${dest}`,
      time: '08:00 AM - 10:15 AM',
      type: 'TRANSPORT',
      status: 'PENDING',
      reservationStatus: 'CONFIRMED',
      location: `Aeropuerto de ${orig} ➔ Aeropuerto de ${dest}`,
      startDateTime: `${sDate}T08:00:00Z`,
      description: `Vuelo de ida confirmado con equipaje de mano y asignación de asientos.`,
      details: { provider: 'Avianca / LATAM Airlines', price: 280000, notes: 'Terminal 1 • Presentarse con 2h de antelación' },
    },
    {
      id: `evt-${trip.id || 'gen'}-2`,
      tripId: trip.id,
      title: `Check-in Hotel en ${dest}`,
      time: '12:30 PM',
      type: 'HOTEL',
      status: 'PENDING',
      reservationStatus: 'CONFIRMED',
      location: `Zona Histórica / Turística, ${dest}`,
      startDateTime: `${sDate}T12:30:00Z`,
      description: `Registro en el alojamiento seleccionado con habitación lista y desayuno incluido.`,
      details: { provider: `Hotel Boutique ${dest}`, price: 450000, notes: 'Check-in garantizado • Clave WiFi entregada en recepción' },
    },
    {
      id: `evt-${trip.id || 'gen'}-3`,
      tripId: trip.id,
      title: `Tour Cultural y Arquitectónico en ${dest}`,
      time: '03:30 PM - 06:00 PM',
      type: 'ACTIVITY',
      status: 'PENDING',
      reservationStatus: 'CONFIRMED',
      location: `Centro Histórico, ${dest}`,
      startDateTime: `${sDate}T15:30:00Z`,
      description: `Recorrido a pie con guía certificado por los puntos más emblemáticos de ${dest}.`,
      details: { provider: 'Guías Locales Oficiales', price: 75000, notes: 'Punto de encuentro: Plaza Principal' },
    },
    {
      id: `evt-${trip.id || 'gen'}-4`,
      tripId: trip.id,
      title: `Cena de Gastronomía Típica en ${dest}`,
      time: '08:00 PM',
      type: 'MEAL',
      status: 'PENDING',
      reservationStatus: 'CONFIRMED',
      location: `Distrito Gastronómico, ${dest}`,
      startDateTime: `${sDate}T20:00:00Z`,
      description: `Reserva para degustación de platillos tradicionales y coctelería de autor.`,
      details: { provider: `Restaurante Tradicional ${dest}`, price: 120000, notes: 'Reserva confirmada en terraza' },
    },
    {
      id: `evt-${trip.id || 'gen'}-5`,
      tripId: trip.id,
      title: `Experiencia de Naturaleza o Excursión en ${dest}`,
      time: '09:30 AM - 01:30 PM',
      type: 'TOUR',
      status: 'PENDING',
      reservationStatus: 'NOT_RESERVED',
      location: `Atracciones Principales de ${dest}`,
      startDateTime: `${eDate}T09:30:00Z`,
      description: `Paseo panorámico y actividades al aire libre con transporte y refrigerio.`,
      details: { provider: 'Operador Turístico Certificado', price: 95000, notes: 'Confirmar voucher al abordar' },
    },
    {
      id: `evt-${trip.id || 'gen'}-6`,
      tripId: trip.id,
      title: `Check-out y Vuelo de Regreso: ${dest} ➔ ${orig}`,
      time: '06:00 PM - 08:15 PM',
      type: 'TRANSPORT',
      status: 'PENDING',
      reservationStatus: 'CONFIRMED',
      location: `Aeropuerto de ${dest} ➔ Aeropuerto de ${orig}`,
      startDateTime: `${eDate}T18:00:00Z`,
      description: `Vuelo de regreso programado. Entrega de llaves del hotel y traslado.`,
      details: { provider: 'Aerolínea Comercial', price: 280000, notes: 'Retorno seguro a casa' },
    },
  ];
};

export const ActiveTripView: React.FC = () => {
  const {
    activeTrip,
    planResult,
    setActiveTrip,
    setCurrentView,
    appMode,
    devBypassTimeValidation,
    loadUserTrips,
  } = useApp();

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedEventForIncident, setSelectedEventForIncident] = useState<any | null>(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [selectedEventModal, setSelectedEventModal] = useState<any | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isStartingTrip, setIsStartingTrip] = useState(false);

  // Auto-hidratar eventos si el viaje guardado no tenía eventos persistidos
  useEffect(() => {
    if (activeTrip && (!activeTrip.events || activeTrip.events.length === 0)) {
      let eventsToInject: any[] = [];
      if (planResult?.itinerary?.days && planResult.tripDraft?.destination === activeTrip.destination) {
        eventsToInject = planResult.itinerary.days.flatMap((d) => d.events || []);
      }
      if (eventsToInject.length === 0) {
        eventsToInject = generateFallbackEventsForTrip(activeTrip);
      }

      const updated = { ...activeTrip, events: eventsToInject };
      setActiveTrip(updated);

      if (activeTrip.id && !activeTrip.id.startsWith('trip-preview')) {
        WayvoApi.addEventsToTrip(activeTrip.id, eventsToInject).catch(() => {});
      }
    }
  }, [activeTrip?.id]);

  const rawTrip =
    activeTrip ||
    (planResult
      ? ({
          id: planResult.planId || 'trip-preview',
          userId: planResult.tripDraft?.userId || 'usr-client',
          title: planResult.tripDraft?.title || `Viaje a ${planResult.tripDraft?.destination}`,
          destination: planResult.tripDraft?.destination,
          origin: planResult.tripDraft?.origin,
          startDate: planResult.tripDraft?.startDate,
          endDate: planResult.tripDraft?.endDate,
          status: 'CONFIRMED',
          isPreview: true,
          events: (planResult.itinerary?.days || []).flatMap((d) => d.events || []),
        } as any)
      : null);

  const currentTrip = useMemo(() => {
    if (!rawTrip) return null;
    let evts = rawTrip.events || [];
    if (evts.length === 0) {
      if (planResult?.itinerary?.days && planResult.tripDraft?.destination === rawTrip.destination) {
        evts = planResult.itinerary.days.flatMap((d) => d.events || []);
      }
      if (evts.length === 0) {
        evts = generateFallbackEventsForTrip(rawTrip);
      }
    }
    return { ...rawTrip, events: evts };
  }, [rawTrip, planResult]);

  const handleLoadDemoTrip = () => {
    setActiveTrip({
      id: 'trip-demo-medellin',
      userId: 'usr-client',
      title: 'Expedición Cultural en Medellín',
      destination: 'Medellín',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      status: 'ACTIVE',
      events: [
        {
          id: 'evt-1',
          title: 'Vuelo Bogotá (BOG) ➔ Medellín (MDE)',
          time: '07:30 AM - 08:35 AM',
          type: 'TRANSPORT',
          status: 'COMPLETED',
          reservationStatus: 'CONFIRMED',
          location: 'Aeropuerto José María Córdova',
          description: 'Avianca AV8422 • Arribo a tiempo y equipaje reclamado.',
          details: { provider: 'Avianca Airlines', price: 280000, notes: 'Terminal 1 Puerta 4' },
        },
        {
          id: 'evt-2',
          title: 'Check-in Hotel Boutique El Poblado',
          time: '11:00 AM',
          type: 'ACCOMMODATION',
          status: 'IN_PROGRESS',
          reservationStatus: 'CONFIRMED',
          location: 'El Poblado, Medellín',
          description: 'Habitación Superior con vista panorámica y desayuno.',
          details: { provider: 'Wayvo Boutique Hotels', price: 650000, notes: 'Clave WiFi y tarjeta llave activa' },
        },
        {
          id: 'evt-3',
          title: 'Tour de Transformación Social Comuna 13 & Graffitour',
          time: '02:30 PM',
          type: 'ACTIVITY',
          status: 'PENDING',
          reservationStatus: 'NOT_RESERVED',
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
          reservationStatus: 'CONFIRMED',
          location: 'Manila, El Poblado',
          description: 'Mesa reservada para degustación de 6 pasos con maridaje.',
          details: { provider: 'Carmen Medellín', price: 210000, notes: 'Código de vestimenta smart casual' },
        },
      ],
    } as any);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  // Toggle Confirmar Reserva / Voucher del Evento
  const handleToggleReservation = async (evt: any) => {
    const nextStatus = evt.reservationStatus === 'CONFIRMED' ? 'NOT_RESERVED' : 'CONFIRMED';
    const updatedEvents = (currentTrip.events || []).map((e: any) =>
      e.id === evt.id ? { ...e, reservationStatus: nextStatus } : e
    );

    const updatedTrip = { ...currentTrip, events: updatedEvents };
    setActiveTrip(updatedTrip);

    try {
      if (currentTrip.id && !currentTrip.isPreview) {
        await WayvoApi.updateEventReservation(currentTrip.id, evt.id, nextStatus as any);
      }
    } catch {
      // Mantiene estado local
    }
  };

  // Iniciar Evento (avanza a IN_PROGRESS)
  const handleStartEvent = async (evt: any) => {
    // Validación temporal: fecha/hora o Dev Bypass
    const isAllowed = devBypassTimeValidation; // Si no hay Dev Bypass, validar tiempo
    if (!isAllowed) {
      // Verificación de hora aproximada
      showFeedback(
        `Este evento está programado para "${evt.time}". Solo puedes iniciarlo cuando comience en la vida real, o activa el toggle "Demo Bypass: ON" en la barra superior (Modo Dev) para simular el inicio en la demo.`
      );
      return;
    }

    const updatedEvents = (currentTrip.events || []).map((e: any) =>
      e.id === evt.id ? { ...e, status: 'IN_PROGRESS' } : e
    );
    const updatedTrip = { ...currentTrip, events: updatedEvents };
    setActiveTrip(updatedTrip);

    try {
      if (currentTrip.id && !currentTrip.isPreview) {
        await WayvoApi.startEvent(currentTrip.id, evt.id);
      }
    } catch {
      // Local
    }
  };

  // Completar Evento (avanza a COMPLETED)
  const handleCompleteEvent = async (evt: any) => {
    const isAllowed = devBypassTimeValidation;
    if (!isAllowed && evt.status === 'PENDING') {
      showFeedback(
        `Este evento aún no ha comenzado según la agenda (${evt.time}). Activa "Demo Bypass: ON" en la barra superior (Modo Dev) si deseas marcarlo como completado durante la demostración.`
      );
      return;
    }

    const updatedEvents = (currentTrip.events || []).map((e: any) =>
      e.id === evt.id ? { ...e, status: 'COMPLETED' } : e
    );
    const updatedTrip = { ...currentTrip, events: updatedEvents };
    setActiveTrip(updatedTrip);

    try {
      if (currentTrip.id && !currentTrip.isPreview) {
        await WayvoApi.completeEvent(currentTrip.id, evt.id);
      }
    } catch {
      // Local
    }
  };

  // Iniciar Viaje completo
  const handleStartTrip = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const tripStart = (currentTrip.startDate || '').slice(0, 10);
    const canStart = devBypassTimeValidation || today >= tripStart;

    if (!canStart) {
      showFeedback(
        `El viaje inicia el ${currentTrip.startDate}. Activa el toggle "Demo Bypass: ON" en la barra superior (Modo Dev) para iniciarlo anticipadamente en la demostración.`
      );
      return;
    }

    setIsStartingTrip(true);
    try {
      if (currentTrip.id && !currentTrip.isPreview) {
        const res = await WayvoApi.startTrip(currentTrip.id);
        setActiveTrip(res);
      } else {
        setActiveTrip({ ...currentTrip, status: 'ACTIVE' });
      }
      await loadUserTrips();
    } catch {
      setActiveTrip({ ...currentTrip, status: 'ACTIVE' });
    } finally {
      setIsStartingTrip(false);
    }
  };

  if (!currentTrip) {
    return (
      <div className="w-full max-w-4xl mx-auto my-16 p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm animate-fade-in font-sans">
        <span className="material-symbols-outlined text-[48px] text-secondary mb-3">luggage</span>
        <h2 className="text-xl font-bold text-primary mb-2">No hay un viaje activo seleccionado</h2>
        <p className="text-sm text-on-surface-variant mb-6 max-w-md mx-auto">
          Selecciona uno de tus viajes guardados en el organizador o diseña un nuevo itinerario personalizado con IA.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => setCurrentView('MY_TRIPS')}
            className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-secondary transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">folder_special</span>
            <span>Ver Mis Viajes</span>
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
    reservationStatus: evt.reservationStatus || 'NOT_RESERVED',
    status: evt.status || 'PENDING',
    dateStr: (evt.startDateTime ? evt.startDateTime.slice(0, 10) : '') || '',
  }));

  const distinctDates = Array.from(new Set(events.map((e: any) => e.dateStr).filter(Boolean))) as string[];
  distinctDates.sort();

  const displayedEvents = selectedDayFilter === 'ALL'
    ? events
    : events.filter((e: any) => e.dateStr === selectedDayFilter);

  const tripStatus = (currentTrip.status || '').toUpperCase();
  const isTripActive = tripStatus === 'ACTIVE';

  return (
    <div className="w-full bg-surface pb-16 animate-fade-in font-sans">
      {/* Top Banner */}
      <section className="w-full px-4 md:px-8 py-6 bg-surface-container-low border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setCurrentView('MY_TRIPS')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs border border-outline-variant/30 transition-all mr-1"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                <span>Mis Viajes</span>
              </button>

              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-mono text-xs font-semibold">
                DEST: {currentTrip.destination.slice(0, 3).toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                {currentTrip.startDate} — {currentTrip.endDate}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-secondary font-mono text-xs shadow-sm">
                Hora Local: COT (GMT-5)
              </span>
              {currentTrip.isPreview && (
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-bold">
                  Vista Previa
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
                {currentTrip.destination}
              </h1>
              {isTripActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold dark:bg-emerald-950 dark:text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  En Curso
                </span>
              ) : (
                <button
                  disabled={isStartingTrip}
                  onClick={handleStartTrip}
                  className="px-3.5 py-1 rounded-full bg-primary hover:bg-secondary text-on-primary text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                  <span>{isStartingTrip ? 'Iniciando...' : 'Iniciar Viaje'}</span>
                </button>
              )}
            </div>

            <p className="text-xs md:text-sm text-on-surface-variant">
              Organizador Inteligente • Gestiona tus reservas individuales e imprevistos en vivo
            </p>
          </div>

          {/* Cards de Métricas */}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full lg:w-auto">
            {/* Reservas Confirmadas */}
            <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm min-w-[200px] border border-outline-variant/20">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-on-surface-variant uppercase font-medium">Reservas</span>
                <span className="font-mono font-bold text-secondary">
                  {events.filter((e: any) => e.reservationStatus === 'CONFIRMED').length} / {events.length}
                </span>
              </div>
              <div className="text-sm font-bold text-primary mb-2">Confirmadas</div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full"
                  style={{
                    width: `${events.length > 0 ? (events.filter((e: any) => e.reservationStatus === 'CONFIRMED').length / events.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Progreso del Itinerario */}
            <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm min-w-[200px] border border-outline-variant/20">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-on-surface-variant uppercase font-medium">Progreso Agenda</span>
                <span className="font-mono font-bold text-primary">
                  {events.filter((e: any) => e.status === 'COMPLETED').length} / {events.length}
                </span>
              </div>
              <div className="text-sm font-bold text-primary mb-2">Eventos Listos</div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{
                    width: `${events.length > 0 ? (events.filter((e: any) => e.status === 'COMPLETED').length / events.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-amber-600 flex-shrink-0">info</span>
            <div className="flex-1 font-medium">{feedbackMsg}</div>
            <button onClick={() => setFeedbackMsg(null)} className="text-amber-800 hover:text-amber-950">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Timeline Cronológico */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
            <div>
              <h2 className="text-lg font-bold text-primary">Cronograma & Estado de Reservas</h2>
              <p className="text-xs text-on-surface-variant">
                Confirma tus reservas compradas e inicia o completa cada actividad conforme avanza tu viaje.
              </p>
            </div>
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-surface-container text-secondary font-bold shrink-0 self-start sm:self-auto">
              {displayedEvents.length} {displayedEvents.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>

          {/* Day Selector Tabs */}
          {distinctDates.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant/15">
              <button
                onClick={() => setSelectedDayFilter('ALL')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedDayFilter === 'ALL'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span>Todos los Días</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedDayFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                  {events.length}
                </span>
              </button>
              {distinctDates.map((dateStr, idx) => {
                const count = events.filter((e: any) => e.dateStr === dateStr).length;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDayFilter(dateStr)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedDayFilter === dateStr
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span>Día {idx + 1} ({dateStr.slice(5)})</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedDayFilter === dateStr ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Cards de Eventos */}
          {displayedEvents.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col items-center">
              <span className="material-symbols-outlined text-[36px] text-secondary mb-2">event_busy</span>
              <p className="text-sm font-semibold text-primary">No hay eventos para la fecha seleccionada</p>
              <button
                onClick={() => setSelectedDayFilter('ALL')}
                className="mt-3 px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm"
              >
                Ver Todos los Días
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {displayedEvents.map((evt: any) => {
              const isCancelled = evt.status === 'CANCELLED';
              const isDisrupted = (evt.status === 'ISSUE' || evt.status === 'DISRUPTED') && !isCancelled;
              const isCompleted = evt.status === 'COMPLETED' && !isCancelled;
              const isInProgress = evt.status === 'IN_PROGRESS' && !isCancelled;
              const isConfirmedReservation = evt.reservationStatus === 'CONFIRMED';
              const isAlternative = evt.isAlternative || !!evt.replacesEventTitle;

              return (
                <div
                  key={evt.id}
                  className={`stitch-card p-5 rounded-2xl flex flex-col gap-4 transition-all border ${
                    isCancelled
                      ? 'bg-error-container/10 border-error/40 opacity-90 shadow-none ring-1 ring-error/20'
                      : isDisrupted
                      ? 'bg-error-container/20 border-error/40'
                      : isAlternative
                      ? 'bg-secondary-fixed/10 border-secondary/50 shadow-sm ring-1 ring-secondary/20'
                      : isInProgress
                      ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                      : isCompleted
                      ? 'bg-surface-container-lowest border-outline-variant/20 opacity-85'
                      : 'bg-surface-container-lowest border-outline-variant/30 hover:border-secondary/60'
                  }`}
                >
                  {/* Top Header if event replaces a cancelled event */}
                  {evt.replacesEventTitle && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-secondary pb-2 border-b border-secondary/20">
                      <span className="material-symbols-outlined text-[16px]">turn_sharp_right</span>
                      <span>Sustituto directo de: <span className="line-through text-on-surface-variant font-medium">{evt.replacesEventTitle}</span></span>
                    </div>
                  )}

                  {/* Top line: Icon, Title, and Badges */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isCancelled
                            ? 'bg-error-container text-error'
                            : isDisrupted
                            ? 'bg-error-container text-error'
                            : isAlternative
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : isInProgress
                            ? 'bg-primary text-on-primary animate-pulse'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-surface-container text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {isCancelled
                            ? 'cancel'
                            : isDisrupted
                            ? 'crisis_alert'
                            : evt.type === 'TRANSPORT'
                            ? 'flight'
                            : evt.type === 'ACCOMMODATION' || evt.type === 'HOTEL'
                            ? 'hotel'
                            : evt.type === 'MEAL'
                            ? 'restaurant'
                            : 'tour'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedDayFilter === 'ALL' && evt.dateStr && (
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[10px] font-bold">
                              {evt.dateStr}
                            </span>
                          )}
                          <span className="font-mono text-xs font-bold text-secondary">{evt.time}</span>
                          <h3
                            className={`text-sm font-bold ${
                              isCancelled
                                ? 'line-through text-on-surface-variant decoration-error decoration-2'
                                : isDisrupted
                                ? 'text-error'
                                : 'text-primary'
                            }`}
                          >
                            {evt.title}
                          </h3>
                          {isAlternative && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px] font-bold">
                              ✦ {evt.alternativeBadge || 'Sustituto IA'}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isCancelled ? 'text-on-surface-variant/80' : 'text-on-surface-variant'}`}>
                          {evt.description}
                        </p>
                        {evt.location && (
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px] text-secondary">location_on</span>
                            <span>{evt.location}</span>
                          </span>
                        )}

                        {/* Motivo de cancelación si aplica */}
                        {isCancelled && evt.issueReason && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-error font-medium bg-error-container/25 px-2.5 py-1 rounded-lg w-fit border border-error/20">
                            <span className="material-symbols-outlined text-[14px]">report</span>
                            <span>Motivo: {evt.issueReason}</span>
                          </div>
                        )}

                        {/* Indicador conector: Reemplazado por alternativa */}
                        {isCancelled && evt.replacedByTitle && (
                          <div className="mt-2 p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-secondary">arrow_forward</span>
                              <span className="text-on-surface-variant">Sustituido por:</span>
                              <strong className="text-primary font-bold">{evt.replacedByTitle}</strong>
                            </div>
                            <span className="text-[10px] font-mono text-secondary uppercase font-bold bg-secondary/10 px-2 py-0.5 rounded-full">
                              Propuesta IA
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {isCancelled && (
                        <span className="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-black flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">cancel</span>
                          CANCELADO
                        </span>
                      )}
                      {isDisrupted && (
                        <span className="px-2.5 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold">
                          ALERTA
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                          EN CURSO
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          ✓ COMPLETADO
                        </span>
                      )}
                      {!isDisrupted && !isInProgress && !isCompleted && !isCancelled && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isAlternative
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {isAlternative ? '✦ SUSTITUTO IA' : 'PROGRAMADO'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Line: Interactive Controls for the User */}
                  <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between flex-wrap gap-2">
                    {isCancelled ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-xs text-error font-medium">
                          <span className="material-symbols-outlined text-[16px]">event_busy</span>
                          <span>Actividad cancelada por eventualidad (no computable)</span>
                        </div>
                        <button
                          onClick={() => setSelectedEventModal(evt)}
                          className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-outline-variant/30 flex items-center gap-1"
                        >
                          <span>Ficha</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Left: Reservation Confirmation Toggle */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleReservation(evt)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                              isConfirmedReservation
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px] text-emerald-600">
                              {isConfirmedReservation ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span>
                              {isConfirmedReservation ? 'Reserva Confirmada' : 'Confirmar Reserva / Voucher'}
                            </span>
                          </button>

                          {/* Event Detail Modal Trigger */}
                          <button
                            onClick={() => setSelectedEventModal(evt)}
                            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-outline-variant/30 flex items-center gap-1"
                          >
                            <span>Ficha</span>
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </button>
                        </div>

                        {/* Right: Progression (Start / Complete) and Report Incident */}
                        <div className="flex items-center gap-2">
                          {/* Report Incident / Eventualidad */}
                          <button
                            onClick={() => {
                              setSelectedEventForIncident(evt);
                              setIsIncidentModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-error bg-error-container/20 hover:bg-error-container/40 flex items-center gap-1 transition-all"
                          >
                            <span className="material-symbols-outlined text-[15px]">report_problem</span>
                            <span>Informar Eventualidad</span>
                          </button>

                          {/* State transitions */}
                          {!isCompleted && !isInProgress && (
                            <button
                              onClick={() => handleStartEvent(evt)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-secondary text-on-primary flex items-center gap-1 shadow-sm transition-all"
                            >
                              <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                              <span>Comenzar</span>
                            </button>
                          )}

                          {isInProgress && (
                            <button
                              onClick={() => handleCompleteEvent(evt)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-sm transition-all"
                            >
                              <span className="material-symbols-outlined text-[15px]">task_alt</span>
                              <span>Completar</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Right Column: Wayvo Travel Concierge & AI Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-[22px]">smart_toy</span>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                Wayvo Travel Intelligence
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
                <span>Asistencia Reactiva en Vivo</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Si pierdes un tren, cambian las condiciones del clima o decides modificar una parada, haz clic en <strong>Informar Eventualidad</strong> en el evento correspondiente. Wayvo AI calculará alternativas dinámicas con hoteles, transportes o actividades sustitutas.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-secondary text-[18px]">support_agent</span>
                <span>Línea Concierge AI</span>
              </div>
              <span className="font-mono text-secondary font-semibold">24/7 Conectada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Modal (Conectado a IA Dinámica) */}
      {isIncidentModalOpen && selectedEventForIncident && (
        <IncidentModal
          tripId={currentTrip.id}
          event={selectedEventForIncident}
          destination={currentTrip.destination}
          surroundingItinerary={events}
          onClose={() => {
            setIsIncidentModalOpen(false);
            setSelectedEventForIncident(null);
          }}
          onAlternativeApplied={(updated) => {
            setActiveTrip(updated);
          }}
        />
      )}

      {/* Event Details Full Modal */}
      {selectedEventModal && (
        <EventDetailModal
          event={selectedEventModal}
          destination={currentTrip.destination}
          origin={currentTrip.origin}
          onClose={() => setSelectedEventModal(null)}
        />
      )}
    </div>
  );
};
