import React, { useState } from 'react';
import { Compass, DollarSign, Calendar, Clock, MapPin, CheckCircle, ArrowRight, Sparkles, Shield, Utensils, Plane, Hotel } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function ProposalView() {
  const { planResult, setCurrentView } = useApp();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  if (!planResult) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No hay un plan activo actualmente.
        <br />
        <button
          onClick={() => setCurrentView('ONBOARDING')}
          style={{ marginTop: '16px', color: 'var(--color-primary)', fontWeight: 600 }}
        >
          Volver a Planificar
        </button>
      </div>
    );
  }

  const { personality, budget, transport, itinerary, suggestedBookingItems, tripDraft } = planResult;
  const days = itinerary?.days || [];
  const currentDay = days[selectedDayIndex] || days[0];

  return (
    <div style={{ flex: 1, padding: '32px 20px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Title & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Itinerario Multiagente Consolidado
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 800 }}>Viaje a {tripDraft.destination}</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {tripDraft.startDate} al {tripDraft.endDate} • {tripDraft.travelers || 2} Viajeros
          </p>
        </div>

        <button
          onClick={() => setCurrentView('CHECKOUT')}
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            color: '#fff',
            padding: '14px 26px',
            borderRadius: 'var(--radius-full)',
            fontSize: '15px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <span>Continuar al Checkout</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Grid: Personality & Budget Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Personality Insights Card */}
        <div style={{ background: 'var(--bg-card)', padding: '22px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={18} color="var(--color-accent)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Perfil Psicológico Detectado</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-accent)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600 }}>
              Estilo: {personality?.analyzedStyle || 'Cultural'}
            </span>
            <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600 }}>
              Ritmo: {personality?.dominantPace || 'Equilibrado'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {personality?.traitSummary || 'Plan optimizado para una inmersión auténtica y balanceada.'}
          </p>
        </div>

        {/* Budget Breakdown Card */}
        <div style={{ background: 'var(--bg-card)', padding: '22px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--color-success)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Desglose de Presupuesto</h3>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-success)' }}>
              ${Number(budget?.estimatedTotalCost || 0).toLocaleString()} COP
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transporte:</span>
              <div style={{ fontWeight: 700, color: '#fff' }}>${Number(budget?.breakdown?.transport || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Alojamiento:</span>
              <div style={{ fontWeight: 700, color: '#fff' }}>${Number(budget?.breakdown?.accommodation || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Actividades:</span>
              <div style={{ fontWeight: 700, color: '#fff' }}>${Number(budget?.breakdown?.activities || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Alimentación:</span>
              <div style={{ fontWeight: 700, color: '#fff' }}>${Number(budget?.breakdown?.food || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Booking Items Section (Items listos para checkout con proveedores) */}
      {suggestedBookingItems && suggestedBookingItems.length > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--color-primary)" />
              <span>Ofertas Verificadas del Catálogo de Proveedores (Listas para Checkout)</span>
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Cruzadas por provider_catalog_agent
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {suggestedBookingItems.map((item, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{item.providerId}</span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{item.description}</h4>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cant: {item.quantity}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>
                    ${Number(item.unitPrice * item.quantity).toLocaleString()} COP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day by Day Interactive Schedule */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--color-primary)" />
          <span>Cronograma Diario del Itinerario</span>
        </h3>

        {/* Day Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
          {days.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 600,
                background: selectedDayIndex === idx ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedDayIndex === idx ? '#fff' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              Día {day.dayNumber || idx + 1} ({day.date})
            </button>
          ))}
        </div>

        {/* Selected Day Events Feed */}
        {currentDay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentDay.events?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Día libre o sin actividades programadas.</p>
            ) : (
              currentDay.events?.map((evt: any, i: number) => (
                <div
                  key={evt.id || i}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{evt.title}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>{evt.time || 'Horario sugerido'}</span>
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{evt.description}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-dim)' }}>
                      {evt.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} />
                          <span>{evt.location}</span>
                        </span>
                      )}
                      {evt.details?.price && (
                        <span>${Number(evt.details.price).toLocaleString()} COP</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
