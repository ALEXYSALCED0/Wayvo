import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import { TripCheckoutRequest, ConfirmTripSagaResult } from '@wayvo/contracts';

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

  const { tripDraft, suggestedBookingItems } = planResult;
  const items = suggestedBookingItems && suggestedBookingItems.length > 0 ? suggestedBookingItems : [
    {
      type: 'TRANSPORT' as any,
      providerId: 'prov-aerocaribe',
      offerId: 'offer-aerocaribe-bog-ctg-am',
      description: `Vuelo Bogotá - ${tripDraft.destination}`,
      quantity: tripDraft.travelers || 2,
      unitPrice: 320000,
    },
    {
      type: 'ACCOMMODATION' as any,
      providerId: 'prov-hotel-colonial',
      offerId: 'offer-colonial-standard',
      description: `Hotel Colonial en ${tripDraft.destination}`,
      quantity: 1,
      unitPrice: 420000,
    },
  ];

  const totalAmount = items.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);

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
            setActiveTrip(trip);
          } catch {
            setActiveTrip({
              id: response.saga.tripId,
              userId: tripDraft.userId || 'usr-client',
              title: tripDraft.title || `Viaje a ${tripDraft.destination}`,
              destination: tripDraft.destination,
              startDate: tripDraft.startDate,
              endDate: tripDraft.endDate,
              status: 'CONFIRMED',
              events: planResult.itinerary?.days?.flatMap((d) => d.events) || [],
            } as any);
          }
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
              {appMode === 'DEV' ? 'Saga Orchestration • Transacciones Distribuidas' : 'Confirmación Segura de Reserva'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-primary">
            {appMode === 'DEV' ? 'Saga Checkout en Vivo & Rollback' : 'Reserva de Vuelos y Hospedaje'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            {appMode === 'DEV'
              ? 'Orquestación atómica entre Trip Service, Booking Service y Provider Service con garantía de compensación automática ante fallos de inventario.'
              : 'Verifica los detalles de tus vuelos y alojamiento antes de confirmar. Tu reserva está respaldada y protegida.'}
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

      {/* Dynamic Status Banners (Stitch checkout.html) */}
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
              Todos los microservicios y proveedores externos aseguraron la disponibilidad. El orquestador Saga cerró el contexto en estado consolidado.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setCurrentView('ACTIVE_TRIP')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold shadow-sm hover:bg-secondary transition-colors"
              >
                <span>Ver mi Viaje en Vivo</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {(result?.status === 'COMPENSATED' || errorStatus) && (
        <div className="stitch-card p-6 bg-surface-container-lowest rounded-xl flex items-start gap-4 border-l-4 border-l-error shadow-md animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center flex-shrink-0 text-error">
            <span className="material-symbols-outlined text-[24px]">published_with_changes</span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-base font-bold text-error">
                Compensación Automática Ejecutada (Saga Rollback)
              </span>
              <span className="px-3 py-0.5 rounded-full bg-error-container text-on-error-container font-mono text-xs font-bold">
                HTTP 409 SAGA_COMPENSATED
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {result?.reason || errorStatus || 'Uno de los proveedores externos no confirmó cupo. El orquestador Saga canceló el viaje y liberó tus reservas provisionales automáticamente.'}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <span className="font-mono text-xs text-error flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                Reversión completada en sub-segundo
              </span>
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

      {/* Main Grid: Visualizador del Orquestador (8 cols) + Resumen de Pago (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visualizador del Orquestador Reactivo (Stitch timeline) */}
        <div className="lg:col-span-8 stitch-card p-6 md:p-8 bg-surface-container-lowest rounded-2xl flex flex-col gap-6">
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

          {/* Stepper Vertical */}
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
        </div>

        {/* Right Column: Order Summary & Checkout Trigger */}
        <div className="lg:col-span-4 stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col gap-6">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-secondary text-[22px]">receipt_long</span>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Resumen de Reserva</h3>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs pb-3 border-b border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-semibold text-primary">{item.description}</span>
                  <span className="text-[11px] text-on-surface-variant">
                    {item.quantity} unidad(es) • Prov: {item.providerId}
                  </span>
                </div>
                <span className="font-mono font-bold text-primary">
                  {formatCOP(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-semibold text-on-surface">Total Liquidado</span>
            <span className="text-2xl font-extrabold text-primary font-mono">
              {formatCOP(totalAmount)}
            </span>
          </div>

          <button
            onClick={handleExecuteSaga}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                <span>{appMode === 'DEV' ? 'Orquestando Saga Distribuida...' : 'Confirmando tu reserva segura...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">lock</span>
                <span>{appMode === 'DEV' ? 'Ejecutar Reserva con Saga Transaccional' : 'Confirmar y Reservar Viaje'}</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-on-surface-variant text-center">
            {appMode === 'DEV'
              ? 'Petición enrutada mediante el API Gateway Facade hacia el Saga Orchestrator.'
              : 'Transacción cifrada y protegida. Disponibilidad garantizada en tiempo real.'}
          </p>
        </div>
      </div>
    </div>
  );
};
