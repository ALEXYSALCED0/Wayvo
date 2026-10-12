import React from 'react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    appMode,
    setAppMode,
    currentView,
    setCurrentView,
    isChatOpen,
    setIsChatOpen,
    isDevInspectorOpen,
    setIsDevInspectorOpen,
    telemetryLogs,
    activeTrip,
    userTrips,
    devBypassTimeValidation,
    setDevBypassTimeValidation,
    setPlanResult,
  } = useApp();

  const stages = [
    { id: 'ONBOARDING', step: '1', label: 'Perfil & Plan', devLabel: '1. Perfil' },
    { id: 'PROPOSAL', step: '2', label: 'Propuesta', devLabel: '2. Plan IA' },
    { id: 'CHECKOUT', step: '3', label: 'Confirmar', devLabel: '3. Confirmar' },
    { id: 'ACTIVE_TRIP', step: '4', label: 'Itinerario en Vivo', devLabel: '4. En Vivo' },
  ] as const;

  const isLanding = currentView === 'LANDING';
  const isMyTrips = currentView === 'MY_TRIPS';

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest border-b border-outline-variant/30 shadow-[0_2px_12px_rgba(55,79,113,0.04)]">
      <div className="h-20 w-full px-6 md:px-12 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            if (userTrips.length > 0) {
              setCurrentView('MY_TRIPS');
            } else {
              setCurrentView('LANDING');
            }
          }}
          title="Ir a Mis Viajes"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-on-primary shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">near_me</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-xl text-primary tracking-tight">WAYVO</span>
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant tracking-[0.18em] uppercase mt-1">
              ORGANIZADOR INTELIGENTE
            </span>
          </div>
        </div>

        {/* Central Navigation: Hub and Trip Stages */}
        <div className="hidden md:flex items-center gap-3">
          {/* Main App Hub Buttons */}
          <div className="flex items-center gap-1 p-1 bg-surface-container rounded-full border border-outline-variant/30">
            <button
              onClick={() => setCurrentView('MY_TRIPS')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                isMyTrips
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/60'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">luggage</span>
              <span>Mis Viajes</span>
              {userTrips.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                  {userTrips.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setPlanResult(null);
                setCurrentView('ONBOARDING');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                currentView === 'ONBOARDING'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/60'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Nuevo Plan</span>
            </button>
          </div>

          {/* Workflow Stages when in a specific plan flow */}
          {!isLanding && !isMyTrips && (
            <nav className="flex items-center gap-1 p-1 bg-surface-container rounded-full animate-fade-in border border-outline-variant/30">
              {stages.map((stage) => {
                const isActive = currentView === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setCurrentView(stage.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/60'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {stage.step}
                    </span>
                    <span>{appMode === 'DEV' ? stage.devLabel : stage.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Actions on the right */}
        <div className="flex items-center gap-2.5">
          {/* Dev Bypass Toggle (Ignorar restricciones de fecha y hora para demos) */}
          {appMode === 'DEV' && (
            <button
              onClick={() => setDevBypassTimeValidation(!devBypassTimeValidation)}
              title={
                devBypassTimeValidation
                  ? 'Bypass Temporal ACTIVO: Se ignoran fechas y horas reales para la demo'
                  : 'Modo Normal: Los eventos respetan la fecha y hora real'
              }
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                devBypassTimeValidation
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {devBypassTimeValidation ? 'bolt' : 'schedule'}
              </span>
              <span>{devBypassTimeValidation ? 'Demo Bypass: ON' : 'Hora Real'}</span>
            </button>
          )}

          {/* Mode Switch Button (Usuario / Dev) */}
          <div className="flex items-center gap-1 p-1 bg-surface-container rounded-full border border-outline-variant/30">
            <button
              onClick={() => setAppMode('USER')}
              type="button"
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                appMode === 'USER'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Usuario
            </button>
            <button
              onClick={() => setAppMode('DEV')}
              type="button"
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all flex items-center gap-1 ${
                appMode === 'DEV'
                  ? 'bg-primary text-on-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">terminal</span>
              <span>Dev</span>
            </button>
          </div>

          {/* Dev Inspector Trigger */}
          {appMode === 'DEV' && (
            <button
              onClick={() => setIsDevInspectorOpen(!isDevInspectorOpen)}
              title="Abrir Inspector de Red y Caos"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-secondary-fixed text-primary text-xs font-medium transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px] text-secondary">monitoring</span>
              <span>HUD ({telemetryLogs.length})</span>
            </button>
          )}

          {/* Chat Drawer Concierge */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all text-xs font-medium shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span className="hidden sm:inline">Concierge</span>
          </button>
        </div>
      </div>
    </header>
  );
};
