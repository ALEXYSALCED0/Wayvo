import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Loader2, RotateCcw, AlertTriangle, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import { TripCheckoutRequest, ConfirmTripSagaResult } from '@wayvo/contracts';

export function CheckoutView() {
  const {
    planResult,
    setCurrentView,
    setActiveTrip,
    setCheckoutResult,
    setCompensationLog,
    appMode,
    setIsDevInspectorOpen,
    chaosMode,
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [sagaStep, setSagaStep] = useState<number>(0);
  const [result, setResult] = useState<ConfirmTripSagaResult | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  if (!planResult) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No hay un viaje para procesar en checkout.
        <br />
        <button
          onClick={() => setCurrentView('ONBOARDING')}
          style={{ marginTop: '16px', color: 'var(--color-primary)', fontWeight: 600 }}
        >
          Ir a Planificar
        </button>
      </div>
    );
  }

  const { tripDraft, suggestedBookingItems, budget } = planResult;
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
          // Fetch the created trip to populate ActiveTrip view
          try {
            const trip = await WayvoApi.getTrip(response.saga.tripId);
            setActiveTrip(trip);
          } catch {
            // Fallback trip mock if query fails
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
      setErrorStatus(err.message);
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
    <div style={{ flex: 1, padding: '32px 20px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Confirmación y Checkout del Viaje</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Transacción distribuida mediante el patrón <strong>Saga con Orquestación</strong>.
        </p>
      </div>

      {/* Order Summary Card */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>Resumen de Reservas a Confirmar</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: '#fff' }}>{item.description}</span>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Proveedor: {item.providerId} • Cantidad: {item.quantity}
                </div>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                ${Number(item.unitPrice * item.quantity).toLocaleString()} COP
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Total a Pagar</span>
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-success)' }}>
            ${Number(totalAmount).toLocaleString()} COP
          </span>
        </div>
      </div>

      {/* Saga Execution Stepper Card */}
      {(isProcessing || result) && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--color-primary)" />
            <span>Progreso de la Transacción Distribuida (Saga Orchestrator)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: sagaStep >= 1 ? 'var(--color-success)' : 'var(--text-dim)' }}>
              {sagaStep >= 1 ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--text-dim)' }} />}
              <span>1. [Trip Service] Creando viaje en estado PENDING</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: sagaStep >= 2 ? 'var(--color-success)' : 'var(--text-dim)' }}>
              {sagaStep >= 2 ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--text-dim)' }} />}
              <span>2. [Booking Service] Registrando reserva en estado PENDING</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: sagaStep >= 3 ? (result?.status === 'COMPENSATED' ? 'var(--color-danger)' : 'var(--color-success)') : 'var(--text-dim)' }}>
              {sagaStep >= 3 ? (result?.status === 'COMPENSATED' ? <XCircle size={16} /> : <CheckCircle2 size={16} />) : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--text-dim)' }} />}
              <span>3. [Provider Service] Bloqueando cupo con proveedores externos</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: result?.status === 'CONFIRMED' ? 'var(--color-success)' : result?.status === 'COMPENSATED' ? 'var(--color-warning)' : 'var(--text-dim)' }}>
              {result?.status === 'CONFIRMED' ? (
                <CheckCircle2 size={16} color="var(--color-success)" />
              ) : result?.status === 'COMPENSATED' ? (
                <RotateCcw size={16} color="var(--color-warning)" />
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--text-dim)' }} />
              )}
              <span>
                {result?.status === 'CONFIRMED'
                  ? '4. Confirmación Global (Trip & Booking CONFIRMED)'
                  : result?.status === 'COMPENSATED'
                  ? '4. 🔄 Rollback Compensatorio LIFO: Cancelación de reserva y viaje completada'
                  : '4. Finalizando transacción'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Outcome Results */}
      {result && result.status === 'CONFIRMED' && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>¡Viaje Confirmado con Éxito!</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Tu código oficial de reserva es: <strong style={{ color: 'var(--color-success)' }}>{result.reservationCode}</strong>
          </p>

          <button
            onClick={() => setCurrentView('ACTIVE_TRIP')}
            style={{
              background: 'var(--color-success)',
              color: '#000',
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              fontSize: '15px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Ver mi Viaje en el Timeline Activo</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {result && result.status === 'COMPENSATED' && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <RotateCcw size={28} color="var(--color-warning)" />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Saga Compensada (Rollback Automático Exitoso)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Fallo en el paso: <strong>{result.failedStep}</strong> ({result.reason || 'Sin cupo disponible'}).
              </p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '16px' }}>
            Gracias al patrón Saga, el viaje y la reserva fueron cancelados automáticamente sin cobrar cargos indebidos.
            Tus fondos y estado se mantienen íntegros y consistentes.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleInspectCompensationLog}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <FileText size={14} />
              <span>Ver Compensation Log de Auditoría</span>
            </button>
          </div>
        </div>
      )}

      {/* Action CTA Button */}
      {!result && (
        <button
          onClick={handleExecuteSaga}
          disabled={isProcessing}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            color: '#fff',
            padding: '16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '16px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-glow)',
            opacity: isProcessing ? 0.7 : 1,
          }}
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Orquestando Saga Distribuida...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>Confirmar y Reservar Viaje (Ejecutar Saga)</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
