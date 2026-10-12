import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const ProposalView: React.FC = () => {
  const { planResult, setCurrentView, appMode } = useApp();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  if (!planResult) {
    return (
      <div className="w-full max-w-4xl mx-auto my-16 p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-secondary mb-3">travel_explore</span>
        <h2 className="text-xl font-bold text-primary mb-2">No hay un itinerario activo</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Por favor inicia el flujo de planificación con IA para generar tu propuesta personalizada.
        </p>
        <button
          onClick={() => setCurrentView('ONBOARDING')}
          className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-sm font-semibold hover:bg-primary transition-all shadow-sm"
        >
          Ir a Onboarding & Psicometría
        </button>
      </div>
    );
  }

  const { tripDraft, personality, itinerary, budget, suggestedBookingItems } = planResult;
  const days = itinerary?.days || [];
  const activeDay = days[selectedDayIndex] || days[0];

  const formatCOP = (val?: number) => {
    if (!val) return '$0 COP';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="w-full bg-surface pb-12 animate-fade-in">
      {/* Top Context Header & Flight Telemetry Bar (from Stitch proposal.html) */}
      <section className="w-full px-4 md:px-8 py-4 bg-surface-container-low border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-xs uppercase tracking-wider font-semibold">
              Plan ID: #{tripDraft.destination.slice(0, 3).toUpperCase()}-{Date.now().toString().slice(-4)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-primary">{tripDraft.origin || 'Bogotá (BOG)'}</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">arrow_right_alt</span>
              <span className="text-lg font-semibold text-primary">{tripDraft.destination}</span>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>{tripDraft.startDate} — {tripDraft.endDate}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest text-primary text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              <span>{appMode === 'DEV' ? 'LangGraph State: PROPOSAL_READY' : 'Itinerario Personalizado Listo'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout (Stitch: 8 cols left, 4 cols right) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 flex flex-col lg:flex-row gap-8">
        {/* Left Column (8 cols): Profiler Card + Day Timeline + Bookable Units */}
        <div className="w-full lg:w-8/12 flex flex-col gap-8">
          {/* 1. Tarjeta de Personalidad del Viaje (ProfilerAgent) */}
          <article className="stitch-card p-6 md:p-8 bg-surface-container rounded-2xl relative overflow-hidden border border-outline-variant/30">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">psychology</span>
                  <span className="font-mono text-xs uppercase tracking-wider text-secondary font-semibold">
                    ProfilerAgent Síntesis Psicométrica
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-primary">
                  {personality?.analyzedStyle || 'Explorador Cultural Gastronómico'}
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {personality?.traitSummary ||
                    'Itinerario equilibrado combinando patrimonio histórico, gastronomía marina y descansos programados para optimizar el gasto energético.'}
                </p>
              </div>

              {/* Score & Balance Meter */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-2 bg-surface-container-lowest p-4 rounded-xl shadow-sm shrink-0 border border-outline-variant/20">
                <div className="text-left md:text-right">
                  <span className="text-[11px] text-on-surface-variant block uppercase tracking-wide font-medium">
                    Afinidad Neuro-Viajera
                  </span>
                  <span className="text-3xl font-extrabold text-primary">94%</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-surface-container text-secondary font-mono text-xs font-semibold">
                  Calibración Alta
                </span>
              </div>
            </div>

            {/* Metrics Ribbons */}
            <div className="mt-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant/20">
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-on-surface">Ritmo Equilibrado</span>
                  <span className="font-mono text-xs text-secondary font-semibold">65% Actividad • 35% Relax</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden flex">
                  <div className="bg-primary h-full rounded-l-full" style={{ width: '65%' }}></div>
                  <div className="bg-secondary-container h-full rounded-r-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-on-surface">Frecuencia Sensorial</span>
                  <span className="font-mono text-xs text-secondary font-semibold">Gastronomía & Cultura</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">restaurant</span>
                    <span>Reservas de Autor</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">museum</span>
                    <span>Tours Culturales</span>
                  </span>
                </div>
              </div>
            </div>
          </article>

          {/* 2. Timeline Día por Día interactivo */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-secondary font-semibold">
                  Secuencia Operativa
                </span>
                <h3 className="text-xl font-bold text-primary">Cronograma Diario Calibrado</h3>
              </div>
              <span className="text-xs text-on-surface-variant hidden sm:inline">Zona horaria: COT (UTC-5)</span>
            </div>

            {/* Day Selector Tabs (Stitch Pills) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {days.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={day.dayNumber || idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container'
                    }`}
                  >
                    Día {day.dayNumber || idx + 1}: {day.title?.split(':')[1] || day.title || `Día ${idx + 1}`}
                  </button>
                );
              })}
            </div>

            {/* Events Timeline for Selected Day */}
            <div className="flex flex-col gap-3">
              {activeDay?.events && activeDay.events.length > 0 ? (
                activeDay.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="stitch-card p-4 rounded-xl bg-surface-container-lowest flex items-start justify-between gap-4 hover:border-secondary transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">
                          {evt.type === 'FLIGHT' ? 'flight' : evt.type === 'HOTEL' ? 'hotel' : evt.type === 'MEAL' ? 'restaurant' : 'local_activity'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-secondary">{evt.time || 'Horario Flexible'}</span>
                          <span className="text-xs font-semibold text-primary">{evt.title}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant">{evt.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-on-surface-variant mt-1">
                          {evt.details?.provider && <span>Operador: {evt.details.provider}</span>}
                          {((evt as any).location || (evt.details as any)?.location) && (
                            <span>Ubicación: {(evt as any).location || (evt.details as any)?.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-primary block">
                        {evt.details?.price ? formatCOP(evt.details.price) : 'Incluido'}
                      </span>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-container text-secondary font-medium">
                        {evt.statusLabel || 'PROGRAMADO'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                  Sin eventos programados para este día.
                </div>
              )}
            </div>
          </section>

          {/* 3. Bookable Units (Flights & Accommodation) */}
          <section className="flex flex-col gap-4">
            <span className="font-mono text-xs uppercase tracking-wider text-secondary font-semibold">
              Inventario Confirmable
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Flight Card */}
              <div className="stitch-card p-5 bg-surface-container-lowest rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-mono font-semibold">
                      Vuelo Directo
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">AV9543</span>
                  </div>
                  <h4 className="text-sm font-bold text-primary mb-1">
                    {tripDraft.origin || 'Bogotá'} ➔ {tripDraft.destination}
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-4">
                    Avianca Airlines • Equipaje de mano y bodega incluido.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 text-xs">
                  <span className="text-on-surface-variant">2 Pasajeros</span>
                  <span className="font-mono font-bold text-primary">{formatCOP(640000)}</span>
                </div>
              </div>

              {/* Hotel Card */}
              <div className="stitch-card p-5 bg-surface-container-lowest rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-mono font-semibold">
                      Alojamiento 4★
                    </span>
                    <span className="text-xs text-secondary font-semibold">Desayuno Incluido</span>
                  </div>
                  <h4 className="text-sm font-bold text-primary mb-1">Hotel Colonial Cartagena</h4>
                  <p className="text-xs text-on-surface-variant mb-4">
                    Centro Histórico • Habitación Estándar Climatizada con balcón.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 text-xs">
                  <span className="text-on-surface-variant">4 Noches</span>
                  <span className="font-mono font-bold text-primary">{formatCOP(1260000)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Budget Optimizer Breakdown & Saga Checkout Trigger */}
        <div className="w-full lg:w-4/12 flex flex-col gap-6">
          {/* Budget Breakdown Card */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl sticky top-28">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-[22px]">account_balance_wallet</span>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                Arquitectura Presupuestal
              </h3>
            </div>

            <div className="mb-6">
              <span className="text-xs text-on-surface-variant block mb-1">Costo Total Estimado</span>
              <span className="text-3xl font-extrabold text-primary font-mono block">
                {formatCOP(budget?.estimatedTotalCost || 3500000)}
              </span>
              <span className="text-xs text-secondary font-medium">Moneda Base: COP ($)</span>
            </div>

            {/* Breakdown bars */}
            <div className="flex flex-col gap-3 text-xs mb-6">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-on-surface-variant">Transporte Aéreo</span>
                  <span className="font-mono font-semibold text-primary">
                    {formatCOP(budget?.breakdown?.transport || 1200000)}
                  </span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-on-surface-variant">Alojamiento (4 Noches)</span>
                  <span className="font-mono font-semibold text-primary">
                    {formatCOP(budget?.breakdown?.accommodation || 1260000)}
                  </span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-on-surface-variant">Experiencias & Gastronomía</span>
                  <span className="font-mono font-semibold text-primary">
                    {formatCOP(budget?.breakdown?.activities || 700000)}
                  </span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary-container h-full" style={{ width: '20%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-on-surface-variant">Fondo Imprevistos</span>
                  <span className="font-mono font-semibold text-primary">
                    {formatCOP(budget?.breakdown?.emergencyFund || 340000)}
                  </span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-outline-variant h-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>

            {/* Primary CTA: Proceed to Saga Checkout */}
            <button
              onClick={() => setCurrentView('CHECKOUT')}
              className="w-full py-3.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 mb-3"
            >
              <span>Proceder al Checkout (Saga)</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            {/* Saga Guarantee Tag */}
            <div className="p-3 rounded-lg bg-surface-container-low flex items-center gap-2.5 text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0">shield_lock</span>
              <span>Blindado con Orquestación Saga Transaccional con Compensación Automática.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
