import React from 'react';
import { useApp } from '../context/AppContext';

export const LandingView: React.FC = () => {
  const { setCurrentView, setAppMode } = useApp();

  return (
    <div className="w-full bg-surface pb-16 animate-fade-in">
      {/* Hero Section (Stitch Style) */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 md:px-8 border-b border-outline-variant/30 bg-gradient-to-b from-surface-container-low to-surface">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Top Pill Chip */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest text-primary border border-outline-variant/40 shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">
              Clean Architecture • Saga Distributed Transactions • LangGraph AI Mesh
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-primary tracking-tight leading-[1.15] max-w-4xl mb-6">
            Viajes planificados por IA, <br className="hidden sm:inline" />
            blindados por Sagas y adaptables en vivo.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed mb-8">
            Wayvo interpreta tu perfil psicométrico, negocia vuelos y alojamientos con proveedores reales,
            y recalcula dinámicamente tu itinerario ante cualquier imprevisto mediante el patrón <strong>Mediator</strong>.
          </p>

          {/* CTA Buttons (User vs Dev) */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              onClick={() => {
                setAppMode('USER');
                setCurrentView('ONBOARDING');
              }}
              className="px-8 py-3.5 rounded-full bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>Comenzar Planificación (Modo Usuario)</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <button
              onClick={() => {
                setAppMode('DEV');
                setCurrentView('ONBOARDING');
              }}
              className="px-6 py-3.5 rounded-full bg-surface-container-lowest hover:bg-surface-container text-primary border border-outline-variant/50 font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">terminal</span>
              <span>Explorar Arquitectura (Modo Dev)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Architectural Pillars Cards (GoF & Clean Architecture) */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pt-16">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold text-secondary uppercase tracking-wider block mb-1">
            Excelencia Técnica & Patrones de Diseño
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Arquitectura de Microservicios Desacoplada
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Facade */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-[26px]">door_front</span>
              </div>
              <h3 className="text-base font-bold text-primary mb-2">Patrón Facade</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Punto único de entrada y orquestación unificada en el API Gateway (puerto 3000), ocultando la complejidad distribuida al frontend.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20">
              <span className="font-mono text-[11px] text-secondary font-semibold">api-gateway :3000</span>
            </div>
          </div>

          {/* Pillar 2: Saga Orchestrator */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary mb-4">
                <span className="material-symbols-outlined text-[26px]">account_tree</span>
              </div>
              <h3 className="text-base font-bold text-primary mb-2">Saga Transaccional</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Transacciones distribuidas entre Viajes, Reservas y Proveedores con compensación y rollback automático ante cualquier fallo.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20">
              <span className="font-mono text-[11px] text-secondary font-semibold">booking-service :3001</span>
            </div>
          </div>

          {/* Pillar 3: Adapter */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-[26px]">extension</span>
              </div>
              <h3 className="text-base font-bold text-primary mb-2">Patrón Adapter</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Integración agnóstica de proveedores externos de vuelos y hoteles con simulador de caos e inyección de latencia.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20">
              <span className="font-mono text-[11px] text-secondary font-semibold">provider-service :3002</span>
            </div>
          </div>

          {/* Pillar 4: Mediator */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary mb-4">
                <span className="material-symbols-outlined text-[26px]">alt_route</span>
              </div>
              <h3 className="text-base font-bold text-primary mb-2">Patrón Mediator</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Resolución inteligente y desacoplada de disrupciones o retrasos de viaje, recalculando alternativas en tiempo real.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20">
              <span className="font-mono text-[11px] text-secondary font-semibold">trip-service :3003</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
