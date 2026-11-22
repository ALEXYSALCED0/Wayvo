import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import { TripCheckoutRequest, ConfirmTripSagaResult } from '@wayvo/contracts';
import { resolveAirportCode } from '../utils/travelLinks';

export const CheckoutView: React.FC = () => {
  const {
    planResult,
    setCurrentView,
    setActiveTrip,
    setCheckoutResult,
    setCompensationLog,
    appMode,
    setIsDevInspectorOpen,
    chaosMode,
    setChaosMode,
    loadUserTrips,
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [sagaStep, setSagaStep] = useState<number>(0);
  const [result, setResult] = useState<ConfirmTripSagaResult | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  if (!planResult) {
    return (
      <div className="w-full max-w-4xl mx-auto my-16 p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-secondary mb-3">shopping_cart</span>
        <h2 className="text-xl font-bold text-primary mb-2">No hay un itinerario para reservar</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Por favor completa el onboarding para generar una propuesta de viaje antes del checkout.
        </p>
        <button
          onClick={() => setCurrentView('ONBOARDING')}
          className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-sm font-semibold hover:bg-primary transition-all shadow-sm"
        >
          Ir a Onboarding
        </button>
      </div>
    );
  }

  const { tripDraft, suggestedBookingItems: _unusedSuggested } = planResult;
  const outboundFlight = planResult.transport?.outbound?.[0];
  const inboundFlight = planResult.transport?.inbound?.[0];
  const accommodation = planResult.accommodation;
  const travelers = Math.max(1, tripDraft.travelers || 2);
  const budget = planResult.budget;
  const breakdown = budget?.breakdown;

  // Sincronización exacta con los valores de la propuesta (ProposalView)
  const transportBudget = breakdown?.transport ?? ((outboundFlight?.estimatedCost || 320000) + (inboundFlight?.estimatedCost || 0));
  const accommodationBudget = breakdown?.accommodation ?? (accommodation?.estimatedCost || 420000);
  const activitiesBudget = (breakdown?.activities ?? 0) + (breakdown?.food ?? 0);
  const emergencyBudget = breakdown?.emergencyFund ?? 0;

  // Costo total estimado sincronizado 1:1 con ProposalView
  const totalAmount = budget?.estimatedTotalCost ?? (transportBudget + accommodationBudget + activitiesBudget + emergencyBudget);

  // Distribución de transporte entre ida y vuelta (si aplica)
  const outboundFlightCost = inboundFlight ? Math.round(transportBudget / 2) : transportBudget;
  const outboundPerPerson = Math.round(outboundFlightCost / travelers);

  const inboundFlightCost = inboundFlight ? (transportBudget - outboundFlightCost) : 0;
  const inboundPerPerson = inboundFlight ? Math.round(inboundFlightCost / travelers) : 0;

  const outboundOrigin = (outboundFlight as any)?.originAirport || resolveAirportCode(tripDraft.origin, false);
  const outboundDest = (outboundFlight as any)?.destinationAirport || resolveAirportCode(tripDraft.destination, true);
  const outboundFlightNum = outboundFlight?.flightNumber || 'Vuelo Directo';
  const outboundOfferId = (outboundFlight as any)?.offerId || `offer-${outboundFlightNum.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const inboundOrigin = (inboundFlight as any)?.originAirport || resolveAirportCode(tripDraft.destination, true);
  const inboundDest = (inboundFlight as any)?.destinationAirport || resolveAirportCode(tripDraft.origin, false);
  const inboundFlightNum = inboundFlight?.flightNumber || 'Vuelo Retorno';
  const inboundOfferId = (inboundFlight as any)?.offerId || `offer-${inboundFlightNum.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const hotelName = accommodation?.name || `Hotel en ${tripDraft.destination}`;
  const hotelOfferId = (accommodation as any)?.offerId || `offer-${hotelName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`;
  const hotelProviderId = (accommodation as any)?.providerId || `prov-${hotelName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`;

  // Items exactos para la orquestación y el desglose
  const items = [
    {
      type: 'TRANSPORT' as any,
      providerId: (outboundFlight as any)?.providerId || 'prov-aerocaribe',
      offerId: outboundOfferId,
      description: outboundFlight?.airline
        ? `Vuelo ${outboundFlight.airline} (${outboundFlightNum}): ${tripDraft.origin} ➔ ${tripDraft.destination}`
        : `Vuelo de Ida ${tripDraft.origin} ➔ ${tripDraft.destination}`,
      quantity: travelers,
      unitPrice: outboundPerPerson,
      metadata: {
        originAirport: outboundOrigin,
        destinationAirport: outboundDest,
        departureDate: tripDraft.startDate,
        flightNumber: outboundFlightNum,
        airline: outboundFlight?.airline || 'Aerolínea',
        cabinClass: 'economy',
        isRealApi: (outboundFlight as any)?.isRealApi === true && outboundOrigin !== outboundDest,
        isEstimate: (outboundFlight as any)?.isEstimate === true || (outboundFlight as any)?.isRealApi === false || outboundOrigin === outboundDest,
      },
    },
    ...(inboundFlight ? [{
      type: 'TRANSPORT' as any,
      providerId: (inboundFlight as any)?.providerId || 'prov-aerocaribe',
      offerId: inboundOfferId,
      description: `Vuelo ${inboundFlight?.airline || 'Retorno'}: ${tripDraft.destination} ➔ ${tripDraft.origin}`,
      quantity: travelers,
      unitPrice: inboundPerPerson,
      metadata: {
        originAirport: inboundOrigin,
        destinationAirport: inboundDest,
        departureDate: tripDraft.endDate || tripDraft.startDate,
        flightNumber: inboundFlightNum,
        airline: inboundFlight?.airline || 'Aerolínea',
        cabinClass: 'economy',
        isRealApi: (inboundFlight as any)?.isRealApi === true && inboundOrigin !== inboundDest,
        isEstimate: (inboundFlight as any)?.isEstimate === true || (inboundFlight as any)?.isRealApi === false || inboundOrigin === inboundDest,
      },
    }] : []),
    {
      type: 'ACCOMMODATION' as any,
      providerId: hotelProviderId,
      offerId: hotelOfferId,
      description: accommodation?.name
        ? `${accommodation.name} (${accommodation.nights || 1} noches)`
        : `Alojamiento en ${tripDraft.destination}`,
      quantity: 1,
      unitPrice: accommodationBudget,
      metadata: {
        city: tripDraft.destination,
        cityCode: (accommodation as any)?.cityCode || tripDraft.destination,
        hotelName: hotelName,
        hotelCode: (accommodation as any)?.hotelCode || (accommodation as any)?.id || hotelOfferId,
        checkInDate: tripDraft.startDate,
        checkOutDate: tripDraft.endDate || tripDraft.startDate,
        roomType: accommodation?.hotelType || 'Standard',
        guests: travelers,
        isRealApi: (accommodation as any)?.isRealApi === true,
        isEstimate: (accommodation as any)?.isEstimate === true,
      },
    },
    ...(activitiesBudget > 0 ? [{
      type: 'ACTIVITY' as any,
      providerId: `prov-${tripDraft.destination.toLowerCase().replace(/[^a-z0-9]/g, '-')}-tours`,
      offerId: `offer-${tripDraft.destination.toLowerCase().replace(/[^a-z0-9]/g, '-')}-exp`,
      description: `Experiencias, gastronomía y actividades en ${tripDraft.destination}`,
      quantity: 1,
      unitPrice: activitiesBudget,
      metadata: {
        city: tripDraft.destination,
      },
    }] : []),
    ...(emergencyBudget > 0 ? [{
      type: 'ACTIVITY' as any,
      providerId: 'prov-wayvo-care',
      offerId: 'offer-emergency-fund',
      description: `Fondo de imprevistos y contingencias estimadas`,
      quantity: 1,
      unitPrice: emergencyBudget,
      metadata: {
        city: tripDraft.destination,
      },
    }] : []),
  ];

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const handleExecuteSaga = async () => {
    setIsProcessing(true);
    setResult(null);
    setErrorStatus(null);
    setSagaStep(1);

    if (appMode === 'DEV') {
      setIsDevInspectorOpen(true);
    }

    const timer = setInterval(() => {
      setSagaStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 700);

    const allPlanEvents = (planResult.itinerary?.days || []).flatMap((d) =>
      (d.events || []).map((evt) => ({
        ...evt,
        dayDate: d.date || tripDraft.startDate,
      }))
    );

    const mappedEvents = allPlanEvents.map((evt, idx) => ({
      type: (((evt.type as any) === 'ACCOMMODATION' ? 'HOTEL' : evt.type) || 'ACTIVITY') as any,
      title: evt.title,
      description: evt.description || '',
      location: evt.location || tripDraft.destination,
      startDateTime: evt.startDateTime || `${evt.dayDate}T09:00:00Z`,
      endDateTime: evt.endDateTime,
      time: evt.time || '09:00 AM',
      order: idx + 1,
      status: 'PENDING',
      reservationStatus: (evt.reservationStatus as any) || 'NOT_RESERVED',
      details: evt.details,
    }));

    const payload: TripCheckoutRequest = {
      userId: tripDraft.userId || 'usr-client',
      currency: 'COP',
      trip: {
        destination: tripDraft.destination,
        startDate: tripDraft.startDate,
        endDate: tripDraft.endDate,
        origin: tripDraft.origin,
        title: tripDraft.title,
        travelers: tripDraft.travelers,
        events: mappedEvents,
      },
      items,
    };

    try {
      const response = await WayvoApi.checkoutTrip(payload);
      clearInterval(timer);
      setSagaStep(4);

      if (response && response.saga) {
        setResult(response.saga);
        setCheckoutResult(response.saga);

        if (response.saga.status === 'CONFIRMED' && response.saga.tripId) {
          try {
            const trip = await WayvoApi.getTrip(response.saga.tripId);
            if (trip && trip.destination === tripDraft.destination && trip.events && trip.events.length > 0) {
              setActiveTrip(trip);
            } else {
              setActiveTrip({
                id: response.saga.tripId,
                userId: tripDraft.userId || 'usr-client',
                title: tripDraft.title || `Viaje a ${tripDraft.destination}`,
                destination: tripDraft.destination,
                origin: tripDraft.origin,
                startDate: tripDraft.startDate,
                endDate: tripDraft.endDate,
                status: 'CONFIRMED',
                events: mappedEvents,
              } as any);
            }
          } catch {
            setActiveTrip({
              id: response.saga.tripId,
              userId: tripDraft.userId || 'usr-client',
              title: tripDraft.title || `Viaje a ${tripDraft.destination}`,
              destination: tripDraft.destination,
              origin: tripDraft.origin,
              startDate: tripDraft.startDate,
              endDate: tripDraft.endDate,
              status: 'CONFIRMED',
              events: mappedEvents,
            } as any);
          }
          await loadUserTrips();
        }
      }
    } catch (err: any) {
      clearInterval(timer);
      // In Saga compensation (409), the response might carry error details
      setErrorStatus(err.message || 'Transacción revertida por compensación');
      setSagaStep(3);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInspectCompensationLog = async () => {
    if (result?.correlationId) {
      try {
        const log = await WayvoApi.getCompensationLog(result.correlationId);
        setCompensationLog(log);
        alert(`Log de Compensación cargado. Pasos ejecutados: ${log.entries?.length || 0}`);
      } catch (e: any) {
        alert(`No se pudo cargar el log de compensación: ${e.message}`);
      }
    }
  };

  return (
    <div className="w-full bg-surface py-8 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-xs uppercase tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              {appMode === 'DEV' ? 'Saga Orchestration • Transacciones Distribuidas' : 'Organizador de Viajes • Wayvo'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-primary">
            {appMode === 'DEV' ? 'Saga Checkout en Vivo & Rollback' : 'Confirmación de Itinerario y Presupuesto'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            {appMode === 'DEV'
              ? 'Orquestación atómica entre Trip Service, Booking Service y Provider Service con garantía de compensación automática ante fallos de inventario.'
              : 'Revisa y confirma los detalles estimados de tu viaje. Recuerda que Wayvo es un organizador integral; no procesamos cobros directos ni comisiones de intermediación.'}
          </p>
        </div>

        {/* Chaos Injection Toggle (in DEV mode) */}
        {appMode === 'DEV' && (
          <div className="flex items-center gap-2 bg-surface-container-low p-2 rounded-xl border border-outline-variant/30">
            <span className="text-xs font-mono text-on-surface-variant">Simular Caos:</span>
            <button
              onClick={() => setChaosMode(chaosMode === 'unavailable' ? 'normal' : 'unavailable')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                chaosMode === 'unavailable'
                  ? 'bg-error text-on-error shadow-sm'
                  : 'bg-surface-container text-primary hover:bg-secondary-fixed'
              }`}
            >
              {chaosMode === 'unavailable' ? 'Caos Activado (Rollback)' : 'Proveedor Normal (201 OK)'}
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Status Banners */}
      {result?.status === 'CONFIRMED' && (
        <div className="stitch-card p-6 bg-surface-container-lowest rounded-xl flex items-start gap-4 border-l-4 border-l-secondary shadow-md animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 text-primary">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-base font-bold text-primary">Reserva Emitida con Éxito</span>
              <span className="px-3 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-xs font-bold">
                PNR: {result.reservationCode || 'AZR-88492-CO'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {appMode === 'DEV'
                ? 'Todos los microservicios y proveedores externos aseguraron la disponibilidad. El orquestador Saga cerró el contexto en estado consolidado.'
                : 'Tus vuelos de ida y vuelta, hospedaje y experiencias han sido confirmados exitosamente. Hemos emitido tus códigos de abordaje y voucher oficial.'}
            </p>
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setCurrentView('ACTIVE_TRIP')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-semibold shadow-sm hover:bg-secondary transition-all"
              >
                <span>Ver Itinerario en Vivo</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                onClick={() => setCurrentView('MY_TRIPS')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container text-primary rounded-xl text-xs font-semibold hover:bg-surface-container-high transition-all border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[16px]">luggage</span>
                <span>Ir al Organizador (Mis Viajes)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {result?.status === 'COMPENSATED' && (
        <div className="stitch-card p-6 bg-surface-container-lowest rounded-xl flex items-start gap-4 border-l-4 border-l-error shadow-md animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center flex-shrink-0 text-error">
            <span className="material-symbols-outlined text-[24px]">published_with_changes</span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-base font-bold text-error">
                {appMode === 'DEV'
                  ? 'Compensación Automática Ejecutada (Saga Rollback)'
                  : 'No se pudo completar la reserva en este momento'}
              </span>
              <span className="px-3 py-0.5 rounded-full bg-error-container text-on-error-container font-mono text-xs font-bold">
                {appMode === 'DEV' ? 'HTTP 409 SAGA_COMPENSATED' : 'Sin cargos realizados'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {appMode === 'DEV'
                ? result?.reason || 'Uno de los proveedores externos no confirmó cupo. El orquestador Saga canceló el viaje y liberó tus reservas provisionales automáticamente.'
                : 'Uno de los cupos con aerolíneas o alojamiento no estuvo disponible de forma inmediata. No se ha aplicado ningún cobro a tu cuenta.'}
            </p>
            <div className="flex items-center gap-4 pt-2">
              {appMode === 'DEV' && (
                <span className="font-mono text-xs text-error flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                  Reversión completada en sub-segundo
                </span>
              )}
              <button
                onClick={handleExecuteSaga}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Reintentar Reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {errorStatus && result?.status !== 'COMPENSATED' && (
        <div className="stitch-card p-6 bg-surface-container-lowest rounded-xl flex items-start gap-4 border-l-4 border-l-amber-500 shadow-md animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-600">
            <span className="material-symbols-outlined text-[24px]">cloud_off</span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-base font-bold text-amber-700">
                {appMode === 'DEV'
                  ? 'Microservicio de Reservas Fuera de Línea'
                  : 'Servicio de reservas temporalmente no disponible'}
              </span>
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-800 font-mono text-xs font-bold">
                {appMode === 'DEV' ? 'HTTP 503 SERVICE_UNAVAILABLE' : 'Intenta nuevamente'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {errorStatus}
            </p>
            {appMode === 'DEV' && (
              <p className="text-[11px] text-on-surface-variant/80 font-mono bg-surface-container-low p-2 rounded mt-1">
                Tip de Desarrollo: Asegúrate de que los microservicios estén iniciados (<span className="text-primary font-semibold">npm run dev:services</span> o <span className="text-primary font-semibold">docker compose up -d</span>).
              </p>
            )}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleExecuteSaga}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-secondary transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>Reintentar Conexión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Visualizador o Verificación (8 cols) + Resumen de Pago (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dev Saga Orchestrator or User Verification Panel */}
        <div className="lg:col-span-8 stitch-card p-6 md:p-8 bg-surface-container-lowest rounded-2xl flex flex-col gap-6">
          {appMode === 'DEV' ? (
            <>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-secondary uppercase font-semibold tracking-wider">
                    Flujo de Estados Saga
                  </span>
                  <span className="text-lg font-bold text-primary">Visualizador del Orquestador Reactivo</span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="font-mono text-xs text-on-surface-variant">Graph-ID: #saga-core</span>
                </div>
              </div>

              {/* Stepper Vertical Dev */}
              <div className="relative py-2">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-surface-container-highest z-0"></div>
                <div className="flex flex-col gap-6 relative z-10">
                  {/* Node 1: Trip Service */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        sagaStep >= 1
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">account_tree</span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">1. Trip Service</span>
                          <span className="font-mono text-xs text-on-surface-variant">POST /api/v1/trips</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-mono text-xs font-semibold">
                          {sagaStep >= 1 ? '201 CREATED' : 'STANDBY'}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        Inicialización del contexto de viaje en estado PENDING y asignación de identificador único.
                      </p>
                    </div>
                  </div>

                  {/* Node 2: Booking Service */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        sagaStep >= 2
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">bookmark_add</span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">2. Booking Service</span>
                          <span className="font-mono text-xs text-on-surface-variant">POST /api/v1/bookings</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-mono text-xs font-semibold">
                          {sagaStep >= 2 ? '201 PENDING' : 'STANDBY'}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        Creación de la reserva y persistencia de items con Correlation ID trazable.
                      </p>
                    </div>
                  </div>

                  {/* Node 3: Provider Service */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        sagaStep >= 3
                          ? result?.status === 'COMPENSATED' || errorStatus
                            ? 'bg-error text-on-error shadow-sm'
                            : 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">3. Provider Service</span>
                          <span className="font-mono text-xs text-on-surface-variant">POST /api/v1/providers/reserve</span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold ${
                            result?.status === 'COMPENSATED' || errorStatus
                              ? 'bg-error-container text-error'
                              : sagaStep >= 3
                              ? 'bg-surface-container-highest text-primary'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          {result?.status === 'COMPENSATED' || errorStatus
                            ? '409 COMPENSATED'
                            : sagaStep >= 3
                            ? '200 RESERVED'
                            : 'STANDBY'}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {result?.status === 'COMPENSATED' || errorStatus
                          ? 'Proveedor no disponible. Se disparó rollback automático liberando viaje y reserva.'
                          : 'Verificación de catálogo y reserva de cupos atómicos con proveedores externos.'}
                      </p>
                    </div>
                  </div>

                  {/* Node 4: Confirm Trip */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        sagaStep >= 4 && result?.status === 'CONFIRMED'
                          ? 'bg-secondary text-on-secondary shadow-sm'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">verified_user</span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">4. Confirmación Final</span>
                          <span className="font-mono text-xs text-on-surface-variant">POST /api/v1/trips/:id/confirm</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-mono text-xs font-semibold">
                          {sagaStep >= 4 && result?.status === 'CONFIRMED' ? 'CONFIRMED' : 'STANDBY'}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        Bloqueo de pago y transición del viaje a estado activo consolidado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* USER MODE: Clean, Reassuring Booking Verification Panel */
            <>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-secondary uppercase font-semibold tracking-wider">
                    Detalles del Viaje a Confirmar
                  </span>
                  <span className="text-lg font-bold text-primary">Verificación y Cobertura de tu Viaje</span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full text-xs text-secondary font-medium">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Disponibilidad en Tiempo Real</span>
                </div>
              </div>

              {/* Verified Trip Elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Outbound Flight */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[16px]">flight_takeoff</span>
                        Vuelo de Ida
                      </span>
                      <span className="text-[11px] font-mono text-secondary font-semibold">Directo</span>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {tripDraft.origin || 'Bogotá'} ➔ {tripDraft.destination}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Fecha: {tripDraft.startDate} • Salida 08:00 AM • Equipaje incluido.
                    </p>
                  </div>
                </div>

                {/* Return Flight */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[16px]">flight_land</span>
                        Vuelo de Regreso
                      </span>
                      <span className="text-[11px] font-mono text-secondary font-semibold">Directo</span>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {tripDraft.destination} ➔ {tripDraft.origin || 'Bogotá'}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Fecha: {tripDraft.endDate} • Salida 06:30 PM • Asientos contiguos.
                    </p>
                  </div>
                </div>

                {/* Hotel */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[16px]">hotel</span>
                      Hospedaje Seleccionado
                    </span>
                    <span className="text-[11px] font-semibold text-secondary">
                      {accommodation?.nights || 1} noches
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    {accommodation?.name || `Alojamiento en ${tripDraft.destination}`}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Check-in: {tripDraft.startDate} — Check-out: {tripDraft.endDate} • {accommodation?.rooms || 1} habitación(es) • {formatCOP(accommodationBudget)}.
                  </p>
                </div>

                {/* Experiencias y Gastronomía si existen */}
                {activitiesBudget > 0 && (
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[16px]">attractions</span>
                        Experiencias & Gastronomía
                      </span>
                      <span className="text-[11px] font-mono text-secondary font-semibold">Estimado Sugerido</span>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      Actividades, tours y presupuesto gastronómico en {tripDraft.destination}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Estimación: {formatCOP(activitiesBudget)} distribuidos en tu cronograma de viaje.
                    </p>
                  </div>
                )}
              </div>

              {/* Wayvo Traveler Guarantee Checklist */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  Beneficios y Garantías Incluidas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                    <span>Sin cobros ocultos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">support_agent</span>
                    <span>Concierge 24/7 en destino</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">security</span>
                    <span>Cancelación protegida</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Order Summary & Checkout Trigger */}
        <div className="lg:col-span-4 stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col gap-6">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-secondary text-[22px]">receipt_long</span>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Resumen de Presupuesto Estimado</h3>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs pb-3 border-b border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-semibold text-primary">{item.description}</span>
                  <span className="text-[11px] text-on-surface-variant">
                    {item.quantity} unidad(es)
                  </span>
                </div>
                <span className="font-mono font-bold text-primary">
                  {formatCOP(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 pt-2 border-t border-outline-variant/30">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-on-surface">Presupuesto Total Estimado</span>
              <span className="text-2xl font-extrabold text-primary font-mono">
                {formatCOP(totalAmount)}
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant">
              (Estimado aproximado • Wayvo es un gestor y no cobra nada)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-[11px] text-on-surface-variant leading-relaxed">
            💡 <strong>Nota del gestor:</strong> Wayvo no realiza ningún cobro ni cobra comisiones. Este valor es una estimación aproximada para ayudarte a organizar y presupuestar tu viaje.
          </div>

          <button
            onClick={handleExecuteSaga}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                <span>{appMode === 'DEV' ? 'Orquestando Saga Distribuida...' : 'Guardando y confirmando en tu organizador...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>{appMode === 'DEV' ? 'Confirmar Itinerario (Saga Transaccional)' : 'Confirmar Viaje'}</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-on-surface-variant text-center">
            {appMode === 'DEV'
              ? 'Petición enrutada mediante el API Gateway Facade hacia el Saga Orchestrator.'
              : 'Al confirmar, tu viaje se guardará en tu organizador para seguimiento de cada evento.'}
          </p>
        </div>
      </div>
    </div>
  );
};
