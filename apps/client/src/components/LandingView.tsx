import React from 'react';
import { useApp } from '../context/AppContext';

export const LandingView: React.FC = () => {
  const { setCurrentView, appMode, setAppMode, setIsDevInspectorOpen } = useApp();

  return (
    <div className="w-full bg-surface pb-16 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 md:px-8 border-b border-outline-variant/30 bg-gradient-to-b from-surface-container-low to-surface">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Top Pill Chip */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest text-primary border border-outline-variant/40 shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-xs font-medium uppercase tracking-wider">
              {appMode === 'DEV'
                ? 'Modo Desarrollador Activo • Monitoreo de Microservicios & Sagas'
                : 'La Nueva Era de Viajes Personalizados con Inteligencia Artificial'}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-primary tracking-tight leading-[1.15] max-w-4xl mb-6">
            Viaja al ritmo de tu verdadera personalidad.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed mb-8">
            Wayvo comprende tus preferencias, equilibra tu presupuesto de forma inteligente y sincroniza tus vuelos,
            hospedajes boutique y experiencias locales para que solo te preocupes por disfrutar.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              onClick={() => {
                setCurrentView('ONBOARDING');
              }}
              className="px-8 py-3.5 rounded-full bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 group"
            >
              <span>Diseñar Mi Viaje</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </button>

            {appMode === 'USER' ? (
              <button
                onClick={() => {
                  setAppMode('DEV');
                  setCurrentView('ONBOARDING');
                }}
                className="px-6 py-3.5 rounded-full bg-surface-container-lowest hover:bg-surface-container text-secondary border border-outline-variant/50 font-medium text-xs shadow-sm transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                <span>Demostración Técnica (Modo Dev)</span>
              </button>
            ) : (
              <button
                onClick={() => setIsDevInspectorOpen(true)}
                className="px-6 py-3.5 rounded-full bg-primary text-on-primary font-mono text-xs shadow-sm transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">monitoring</span>
                <span>Abrir Dev Inspector HUD</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* User-Centric Value Propositions (Shown in User Mode) */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pt-16">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
            Diseñado Pensando en Ti
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Una experiencia de viaje fluida y sin fricciones
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Perfil Psicométrico */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-[26px]">psychology</span>
              </div>
              <h3 className="text-base font-bold text-primary mb-2">Perfil a Tu Medida</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Descubrimos tu ritmo, tus gustos y el tipo de aventura que buscas para construir una ruta que realmente te inspire, sin itinerarios genéricos.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20">
              <span className="text-[11px] text-secondary font-medium">Personalización profunda</span>
            </div>
          </div>

          {/* Card 2: Reserva Sincronizada */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary mb-4">
                <span className="material-symbols-outlined text-[26px]">verified</span>
              </div>
              <h3 className="text-base font-bold text-primary mb-2">Todo en Uno</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Vuelos, hoteles recomendados y actividades confirmadas en un solo paso coordinado y seguro, sin lidiar con múltiples páginas o confirmaciones perdidas.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20">
              <span className="text-[11px] text-secondary font-medium">Reserva garantizada</span>
            </div>
          </div>

          {/* Card 3: Resolución Proactiva */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-[26px]">shield_with_heart</span>
              </div>
              <h3 className="text-base font-bold text-primary mb-2">Cero Estrés</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Si las condiciones climáticas o los horarios cambian, Wayvo recalcula alternativas inmediatas automáticamente para que tu disfrute nunca se detenga.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20">
              <span className="text-[11px] text-secondary font-medium">Protección activa</span>
            </div>
          </div>

          {/* Card 4: Concierge Autónomo */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary mb-4">
                <span className="material-symbols-outlined text-[26px]">support_agent</span>
              </div>
              <h3 className="text-base font-bold text-primary mb-2">Concierge 24/7</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Tu asistente inteligente siempre a mano para recomendarte cafés de especialidad, restaurantes locales o responder cualquier duda en tu destino.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20">
              <span className="text-[11px] text-secondary font-medium">Asistencia permanente</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dev-Mode Only: Software Architecture & GoF Patterns Panel */}
      {appMode === 'DEV' && (
        <section className="max-w-6xl mx-auto px-4 md:px-8 pt-16 animate-fade-in">
          <div className="p-6 bg-surface-container-low rounded-2xl border border-secondary/30">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-mono text-xs font-bold mb-2">
                <span className="material-symbols-outlined text-[14px]">terminal</span>
                VISTA EXCLUSIVA MODO DEV
              </div>
              <h3 className="text-xl font-bold text-primary">
                Patrones de Diseño GoF & Arquitectura de Microservicios
              </h3>
              <p className="text-xs text-on-surface-variant max-w-xl mx-auto mt-1">
                Demostración técnica de desacoplamiento, transacciones distribuidas y mallas de agentes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <div className="font-bold text-xs text-primary mb-1">Patrón Facade</div>
                <div className="font-mono text-[11px] text-secondary mb-2">api-gateway (:3000)</div>
                <p className="text-[11px] text-on-surface-variant">
                  Punto de entrada unificado que encapsula los subsistemas de recomendación, reserva y viaje.
                </p>
              </div>

              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <div className="font-bold text-xs text-primary mb-1">Patrón Saga</div>
                <div className="font-mono text-[11px] text-secondary mb-2">booking-service (:3001)</div>
                <p className="text-[11px] text-on-surface-variant">
                  Orquestador distribuido con pasos de inventario y compensación automática en caso de error.
                </p>
              </div>

              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <div className="font-bold text-xs text-primary mb-1">Patrón Adapter</div>
                <div className="font-mono text-[11px] text-secondary mb-2">provider-service (:3002)</div>
                <p className="text-[11px] text-on-surface-variant">
                  Abstracción homogénea de APIs heterogéneas de aerolíneas y hoteles con inyección de fallos.
                </p>
              </div>

              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <div className="font-bold text-xs text-primary mb-1">Patrón Mediator</div>
                <div className="font-mono text-[11px] text-secondary mb-2">trip-service (:3003)</div>
                <p className="text-[11px] text-on-surface-variant">
                  Resolución desacoplada de contingencias evaluando alternativas sin acoplar entidades.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
