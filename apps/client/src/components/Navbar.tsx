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
  } = useApp();

  const navItems = [
    { id: 'LANDING', label: 'Inicio' },
    { id: 'ONBOARDING', label: 'Onboarding & Psicometría' },
    { id: 'PROPOSAL', label: 'Propuesta de Itinerario' },
    { id: 'CHECKOUT', label: 'Saga Checkout en Vivo' },
    { id: 'ACTIVE_TRIP', label: 'Viaje Activo & Timeline' },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest shadow-[0_4px_12px_rgba(55,79,113,0.05)] border-b border-outline-variant/30">
      <div className="h-20 w-full px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-4 flex-shrink-0 cursor-pointer" onClick={() => setCurrentView('LANDING')}>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-primary tracking-tight">Wayvo</span>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                Azure Clarity
              </span>
            </div>
            <span className="text-xs text-secondary font-medium tracking-wider uppercase">
              Viajes Inteligentes
            </span>
          </div>

          <div className="h-6 w-px bg-outline-variant hidden xl:block"></div>

          {/* Architecture Pulse Badge */}
          <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/30">
            <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-mono text-xs text-secondary font-medium">
              Saga Orchestrator: Healthy • LangGraph: Active
            </span>
          </div>
        </div>

        {/* Navigation Pills (Stitch Styling) */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-surface-container rounded-full">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-container text-on-primary shadow-[0_2px_8px_rgba(0,74,117,0.25)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions & Dual Mode Switch */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Dual Mode Switch (Pill toggle from Stitch) */}
          <div className="flex items-center gap-1 p-1 bg-surface-container rounded-full border border-outline-variant/30">
            <button
              onClick={() => setAppMode('USER')}
              type="button"
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                appMode === 'USER'
                  ? 'bg-surface-container-lowest text-primary shadow-[0_1px_4px_rgba(55,79,113,0.12)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Modo Usuario
            </button>
            <button
              onClick={() => setAppMode('DEV')}
              type="button"
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all flex items-center gap-1.5 ${
                appMode === 'DEV'
                  ? 'bg-primary text-on-primary shadow-[0_1px_4px_rgba(0,74,117,0.25)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              <span>Modo Dev</span>
            </button>
          </div>

          {/* Dev Inspector Trigger (in DEV mode or available) */}
          {appMode === 'DEV' && (
            <button
              onClick={() => setIsDevInspectorOpen(!isDevInspectorOpen)}
              title="Abrir Inspector de Red y Caos"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-secondary-fixed text-primary text-xs font-medium transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">monitoring</span>
              <span>Inspector ({telemetryLogs.length})</span>
            </button>
          )}

          {/* AI Chat Drawer Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all text-xs font-medium shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span className="hidden sm:inline">Asistente IA</span>
          </button>
        </div>
      </div>
    </header>
  );
};
