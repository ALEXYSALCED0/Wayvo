import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import {
  TripPlanRequest,
  BudgetCategory,
  TravelStyle,
} from '@wayvo/contracts';

export const OnboardingView: React.FC = () => {
  const { setCurrentView, setPlanResult, appMode, setIsDevInspectorOpen } = useApp();

  // Form State
  const [origin, setOrigin] = useState('Bogotá (BOG)');
  const [destination, setDestination] = useState('Cartagena (CTG)');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-05');
  const [travelers, setTravelers] = useState(2);
  const [budgetCategory, setBudgetCategory] = useState<BudgetCategory>(BudgetCategory.ESTANDAR);
  const [approximateBudgetAmount, setApproximateBudgetAmount] = useState(3500000);

  // Psychometric State
  const [spontaneityScore, setSpontaneityScore] = useState(4);
  const [comfortPriority, setComfortPriority] = useState(3);
  const [culturalCuriosity, setCulturalCuriosity] = useState(5);
  const [socialPreference, setSocialPreference] = useState<'solo' | 'couple' | 'family' | 'friends' | 'group'>('couple');
  const [physicalActivityLevel, setPhysicalActivityLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [interests, setInterests] = useState<string[]>(['historia', 'playa', 'gastronomia']);

  // Loading & Pipeline State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);

  const availableInterests = [
    { id: 'historia', label: 'Historia & Patrimonio', icon: 'museum' },
    { id: 'playa', label: 'Playas & Mar', icon: 'beach_access' },
    { id: 'gastronomia', label: 'Alta Gastronomía', icon: 'restaurant' },
    { id: 'aventura', label: 'Aventura & Naturaleza', icon: 'hiking' },
    { id: 'relax', label: 'Spa & Relax', icon: 'spa' },
    { id: 'nocturna', label: 'Vida Nocturna', icon: 'nightlife' },
  ];

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleLoadDemoData = () => {
    setOrigin('Bogotá (BOG)');
    setDestination('Cartagena (CTG)');
    setStartDate('2026-11-01');
    setEndDate('2026-11-05');
    setTravelers(2);
    setBudgetCategory(BudgetCategory.ESTANDAR);
    setApproximateBudgetAmount(3500000);
    setSpontaneityScore(4);
    setComfortPriority(3);
    setCulturalCuriosity(5);
    setSocialPreference('couple');
    setPhysicalActivityLevel('moderate');
    setInterests(['historia', 'playa', 'gastronomia']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPipelineStep(1);

    if (appMode === 'DEV') {
      setIsDevInspectorOpen(true);
    }

    const timer = setInterval(() => {
      setPipelineStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 800);

    const payload: TripPlanRequest = {
      userId: 'usr-client',
      origin: origin.includes('(') ? origin.split('(')[0].trim() : origin,
      destination: destination.includes('(') ? destination.split('(')[0].trim() : destination,
      startDate,
      endDate,
      travelers,
      budgetCategory,
      currency: 'COP',
      approximateBudgetAmount,
      psychologicalAssessment: {
        spontaneityScore,
        comfortPriority,
        culturalCuriosity,
        socialPreference,
        physicalActivityLevel,
        interests,
      },
      dietaryRestrictions: ['mariscos'],
      preferredStyle: TravelStyle.CULTURAL,
    };

    try {
      const response = await WayvoApi.planTrip(payload);
      clearInterval(timer);
      if (response && response.plan) {
        setPlanResult(response.plan);
        setCurrentView('PROPOSAL');
      }
    } catch (err: any) {
      clearInterval(timer);
      alert(`Error al generar el plan con IA: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-surface py-8 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in">
      {/* Hero Header (Stitch Design) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/30 pb-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary font-mono text-xs uppercase tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
              LangGraph Multi-Agent Protocol • Facade Pattern
            </span>
            <span className="text-outline text-xs hidden sm:inline">| Nodo: /trips/plan</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
            Planifica tu Experiencia con Inteligencia de Agentes
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
            Calibración psicométrica asistida por agentes multi-rol. Mediante el patrón estructural <strong>Facade</strong>,
            orquestamos vuelos, alojamientos y actividades coordinadas por LangGraph en tiempo real.
          </p>
        </div>

        {/* Quick Demo Autofill Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLoadDemoData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-secondary-fixed text-primary text-xs font-semibold shadow-sm transition-all border border-outline-variant/40"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">magic_button</span>
            <span>Cargar Datos Demo</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Workflow (Stitch Grid: 8 cols left, 4 cols right) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Step A, Step B, Step C */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* STEP A: Parámetros Base de Ruta */}
          <section className="stitch-card p-6 relative overflow-hidden bg-surface-container-lowest">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-mono text-xs font-bold">
                  01
                </span>
                <div>
                  <h2 className="text-base font-semibold text-primary">Paso A • Parámetros Base de Ruta</h2>
                  <p className="text-xs text-on-surface-variant">Segmentos aeronáuticos y coordenadas del viaje</p>
                </div>
              </div>
              <span className="text-xs font-mono text-secondary bg-surface-container-low px-2.5 py-1 rounded-full uppercase font-medium">
                Domestic Trunk • Colombia
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origen */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">flight_takeoff</span>
                  Origen
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low text-on-surface text-sm rounded-lg border border-outline-variant/40 focus:outline-none focus:border-secondary cursor-pointer"
                >
                  <option value="Bogotá (BOG)">Bogotá • El Dorado Intl (BOG)</option>
                  <option value="Medellín (MDE)">Medellín • José María Córdova (MDE)</option>
                  <option value="Cali (CLO)">Cali • Alfonso Bonilla Aragón (CLO)</option>
                </select>
              </div>

              {/* Destino */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">flight_land</span>
                  Destino Principal
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low text-on-surface text-sm rounded-lg border border-outline-variant/40 focus:outline-none focus:border-secondary cursor-pointer"
                >
                  <option value="Cartagena (CTG)">Cartagena de Indias • Rafael Núñez (CTG)</option>
                  <option value="Santa Marta (SMR)">Santa Marta • Simón Bolívar (SMR)</option>
                  <option value="Medellín (MDE)">Medellín • Valle de Aburrá (MDE)</option>
                </select>
              </div>

              {/* Route Vector Graphic (from Stitch) */}
              <div className="md:col-span-2 py-3 px-4 rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{origin.slice(-4, -1)}</span>
                  <span className="text-xs text-on-surface-variant">Aeropuerto Origen</span>
                </div>
                <div className="flex-1 mx-4 flex items-center justify-center relative">
                  <svg className="w-full h-5 text-secondary" fill="none" viewBox="0 0 240 20" preserveAspectRatio="none">
                    <line stroke="currentColor" strokeDasharray="4 4" strokeWidth="2" x1="10" x2="230" y1="10" y2="10" />
                    <circle cx="10" cy="10" r="4" className="fill-surface-container-lowest stroke-primary" strokeWidth="2" />
                    <circle cx="230" cy="10" r="4" className="fill-surface-container-lowest stroke-primary" strokeWidth="2" />
                  </svg>
                  <span className="material-symbols-outlined text-[18px] text-primary absolute -top-1">flight</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{destination.slice(-4, -1)}</span>
                  <span className="text-xs text-on-surface-variant">Aeropuerto Llegada</span>
                </div>
              </div>

              {/* Fechas */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
                  Fecha de Salida
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low text-on-surface text-sm rounded-lg border border-outline-variant/40 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">event</span>
                  Fecha de Regreso
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low text-on-surface text-sm rounded-lg border border-outline-variant/40 focus:outline-none"
                />
              </div>

              {/* Viajeros */}
              <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">group</span>
                  <span className="text-xs font-medium text-on-surface">Número de Viajeros</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTravelers((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary hover:bg-secondary-fixed transition-colors"
                  >
                    -
                  </button>
                  <span className="font-mono text-base font-bold text-primary px-2">{travelers}</span>
                  <button
                    type="button"
                    onClick={() => setTravelers((prev) => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary hover:bg-secondary-fixed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* STEP B: Calibración Psicométrica de Estilo & Ritmo */}
          <section className="stitch-card p-6 bg-surface-container-lowest">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-mono text-xs font-bold">
                  02
                </span>
                <div>
                  <h2 className="text-base font-semibold text-primary">Paso B • Perfil Psicométrico & Preferencias</h2>
                  <p className="text-xs text-on-surface-variant">Calibración de espontaneidad, confort y curiosidad cultural</p>
                </div>
              </div>
              <span className="text-xs font-mono text-secondary bg-surface-container-low px-2.5 py-1 rounded-full uppercase font-medium">
                AI Profiler Agent
              </span>
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-on-surface">Espontaneidad vs. Planificación</span>
                  <span className="font-mono text-secondary font-bold">{spontaneityScore}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={spontaneityScore}
                  onChange={(e) => setSpontaneityScore(Number(e.target.value))}
                  className="w-full accent-[#004a75] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                  <span>1: Todo estructurado</span>
                  <span>5: Máxima improvisación</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-on-surface">Prioridad de Confort & Descanso</span>
                  <span className="font-mono text-secondary font-bold">{comfortPriority}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={comfortPriority}
                  onChange={(e) => setComfortPriority(Number(e.target.value))}
                  className="w-full accent-[#004a75] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                  <span>1: Modo mochilero</span>
                  <span>5: Máximo confort</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-on-surface">Curiosidad Cultural & Patrimonio</span>
                  <span className="font-mono text-secondary font-bold">{culturalCuriosity}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={culturalCuriosity}
                  onChange={(e) => setCulturalCuriosity(Number(e.target.value))}
                  className="w-full accent-[#004a75] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                  <span>1: Solo ocio</span>
                  <span>5: Inmersión histórica profunda</span>
                </div>
              </div>

              {/* Selector Preferencia Social */}
              <div className="pt-2">
                <label className="text-xs font-medium text-on-surface block mb-2">Compañía de Viaje</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['solo', 'couple', 'family', 'friends', 'group'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setSocialPreference(pref)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        socialPreference === pref
                          ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {pref === 'solo' && 'Solo'}
                      {pref === 'couple' && 'Pareja'}
                      {pref === 'family' && 'Familia'}
                      {pref === 'friends' && 'Amigos'}
                      {pref === 'group' && 'Grupo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chips de Intereses Temáticos */}
              <div className="pt-2">
                <label className="text-xs font-medium text-on-surface block mb-2">Intereses Temáticos</label>
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map((interest) => {
                    const isSelected = interests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{interest.icon}</span>
                        <span>{interest.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* STEP C: Arquitectura Presupuestal */}
          <section className="stitch-card p-6 bg-surface-container-lowest">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-mono text-xs font-bold">
                  03
                </span>
                <div>
                  <h2 className="text-base font-semibold text-primary">Paso C • Arquitectura Presupuestal</h2>
                  <p className="text-xs text-on-surface-variant">Heurística de gasto y categoría de servicios</p>
                </div>
              </div>
              <span className="text-xs font-mono text-secondary bg-surface-container-low px-2.5 py-1 rounded-full uppercase font-medium">
                COP ($)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { cat: BudgetCategory.ECONOMICO, title: 'Económico', desc: 'Hostales y vuelos promocionales' },
                { cat: BudgetCategory.ESTANDAR, title: 'Estándar', desc: 'Hoteles 3-4★ y experiencias curadas' },
                { cat: BudgetCategory.LUJO, title: 'Lujo', desc: 'Resorts boutique y traslados VIP' },
              ].map((item) => (
                <div
                  key={item.cat}
                  onClick={() => setBudgetCategory(item.cat)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    budgetCategory === item.cat
                      ? 'border-secondary bg-secondary-fixed/30 shadow-sm'
                      : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-primary">{item.title}</span>
                    {budgetCategory === item.cat && (
                      <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface">Presupuesto Estimado Total (COP)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm text-on-surface-variant font-mono">$</span>
                <input
                  type="number"
                  step="100000"
                  value={approximateBudgetAmount}
                  onChange={(e) => setApproximateBudgetAmount(Number(e.target.value))}
                  className="w-full h-11 pl-8 pr-4 bg-surface-container-low text-on-surface text-sm rounded-lg border border-outline-variant/40 focus:outline-none focus:border-secondary font-mono"
                />
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    <span>Sintetizando Pipeline Multiagente...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">neurology</span>
                    <span>Planificar Itinerario con IA (LangGraph Multiagent Mesh)</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Telemetry & Multi-Agent Mesh Monitor */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Agent Mesh Monitor Card */}
          <div className="stitch-card p-6 bg-surface-container-lowest">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-[22px]">hub</span>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                Malla Multiagente LangGraph
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { name: 'Personality Profiler', desc: 'Calcula arquetipo psicométrico', step: 1, icon: 'psychology' },
                { name: 'Transport Adapter', desc: 'Consulta vuelos y conexiones', step: 2, icon: 'flight' },
                { name: 'Activities Synthesizer', desc: 'Optimiza agenda horaria diaria', step: 3, icon: 'local_activity' },
                { name: 'Budget Optimizer', desc: 'Valida límites y reservas en COP', step: 4, icon: 'payments' },
              ].map((agent) => {
                const isActive = pipelineStep >= agent.step;
                return (
                  <div
                    key={agent.name}
                    className={`p-3 rounded-lg flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-surface-container text-primary border border-secondary/30'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-secondary">{agent.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{agent.name}</span>
                        <span className="text-[11px] text-on-surface-variant">{agent.desc}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-secondary-fixed text-on-secondary-fixed font-bold'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      {isActive ? 'READY' : 'STANDBY'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant leading-relaxed">
              <p className="flex items-center gap-1.5 font-medium text-primary mb-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Patrón Facade Activo
              </p>
              El Gateway consolida las respuestas del pipeline multiagente en un único endpoint tipado:
              <code className="block mt-1 font-mono text-[11px] bg-surface-container p-1 rounded text-primary">
                POST /api/v1/trips/plan
              </code>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
