import React, { useState } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2, AlertTriangle, Plane, Utensils, Hotel, Compass, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IncidentModal } from './IncidentModal';
import { Event, Trip } from '@wayvo/contracts';

export function ActiveTripView() {
  const { activeTrip, setActiveTrip, setCurrentView, appMode } = useApp();

  const [incidentTargetEvent, setIncidentTargetEvent] = useState<Event | null>(null);

  if (!activeTrip) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No hay ningún viaje activo en este momento.
        <br />
        <button
          onClick={() => setCurrentView('ONBOARDING')}
          style={{ marginTop: '16px', color: 'var(--color-primary)', fontWeight: 600 }}
        >
          Planificar un nuevo viaje
        </button>
      </div>
    );
  }

  const events = activeTrip.events || [];

  return (
    <div style={{ flex: 1, padding: '32px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Back button */}
      <button
        onClick={() => setCurrentView('LANDING')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '13px',
          marginBottom: '16px',
        }}
      >
        <ArrowLeft size={16} />
        <span>Volver a Inicio</span>
      </button>

      {/* Trip Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Viaje Activo • Gestión en Vivo
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#fff' }}>{activeTrip.title || `Viaje a ${activeTrip.destination}`}</h2>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--color-success)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {activeTrip.status || 'CONFIRMED'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} color="var(--color-primary)" />
            <span>Destino: {activeTrip.destination}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="var(--color-primary)" />
            <span>{activeTrip.startDate} — {activeTrip.endDate}</span>
          </span>
        </div>
      </div>

      {/* Events Timeline */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--color-primary)" />
            <span>Timeline Cronológico de Actividades</span>
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{events.length} Eventos Programados</span>
        </div>

        {events.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
            No hay eventos cargados para este viaje.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {events.map((evt: Event, index: number) => {
              const isIssue = evt.status === 'ISSUE';
              const isCancelled = evt.status === 'CANCELLED';
              const isCompleted = evt.status === 'COMPLETED';

              return (
                <div
                  key={evt.id || index}
                  style={{
                    background: isIssue ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${
                      isIssue ? 'var(--color-danger)' : isCancelled ? 'var(--border-subtle)' : 'var(--border-light)'
                    }`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    opacity: isCancelled ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: isIssue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isIssue ? 'var(--color-danger)' : 'var(--color-primary)',
                        flexShrink: 0,
                      }}
                    >
                      {evt.type === 'FLIGHT' || evt.type === 'TRANSPORT' ? (
                        <Plane size={18} />
                      ) : evt.type === 'MEAL' ? (
                        <Utensils size={18} />
                      ) : evt.type === 'HOTEL' ? (
                        <Hotel size={18} />
                      ) : (
                        <Compass size={18} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#fff',
                            textDecoration: isCancelled ? 'line-through' : 'none',
                          }}
                        >
                          {evt.title}
                        </h4>

                        {/* Status Badges */}
                        {isIssue && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--color-danger)', color: '#fff', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                            DISRUPCIÓN REPORTADA
                          </span>
                        )}
                        {isCancelled && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--border-light)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                            CANCELADO / SUSTITUIDO
                          </span>
                        )}
                        {evt.isAlternative && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                            NUEVA RUTA INYECTADA
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {evt.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-dim)' }}>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{evt.time}</span>
                        {evt.location && <span>• {evt.location}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Incident Report Button */}
                  {!isCancelled && (
                    <div>
                      <button
                        onClick={() => setIncidentTargetEvent(evt)}
                        style={{
                          background: isIssue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                          border: `1px solid ${isIssue ? 'var(--color-danger)' : 'rgba(245, 158, 11, 0.3)'}`,
                          color: isIssue ? 'var(--color-danger)' : 'var(--color-warning)',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <AlertTriangle size={13} />
                        <span>{isIssue ? 'Ver Alternativas' : 'Reportar Imprevisto'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Incident Modal (Mediator Flow) */}
      {incidentTargetEvent && (
        <IncidentModal
          tripId={activeTrip.id}
          eventId={incidentTargetEvent.id}
          eventTitle={incidentTargetEvent.title}
          onClose={() => setIncidentTargetEvent(null)}
          onResolved={(updated) => {
            setActiveTrip(updated);
            setIncidentTargetEvent(null);
          }}
        />
      )}
    </div>
  );
}
