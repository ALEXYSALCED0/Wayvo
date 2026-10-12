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

  // Simple, intuitive trip stages for user mode, technical badges only in dev mode
  const stages = [
    { id: 'LANDING', step: '1', label: 'Inicio', devLabel: '1. Landing' },
    { id: 'ONBOARDING', step: '2', label: 'Perfil & Plan', devLabel: '2. Perfil & Facade' },
    { id: 'PROPOSAL', step: '3', label: 'Propuesta', devLabel: '3. LangGraph Plan' },
    { id: 'CHECKOUT', step: '4', label: 'Reserva', devLabel: '4. Saga Checkout' },
    { id: 'ACTIVE_TRIP', step: '5', label: 'Mi Viaje', devLabel: '5. Mediator Live' },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest shadow-[0_4px_12px_rgba(55,79,113,0.05)] border-b border-outline-variant/30">
      <div className="h-18 md:h-20 w-full px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setCurrentView('LANDING')}
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container transition-all">
            <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-primary tracking-tight leading-none">Wayvo</span>
            <span className="text-[11px] text-secondary font-medium tracking-wide">
              {appMode === 'USER' ? 'Viajes Inteligentes' : 'Plataforma Azure Clarity'}
            </span>
          </div>

          {/* Dev-Only Architecture Badge */}
          {appMode === 'DEV' && (
            <div className="hidden xl:flex items-center gap-2 ml-3 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/30">
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-mono text-xs text-secondary font-medium">
                Gateway :3000 • Sagas Activas
              </span>
            </div>
          )}
        </div>

        {/* Clean Trip Stages Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1.5 bg-surface-container rounded-full">
          {stages.map((stage) => {
            const isActive = currentView === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setCurrentView(stage.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-container text-on-primary shadow-[0_2px_8px_rgba(0,74,117,0.25)] font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/60'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {stage.step}
                </span>
                <span>{appMode === 'DEV' ? stage.devLabel : stage.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions & Dual Mode Switch */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Dual Mode Switch (Pill toggle) */}
          <div className="flex items-center gap-1 p-1 bg-surface-container rounded-full border border-outline-variant/30">
            <button
              onClick={() => setAppMode('USER')}
              type="button"
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                appMode === 'USER'
                  ? 'bg-surface-container-lowest text-primary shadow-[0_1px_4px_rgba(55,79,113,0.12)] font-semibold'
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
                  ? 'bg-primary text-on-primary shadow-[0_1px_4px_rgba(0,74,117,0.25)] font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              <span>Modo Dev</span>
            </button>
          </div>

          {/* Dev Inspector Trigger (visible only in DEV mode) */}
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
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all text-xs font-medium shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span className="hidden sm:inline">Concierge IA</span>
          </button>
        </div>
      </div>
    </header>
  );
};
