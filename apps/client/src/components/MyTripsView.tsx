import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import { Trip } from '@wayvo/contracts';

export const MyTripsView: React.FC = () => {
  const {
    userTrips,
    loadUserTrips,
    activeTrip,
    setActiveTrip,
    setCurrentView,
    devBypassTimeValidation,
    appMode,
  } = useApp();

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'>('ALL');
  const [cancellingTripId, setCancellingTripId] = useState<string | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [tripToCancel, setTripToCancel] = useState<Trip | null>(null);
  const [startingTripId, setStartingTripId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUserTrips();
  }, []);

  const handleStartTrip = async (trip: Trip) => {
    const today = new Date().toISOString().slice(0, 10);
    const tripStart = (trip.startDate || '').slice(0, 10);

    // Validación temporal: solo si la fecha llegó o si está activo el dev bypass
    const canStart = devBypassTimeValidation || today >= tripStart;

    if (!canStart) {
      setFeedbackMessage(
        `Este viaje está programado para iniciar el ${trip.startDate}. Podrás iniciarlo a partir de esa fecha, o activa el toggle "Demo Bypass" en la barra superior (Modo Dev) para simular el inicio inmediato.`
      );
      setTimeout(() => setFeedbackMessage(null), 7000);
      return;
    }

    setStartingTripId(trip.id);
    try {
      const updated = await WayvoApi.startTrip(trip.id);
      setActiveTrip(updated);
      await loadUserTrips();
      setCurrentView('ACTIVE_TRIP');
    } catch {
      // Fallback local
      const localUpdated = { ...trip, status: 'ACTIVE' };
      setActiveTrip(localUpdated);
      setCurrentView('ACTIVE_TRIP');
    } finally {
      setStartingTripId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tripToDelete) return;
    const tripId = tripToDelete.id;

    setDeletingTripId(tripId);
    try {
      await WayvoApi.deleteTrip(tripId);
      if (activeTrip?.id === tripId) {
        setActiveTrip(null);
      }
      await loadUserTrips();
      setFeedbackMessage('Viaje eliminado con éxito de tu organizador.');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch {
      if (activeTrip?.id === tripId) {
        setActiveTrip(null);
      }
      await loadUserTrips();
      setFeedbackMessage('Viaje eliminado.');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setDeletingTripId(null);
      setTripToDelete(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!tripToCancel) return;
    const tripId = tripToCancel.id;

    setCancellingTripId(tripId);
    try {
      await WayvoApi.cancelTrip(tripId, 'Cancelado por el usuario desde el organizador');
      await loadUserTrips();
      setFeedbackMessage('Viaje marcado como cancelado.');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      alert(`No se pudo cancelar el viaje: ${err.message}`);
    } finally {
      setCancellingTripId(null);
      setTripToCancel(null);
    }
  };

  const handleOpenTrip = (trip: Trip) => {
    setActiveTrip(trip);
    setCurrentView('ACTIVE_TRIP');
  };

  const filteredTrips = userTrips.filter((t) => {
    const s = (t.status || '').toUpperCase();
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return s === 'ACTIVE';
    if (filter === 'CONFIRMED') return s === 'CONFIRMED' || s === 'UPCOMING';
    if (filter === 'PENDING') return s === 'PENDING';
    if (filter === 'CANCELLED') return s === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold dark:bg-emerald-950 dark:text-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            En Curso
          </span>
        );
      case 'CONFIRMED':
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Confirmado / Próximo
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">draw</span>
            Borrador / Cotización
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-surface pb-16 animate-fade-in font-sans">
      {/* Top Header Hub */}
      <section className="w-full px-6 md:px-12 py-8 bg-surface-container-low border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-secondary text-xs font-bold mb-2">
              <span className="material-symbols-outlined text-[16px]">folder_special</span>
              <span>Organizador Personal de Viajes</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight">
              Mis Viajes & Presupuestos
            </h1>
            <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
              Monitorea tus viajes en vivo, consulta presupuestos guardados y organiza cada detalle (vuelos, hoteles y actividades) de forma autónoma.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('ONBOARDING')}
            className="px-6 py-3.5 rounded-xl bg-secondary hover:bg-primary text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 group flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">
              add
            </span>
            <span>Planificar Nuevo Viaje</span>
          </button>
        </div>
      </section>

      {/* Alerta de feedback temporal */}
      {feedbackMessage && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-amber-600 flex-shrink-0">info</span>
            <div className="flex-1">
              <p className="font-semibold">{feedbackMessage}</p>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-amber-800 hover:text-amber-950">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-8">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 pb-4 overflow-x-auto border-b border-outline-variant/20 mb-8">
          {[
            { id: 'ALL', label: 'Todos los Viajes', count: userTrips.length },
            { id: 'ACTIVE', label: 'En Curso', count: userTrips.filter((t) => (t.status || '').toUpperCase() === 'ACTIVE').length },
            { id: 'CONFIRMED', label: 'Confirmados / Próximos', count: userTrips.filter((t) => ['CONFIRMED', 'UPCOMING'].includes((t.status || '').toUpperCase())).length },
            { id: 'PENDING', label: 'Cotizaciones Guardadas', count: userTrips.filter((t) => (t.status || '').toUpperCase() === 'PENDING').length },
            { id: 'CANCELLED', label: 'Cancelados', count: userTrips.filter((t) => (t.status || '').toUpperCase() === 'CANCELLED').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                filter === tab.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${filter === tab.id ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Trips Grid */}
        {filteredTrips.length === 0 ? (
          <div className="w-full py-16 px-6 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-secondary mb-4">
              <span className="material-symbols-outlined text-[32px]">travel_explore</span>
            </div>
            <h3 className="text-lg font-bold text-primary mb-1">
              {filter === 'ALL' ? 'No tienes viajes guardados aún' : 'No hay viajes en esta categoría'}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mb-6">
              Diseña una propuesta con IA indicando tu origen, destino y presupuesto. Podrás guardarla, compararla y activarla cuando decidas viajar.
            </p>
            <button
              onClick={() => setCurrentView('ONBOARDING')}
              className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary font-semibold text-xs hover:bg-primary transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Crear Mi Primer Itinerario</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const status = (trip.status || '').toUpperCase();
              const isTripActive = status === 'ACTIVE';
              const isTripConfirmed = status === 'CONFIRMED' || status === 'UPCOMING';
              const isTripPending = status === 'PENDING';
              const isTripCancelled = status === 'CANCELLED';
              const eventCount = trip.events?.length || 0;
              const confirmedEventsCount = trip.events?.filter((e) => e.reservationStatus === 'CONFIRMED').length || 0;

              return (
                <div
                  key={trip.id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Top Bar with Destination & Status */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-secondary font-bold tracking-wider">
                          {trip.origin || 'Origen'} ➔ {trip.destination}
                        </span>
                        <h3 className="text-xl font-black text-primary tracking-tight mt-0.5 line-clamp-1">
                          {trip.title || `Viaje a ${trip.destination}`}
                        </h3>
                      </div>
                      {getStatusBadge(trip.status as string)}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-secondary">calendar_today</span>
                        <span>{trip.startDate} — {trip.endDate}</span>
                      </span>
                      {trip.travelers && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">group</span>
                          <span>{trip.travelers} viajeros</span>
                        </span>
                      )}
                    </div>

                    {/* Events summary badge */}
                    {eventCount > 0 && (
                      <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-semibold text-primary">Reservas Confirmadas</span>
                          <span className="font-mono font-bold text-secondary">
                            {confirmedEventsCount} / {eventCount}
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-secondary h-full rounded-full transition-all"
                            style={{ width: `${(confirmedEventsCount / eventCount) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-on-surface-variant block mt-1">
                          {confirmedEventsCount === eventCount
                            ? 'Todas las reservas están confirmadas'
                            : `${eventCount - confirmedEventsCount} pendiente(s) por confirmar voucher`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions Footer */}
                  <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between gap-2">
                    {/* Primary Flow Action */}
                    {isTripActive && (
                      <button
                        onClick={() => handleOpenTrip(trip)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>Ver en Vivo</span>
                      </button>
                    )}

                    {isTripConfirmed && (
                      <>
                        <button
                          disabled={startingTripId === trip.id}
                          onClick={() => handleStartTrip(trip)}
                          className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          <span>{startingTripId === trip.id ? 'Iniciando...' : 'Iniciar Viaje'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenTrip(trip)}
                          title="Consultar cronograma"
                          className="py-2 px-3 rounded-xl bg-surface-container text-primary hover:bg-surface-container-high text-xs font-semibold transition-all"
                        >
                          Itinerario
                        </button>
                      </>
                    )}

                    {isTripPending && (
                      <>
                        <button
                          onClick={() => handleOpenTrip(trip)}
                          className="flex-1 py-2 px-3 rounded-xl bg-secondary hover:bg-primary text-on-primary font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>Revisar & Confirmar</span>
                        </button>
                      </>
                    )}

                    {isTripCancelled && (
                      <span className="text-xs text-error font-medium italic py-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">cancel</span>
                        Viaje cancelado
                      </span>
                    )}

                    {/* Botón de Cancelar (solo si está activo o confirmado) */}
                    {(isTripActive || isTripConfirmed) && (
                      <button
                        disabled={cancellingTripId === trip.id || deletingTripId === trip.id}
                        onClick={() => setTripToCancel(trip)}
                        title="Cancelar Viaje (Mantener en historial)"
                        className="py-2 px-2.5 rounded-xl text-on-surface-variant hover:text-amber-700 hover:bg-amber-100 transition-all text-xs"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {cancellingTripId === trip.id ? 'hourglass_top' : 'block'}
                        </span>
                      </button>
                    )}

                    {/* Botón de Eliminar Definitivamente (disponible para cualquier viaje) */}
                    <button
                      disabled={deletingTripId === trip.id || cancellingTripId === trip.id}
                      onClick={() => setTripToDelete(trip)}
                      title="Eliminar Viaje Definitivamente"
                      className="py-2 px-2.5 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all text-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {deletingTripId === trip.id ? 'hourglass_top' : 'delete'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Interfaz: Confirmación de Eliminación Definitiva */}
      {tripToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden animate-fade-in">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl p-6 flex flex-col gap-5 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-error-container text-error flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[26px]">delete_forever</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">¿Eliminar este viaje definitivamente?</h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Esta acción es irreversible. Se eliminará el itinerario completo y todas las reservas asociadas.
                  </p>
                </div>
              </div>

              {/* Ficha Resumen del Viaje a Borrar */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5 text-xs">
                <span className="font-mono uppercase font-bold text-secondary text-[11px] tracking-wide">
                  {tripToDelete.origin ? `${tripToDelete.origin} ➔ ` : ''}{tripToDelete.destination}
                </span>
                <span className="font-bold text-primary text-sm">{tripToDelete.title || `Viaje a ${tripToDelete.destination}`}</span>
                <span className="text-on-surface-variant text-[11px] mt-0.5">
                  Fechas: {tripToDelete.startDate} — {tripToDelete.endDate} • {tripToDelete.events?.length || 0} eventos registrados
                </span>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setTripToDelete(null)}
                  disabled={deletingTripId === tripToDelete.id}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deletingTripId === tripToDelete.id}
                  className="px-5 py-2.5 rounded-xl bg-error hover:bg-error/90 text-on-error text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {deletingTripId === tripToDelete.id ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Sí, Eliminar Viaje</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Interfaz: Confirmación de Cancelación */}
      {tripToCancel &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden animate-fade-in">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl p-6 flex flex-col gap-5 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[26px]">block</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">¿Marcar viaje como cancelado?</h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    El viaje cambiará su estado a Cancelado y podrás seguir consultándolo en la pestaña de Cancelados / Historial.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 text-xs">
                <span className="font-bold text-primary text-sm">{tripToCancel.title || `Viaje a ${tripToCancel.destination}`}</span>
                <span className="text-on-surface-variant text-[11px]">
                  {tripToCancel.destination} • {tripToCancel.startDate} — {tripToCancel.endDate}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setTripToCancel(null)}
                  disabled={cancellingTripId === tripToCancel.id}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancellingTripId === tripToCancel.id}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {cancellingTripId === tripToCancel.id ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                      <span>Cancelando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Confirmar Cancelación</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
