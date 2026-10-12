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
    checkoutResult,
  } = useApp();

  const isTripConfirmed =
    activeTrip?.status === 'CONFIRMED' || checkoutResult?.status === 'CONFIRMED';

  // Active trip stages only displayed when navigating through the trip creation/monitoring flow
  const stages = [
    { id: 'ONBOARDING', step: '1', label: 'Perfil & Plan', devLabel: '1. Perfil' },
    { id: 'PROPOSAL', step: '2', label: 'Propuesta', devLabel: '2. Plan IA' },
    { id: 'CHECKOUT', step: '3', label: 'Reserva', devLabel: '3. Checkout' },
    { id: 'ACTIVE_TRIP', step: '4', label: 'Mi Viaje', devLabel: '4. En Vivo' },
  ] as const;

  const isLanding = currentView === 'LANDING';

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest border-b border-outline-variant/30 shadow-[0_2px_12px_rgba(55,79,113,0.04)]">
      <div className="h-20 w-full px-6 md:px-12 flex items-center justify-between gap-4">
        
        {/* Brand / Logo (WAYVO • TRAVEL INTELLIGENCE from Reference) */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            if (!isTripConfirmed || appMode === 'DEV') {
              setCurrentView('LANDING');
            } else {
              setCurrentView('ACTIVE_TRIP');
            }
          }}
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
              TRAVEL INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Clean Trip Stages Navigation: ONLY shown when user is actually in a trip workflow */}
        {!isLanding && (
          <nav className="hidden md:flex items-center gap-1.5 p-1.5 bg-surface-container rounded-full animate-fade-in">
            {stages.map((stage) => {
              const isActive = currentView === stage.id;
              const isLocked = isTripConfirmed && stage.id !== 'ACTIVE_TRIP' && appMode === 'USER';

              return (
                <button
                  key={stage.id}
                  disabled={isLocked}
                  onClick={() => !isLocked && setCurrentView(stage.id)}
                  title={isLocked ? 'Viaje confirmado: pasos anteriores bloqueados' : undefined}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${
                    isLocked
                      ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
                      : isActive
                      ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/60'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isLocked
                        ? 'bg-outline-variant/40 text-on-surface-variant'
                        : isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {isLocked ? (
                      <span className="material-symbols-outlined text-[11px]">lock</span>
                    ) : (
                      stage.step
                    )}
                  </span>
                  <span>{appMode === 'DEV' ? stage.devLabel : stage.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Actions on the right */}
        <div className="flex items-center gap-3">
          {/* Mode Switch Button (Discreet) */}
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

          {/* Dev Inspector Trigger (visible only in DEV mode) */}
          {appMode === 'DEV' && (
            <button
              onClick={() => setIsDevInspectorOpen(!isDevInspectorOpen)}
              title="Abrir Inspector de Red y Caos"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-secondary-fixed text-primary text-xs font-medium transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px] text-secondary">monitoring</span>
              <span>HUD ({telemetryLogs.length})</span>
            </button>
          )}

          {/* In Landing: Primary "Comenzar" Button (from reference) */}
          {isLanding ? (
            <button
              onClick={() => setCurrentView('ONBOARDING')}
              className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-primary text-on-primary font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Comenzar</span>
            </button>
          ) : (
            /* Inside trip flow: Concierge IA Drawer Button */
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all text-xs font-medium shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              <span className="hidden sm:inline">Concierge</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
