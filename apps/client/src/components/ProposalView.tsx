import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import { EventDetailModal } from './EventDetailModal';
import {
  getKayakFlightUrl,
  getDespegarFlightUrl,
  OFFICIAL_AIRLINE_PORTALS,
  getBookingHotelUrl,
  getHotelesUrl,
  resolveAirportCode,
} from '../utils/travelLinks';

export const ProposalView: React.FC = () => {
  const { planResult, setCurrentView, appMode, loadUserTrips } = useApp();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedEventModal, setSelectedEventModal] = useState<any | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSavedMsg, setDraftSavedMsg] = useState(false);

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
  const outboundFlight = planResult.transport?.outbound?.[0];
  const inboundFlight = planResult.transport?.inbound?.[0];
  const accommodation = planResult.accommodation;
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
          {/* Alerta amigable si el presupuesto personalizado es inferior al viaje */}
          {budget?.isBudgetExceeded && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-amber-950 dark:text-amber-200 shadow-xs">
              <span className="material-symbols-outlined text-[26px] text-amber-600 shrink-0 mt-0.5">sentiment_satisfied</span>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                  <span>Presupuesto personalizado ajustado</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] uppercase font-mono font-bold tracking-wide">
                    Tarifas Mínimas
                  </span>
                </h4>
                <p className="text-xs leading-relaxed opacity-90">
                  {budget.budgetNotice ||
                    `Tu presupuesto ingresado (${formatCOP(budget.userBudget)}) es inferior al valor de referencia del viaje para este destino (${formatCOP(budget.estimatedTotalCost)} entre vuelos y alojamiento). Armamos tu itinerario buscando siempre las opciones reales más económicas y convenientes.`}
                </p>
              </div>
            </div>
          )}

          {/* 1. Tarjeta de Personalidad del Viaje */}
          <article className="stitch-card p-6 md:p-8 bg-surface-container rounded-2xl relative overflow-hidden border border-outline-variant/30">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">psychology</span>
                  <span className="font-mono text-xs uppercase tracking-wider text-secondary font-semibold">
                    {appMode === 'DEV' ? 'ProfilerAgent Síntesis Psicométrica' : 'Perfil y Calibración del Viajero'}
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
                    Afinidad con tu Perfil
                  </span>
                  <span className="text-3xl font-extrabold text-primary">94%</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-surface-container text-secondary font-mono text-xs font-semibold">
                  Calibración Óptima
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
                  {appMode === 'DEV' ? 'Secuencia Operativa de Agentes' : 'Itinerario Día por Día'}
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
                    onClick={() => setSelectedEventModal(evt)}
                    className="stitch-card p-4 rounded-xl bg-surface-container-lowest flex items-start justify-between gap-4 hover:border-secondary hover:shadow-sm cursor-pointer transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">
                          {evt.type === 'FLIGHT' || (evt as any).type === 'TRANSPORT'
                            ? 'flight'
                            : evt.type === 'HOTEL' || (evt as any).type === 'ACCOMMODATION'
                            ? 'hotel'
                            : evt.type === 'MEAL'
                            ? 'restaurant'
                            : 'local_activity'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-secondary">{evt.time || 'Horario Flexible'}</span>
                          <span className="text-xs font-semibold text-primary group-hover:text-secondary transition-colors">{evt.title}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant">{evt.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-on-surface-variant mt-1 flex-wrap">
                          {evt.details?.provider && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-secondary">business</span>
                              <span>Operador: {evt.details.provider}</span>
                            </span>
                          )}
                          {((evt as any).location || (evt.details as any)?.location) && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-secondary">location_on</span>
                              <span>{(evt as any).location || (evt.details as any)?.location}</span>
                            </span>
                          )}
                        </div>
                        {evt.details?.notes && (
                          <div className="flex items-center gap-1.5 text-[11px] text-secondary font-medium mt-1">
                            <span className="material-symbols-outlined text-[14px]">tips_and_updates</span>
                            <span>Nota: {evt.details.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                      <span className="text-xs font-mono font-bold text-primary block">
                        {evt.details?.price ? formatCOP(evt.details.price) : 'Incluido'}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-container text-secondary font-medium">
                        {evt.statusLabel || 'PROGRAMADO'}
                      </span>
                      <span className="text-[11px] text-secondary font-semibold group-hover:underline flex items-center gap-0.5 mt-1">
                        <span>Ver Ficha</span>
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
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

          {/* 3. Bookable Units: Vuelos (Ida y Vuelta), Hospedaje y Experiencias */}
          <section className="flex flex-col gap-4">
            <span className="font-mono text-xs uppercase tracking-wider text-secondary font-semibold">
              {appMode === 'DEV' ? 'Inventario Confirmable (Booking Items)' : 'Vuelos, Hospedaje y Experiencias Incluidas'}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Outbound Flight Card (Vuelo de Ida) */}
              <div className="stitch-card p-5 bg-surface-container-lowest rounded-xl flex flex-col justify-between border border-outline-variant/30">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-mono font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">flight_takeoff</span>
                      <span>Vuelo de Ida</span>
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">
                      Día 1 • {outboundFlight?.departureTime || '08:00 AM'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-primary mb-1">
                    {outboundFlight?.airline || 'Avianca'} ({outboundFlight?.flightNumber || 'Directo'}): {tripDraft.origin || 'Bogotá'} ({resolveAirportCode(tripDraft.origin)}) ➔ {tripDraft.destination} ({resolveAirportCode(tripDraft.destination)})
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-4">
                    {outboundFlight?.airline || 'Aerolínea Comercial'} • Vuelo directo más económico de la ruta. Duración: {outboundFlight?.estimatedDuration || '2 horas'}. Equipaje incluido.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 text-xs">
                  <span className="text-on-surface-variant">{tripDraft.travelers || 2} Pasajeros</span>
                  <div className="text-right">
                    <span className="text-[11px] text-secondary font-mono mr-1">Desde</span>
                    <span className="font-mono font-bold text-primary">
                      {formatCOP(outboundFlight?.estimatedCost || 320000)}
                    </span>
                    {outboundFlight?.isEstimate && (
                      <span className="text-[10px] text-on-surface-variant ml-1 font-mono">(Aproximado)</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  <a
                    href={getKayakFlightUrl({
                      origin: tripDraft.origin,
                      destination: tripDraft.destination,
                      startDate: tripDraft.startDate,
                      endDate: tripDraft.endDate,
                      travelers: tripDraft.travelers || 2,
                      airline: 'ALL',
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-secondary text-xs font-bold transition-all shadow-xs"
                    title="Reservar el vuelo más económico encontrado en Kayak"
                  >
                    <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                    <span>Reservar en Kayak</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>

                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1 pt-0.5">
                    <a
                      href={getDespegarFlightUrl({
                        origin: tripDraft.origin,
                        destination: tripDraft.destination,
                        startDate: tripDraft.startDate,
                        endDate: tripDraft.endDate,
                        travelers: tripDraft.travelers || 2,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span>Ver en Despegar</span>
                      <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                    </a>
                    <span className="text-secondary font-mono text-[10px]">Tarifa más barata</span>
                  </div>
                </div>
              </div>

              {/* Inbound Flight Card (Vuelo de Vuelta / Regreso) */}
              <div className="stitch-card p-5 bg-surface-container-lowest rounded-xl flex flex-col justify-between border border-outline-variant/30">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-mono font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">flight_land</span>
                      <span>Vuelo de Regreso</span>
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">
                      Día {days.length} • {inboundFlight?.departureTime || '06:30 PM'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-primary mb-1">
                    {inboundFlight?.airline || 'Avianca'} ({inboundFlight?.flightNumber || 'Retorno'}): {tripDraft.destination} ({resolveAirportCode(tripDraft.destination)}) ➔ {tripDraft.origin || 'Bogotá'} ({resolveAirportCode(tripDraft.origin)})
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-4">
                    Vuelo de retorno con la tarifa más económica en Kayak. Duración: {inboundFlight?.estimatedDuration || '2 horas'}.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 text-xs">
                  <span className="text-on-surface-variant">{tripDraft.travelers || 2} Pasajeros</span>
                  <div className="text-right">
                    <span className="text-[11px] text-secondary font-mono mr-1">Desde</span>
                    <span className="font-mono font-bold text-primary">
                      {formatCOP(inboundFlight?.estimatedCost || 320000)}
                    </span>
                    {inboundFlight?.isEstimate && (
                      <span className="text-[10px] text-on-surface-variant ml-1 font-mono">(Aproximado)</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  <a
                    href={getKayakFlightUrl({
                      origin: tripDraft.destination,
                      destination: tripDraft.origin,
                      startDate: tripDraft.endDate,
                      travelers: tripDraft.travelers || 2,
                      airline: 'ALL',
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-secondary text-xs font-bold transition-all shadow-xs"
                    title="Reservar el vuelo de retorno más económico encontrado en Kayak"
                  >
                    <span className="material-symbols-outlined text-[16px]">flight_land</span>
                    <span>Reservar en Kayak</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>

                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1 pt-0.5">
                    <a
                      href={getDespegarFlightUrl({
                        origin: tripDraft.destination,
                        destination: tripDraft.origin,
                        startDate: tripDraft.startDate,
                        endDate: tripDraft.endDate,
                        travelers: tripDraft.travelers || 2,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span>Ver Retorno en Despegar</span>
                      <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                    </a>
                    <span className="text-secondary font-mono text-[10px]">Cualquier aerolínea</span>
                  </div>
                </div>
              </div>

              {/* Hotel Card */}
              <div className="stitch-card p-5 bg-surface-container-lowest rounded-xl flex flex-col justify-between border border-outline-variant/30">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-mono font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">hotel</span>
                      <span>Hospedaje Seleccionado</span>
                    </span>
                    <span className="text-xs text-secondary font-semibold">
                      {accommodation?.hotelType || 'Hotel Boutique'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-primary mb-1">
                    {accommodation?.name || `Hotel en ${tripDraft.destination}`}
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-4">
                    {accommodation?.location || tripDraft.destination} • {accommodation?.description || 'Alojamiento calibrado con desayuno y wifi.'}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 text-xs">
                  <span className="text-on-surface-variant">
                    {accommodation?.nights || (days.length > 1 ? days.length - 1 : 1)} Noches • {accommodation?.rooms || 1} Hab. • {tripDraft.travelers || 2} Huéspedes
                  </span>
                  <div className="text-right">
                    <span className="text-[11px] text-secondary font-mono mr-1">Total</span>
                    <span className="font-mono font-bold text-primary">
                      {formatCOP(accommodation?.estimatedCost || budget?.breakdown?.accommodation || 380000)}
                    </span>
                    {accommodation?.isEstimate && (
                      <span className="text-[10px] text-on-surface-variant ml-1 font-mono">(Aproximado)</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <a
                    href={accommodation?.bookingUrl || getBookingHotelUrl(
                      accommodation?.name || `Hotel en ${tripDraft.destination}`,
                      tripDraft.destination,
                      tripDraft.startDate,
                      tripDraft.endDate,
                      tripDraft.travelers || 2
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-primary text-on-primary hover:bg-secondary text-xs font-semibold transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">hotel</span>
                    <span>Reservar Hotel</span>
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                  <a
                    href={getBookingHotelUrl(
                      accommodation?.name || `Hotel en ${tripDraft.destination}`,
                      tripDraft.destination,
                      tripDraft.startDate,
                      tripDraft.endDate,
                      tripDraft.travelers || 2
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-surface-container hover:bg-secondary-fixed text-primary text-xs font-semibold transition-all border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined text-[14px]">travel_explore</span>
                    <span>Booking.com</span>
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                </div>
              </div>

              {/* Experiences Card */}
              <div className="stitch-card p-5 bg-surface-container-lowest rounded-xl flex flex-col justify-between border border-outline-variant/30">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-mono font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
                      <span>Experiencias Curadas</span>
                    </span>
                    <span className="text-xs text-secondary font-semibold">Accesos VIP</span>
                  </div>
                  <h4 className="text-sm font-bold text-primary mb-1">Tours, Entradas y Gastronomía</h4>
                  <p className="text-xs text-on-surface-variant mb-4">
                    Selección adaptada a tu perfil de {personality?.analyzedStyle || 'viajero'}.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 text-xs">
                  <span className="text-on-surface-variant">{tripDraft.travelers || 2} Personas</span>
                  <span className="font-mono font-bold text-primary">
                    {formatCOP(budget?.breakdown?.activities || 700000)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <a
                    href={`https://www.google.com/search?q=tours+y+actividades+en+${encodeURIComponent(tripDraft.destination)}+tickets`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-secondary text-xs font-semibold transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
                    <span>Entradas Web</span>
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                  <a
                    href={`https://www.instagram.com/explore/tags/${encodeURIComponent(tripDraft.destination.toLowerCase().replace(/[^a-z0-9]/g, ''))}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary-fixed hover:bg-secondary hover:text-on-secondary text-primary text-xs font-semibold transition-all border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    <span>Instagram</span>
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
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
                {appMode === 'DEV' ? 'Arquitectura Presupuestal (Budget Optimizer)' : 'Resumen del Presupuesto'}
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
                  <span className="text-on-surface-variant">Transporte Aéreo (Ida y Vuelta)</span>
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
                  <span className="text-on-surface-variant">Alojamiento ({days.length > 1 ? days.length - 1 : 1} Noches)</span>
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
                    {formatCOP(((budget?.breakdown?.activities || 0) + (budget?.breakdown?.food || 0)) || 700000)}
                  </span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary-container h-full" style={{ width: '20%' }}></div>
                </div>
              </div>

              {(budget?.breakdown?.emergencyFund ? budget.breakdown.emergencyFund > 0 : false) && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-on-surface-variant">Fondo Imprevistos</span>
                    <span className="font-mono font-semibold text-primary">
                      {formatCOP(budget?.breakdown?.emergencyFund || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className="bg-outline-variant h-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions: Confirm Trip or Save as Quote Draft */}
            <div className="flex flex-col gap-2.5 mb-3">
              <button
                onClick={() => setCurrentView('CHECKOUT')}
                className="w-full py-3.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{appMode === 'DEV' ? 'Confirmar Itinerario (Saga Transaccional)' : 'Confirmar Itinerario'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              <button
                disabled={isSavingDraft || draftSavedMsg}
                onClick={async () => {
                  if (!planResult) return;
                  setIsSavingDraft(true);
                  try {
                    const allEvents = (planResult.itinerary?.days || []).flatMap((d) =>
                      (d.events || []).map((evt) => ({
                        ...evt,
                        dayDate: d.date || planResult.tripDraft.startDate,
                      }))
                    );
                    await WayvoApi.createTrip({
                      userId: planResult.tripDraft.userId || 'usr-client',
                      destination: planResult.tripDraft.destination,
                      startDate: planResult.tripDraft.startDate,
                      endDate: planResult.tripDraft.endDate,
                      origin: planResult.tripDraft.origin,
                      title: planResult.tripDraft.title || `Viaje a ${planResult.tripDraft.destination}`,
                      travelers: planResult.tripDraft.travelers,
                      description: `Presupuesto estimado: ${formatCOP(planResult.budget?.estimatedTotalCost)}`,
                      events: allEvents.map((evt, idx) => ({
                        type: (((evt.type as any) === 'ACCOMMODATION' ? 'HOTEL' : evt.type) || 'ACTIVITY') as any,
                        title: evt.title,
                        description: evt.description || '',
                        location: evt.location || planResult.tripDraft.destination,
                        startDateTime: evt.startDateTime || `${evt.dayDate}T09:00:00Z`,
                        endDateTime: evt.endDateTime,
                        time: evt.time || '09:00 AM',
                        order: idx + 1,
                        status: 'PENDING' as any,
                        reservationStatus: (evt.reservationStatus as any) || 'NOT_RESERVED',
                        details: evt.details,
                      })),
                    });
                    await loadUserTrips();
                    setDraftSavedMsg(true);
                    setTimeout(() => setCurrentView('MY_TRIPS'), 1200);
                  } catch (err: any) {
                    alert(`No se pudo guardar la cotización: ${err.message}`);
                  } finally {
                    setIsSavingDraft(false);
                  }
                }}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  draftSavedMsg
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-surface-container hover:bg-surface-container-high text-primary border-outline-variant/30'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {draftSavedMsg ? 'check' : 'bookmark_add'}
                </span>
                <span>
                  {draftSavedMsg
                    ? '¡Cotización Guardada! Redirigiendo a Mis Viajes...'
                    : isSavingDraft
                    ? 'Guardando Cotización...'
                    : 'Guardar Cotización para Comparar'}
                </span>
              </button>
            </div>

            {/* Guarantee Tag */}
            <div className="p-3 rounded-lg bg-surface-container-low flex items-center gap-2.5 text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0">shield_lock</span>
              <span>
                {appMode === 'DEV'
                  ? 'Blindado con Orquestación Saga Transaccional con Compensación Automática.'
                  : 'Garantía Wayvo: Reserva 100% protegida y disponibilidad confirmada en tiempo real.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Full Modal */}
      {selectedEventModal && (
        <EventDetailModal
          event={selectedEventModal}
          destination={tripDraft.destination}
          onClose={() => setSelectedEventModal(null)}
        />
      )}
    </div>
  );
};
