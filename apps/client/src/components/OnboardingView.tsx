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

  // Wizard Step State (1: Conoce al Viajero, 2: Datos del Viaje, 3: Presupuesto Inteligente)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // 1. Psychological & Traveler Profile State (First!)
  const [socialPreference, setSocialPreference] = useState<'solo' | 'couple' | 'friends' | 'family' | 'group'>('couple');
  const [travelers, setTravelers] = useState(2);
  const [spontaneityScore, setSpontaneityScore] = useState(4);
  const [comfortPriority, setComfortPriority] = useState(3);
  const [culturalCuriosity, setCulturalCuriosity] = useState(5);
  const [physicalActivityLevel, setPhysicalActivityLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [interests, setInterests] = useState<string[]>(['gastronomia', 'historia', 'playa']);

  // 2. Trip Logistics State (Second!)
  const [origin, setOrigin] = useState('Bogotá (BOG)');
  const [destination, setDestination] = useState('Cartagena (CTG)');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-05');

  // 3. Adaptive Budget State (Third!)
  // In user mode: No raw number is shown upfront; user selects category first, which adapts to travelers and days.
  const [budgetTier, setBudgetTier] = useState<'ECONOMICO' | 'ESTANDAR' | 'LUJO' | 'CUSTOM'>('ESTANDAR');
  const [customBudgetAmount, setCustomBudgetAmount] = useState<number>(4500000);

  // Pipeline Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);

  // Helper calculations for adaptive budget
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) || 5;

  // Adaptive rates per person/day
  const DAILY_RATES = {
    ECONOMICO: 220000,
    ESTANDAR: 450000,
    LUJO: 950000,
  };

  const calculatedBudgetAmount =
    budgetTier === 'CUSTOM'
      ? customBudgetAmount
      : DAILY_RATES[budgetTier] * travelers * durationDays;

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const availableInterests = [
    { id: 'gastronomia', label: 'Alta Gastronomía & Café', icon: 'restaurant' },
    { id: 'historia', label: 'Historia & Patrimonio', icon: 'museum' },
    { id: 'playa', label: 'Playas & Mar', icon: 'beach_access' },
    { id: 'aventura', label: 'Aventura & Naturaleza', icon: 'hiking' },
    { id: 'relax', label: 'Spa & Desconexión', icon: 'spa' },
    { id: 'nocturna', label: 'Vida Nocturna', icon: 'nightlife' },
  ];

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSocialSelect = (type: 'solo' | 'couple' | 'friends' | 'family') => {
    setSocialPreference(type);
    if (type === 'solo') setTravelers(1);
    else if (type === 'couple') setTravelers(2);
    else if (type === 'friends') setTravelers(3);
    else if (type === 'family') setTravelers(4);
  };

  const handleLoadDemoData = () => {
    setSocialPreference('couple');
    setTravelers(2);
    setSpontaneityScore(4);
    setComfortPriority(3);
    setCulturalCuriosity(5);
    setPhysicalActivityLevel('moderate');
    setInterests(['gastronomia', 'historia', 'playa']);
    setOrigin('Bogotá (BOG)');
    setDestination('Cartagena (CTG)');
    setStartDate('2026-11-01');
    setEndDate('2026-11-05');
    setBudgetTier('ESTANDAR');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setPipelineStep(1);

    if (appMode === 'DEV') {
      setIsDevInspectorOpen(true);
    }

    const timer = setInterval(() => {
      setPipelineStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 750);

    const mappedBudgetCategory =
      budgetTier === 'ECONOMICO'
        ? BudgetCategory.ECONOMICO
        : budgetTier === 'LUJO'
        ? BudgetCategory.LUJO
        : BudgetCategory.ESTANDAR;

    const payload: TripPlanRequest = {
      userId: 'usr-client',
      origin: origin.includes('(') ? origin.split('(')[0].trim() : origin,
      destination: destination.includes('(') ? destination.split('(')[0].trim() : destination,
      startDate,
      endDate,
      travelers,
      budgetCategory: mappedBudgetCategory,
      currency: 'COP',
      approximateBudgetAmount: calculatedBudgetAmount,
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

  const getSpontaneityText = (val: number) => {
    switch (val) {
      case 1: return 'Agenda estricta con horarios fijos';
      case 2: return 'Itinerario planificado con holguras';
      case 3: return 'Equilibrio (mañanas organizadas, tardes libres)';
      case 4: return 'Mayormente espontáneo, slots para hallazgos locales';
      default: return 'Libre albedrío total e improvisación';
    }
  };

  const getComfortText = (val: number) => {
    switch (val) {
      case 1: return 'Modo mochilero y autenticidad rústica';
      case 2: return 'Presupuesto pragmático enfocado en experiencias';
      case 3: return 'Equilibrio entre hotel boutique y exploración';
      case 4: return 'Hospedaje de alta gama con spa y confort';
      default: return 'Exclusividad 5 estrellas y traslados privados';
    }
  };

  return (
    <div className="w-full bg-surface py-8 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in">
      {/* Header & Stepper Navigator */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/30 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-xs uppercase tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              {appMode === 'DEV' ? 'LangGraph Agent Mesh • Facade Pattern' : 'Planificación Inteligente de Viajes'}
            </span>
            {appMode === 'DEV' && (
              <span className="text-secondary font-mono text-xs hidden sm:inline">| Subsystem: /trips/plan</span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
            Diseñemos tu viaje perfecto
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
            Primero descubrimos tu estilo y ritmo como viajero. Luego definimos tu destino y adaptamos el presupuesto a tu medida.
          </p>
        </div>

        {/* Demo Data Button */}
        <button
          type="button"
          onClick={handleLoadDemoData}
          className="self-start md:self-end flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-secondary-fixed text-primary text-xs font-semibold shadow-sm transition-all border border-outline-variant/40"
        >
          <span className="material-symbols-outlined text-[18px] text-secondary">magic_button</span>
          <span>Cargar Datos de Prueba</span>
        </button>
      </div>

      {/* Dynamic 3-Step Interactive Stepper Bar */}
      <div className="grid grid-cols-3 gap-3 p-1.5 bg-surface-container rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`py-3 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 text-center ${
            activeStep === 1
              ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            activeStep === 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            1
          </span>
          <span className="hidden sm:inline">Conoce al Viajero</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`py-3 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 text-center ${
            activeStep === 2
              ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            activeStep === 2 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            2
          </span>
          <span className="hidden sm:inline">Datos del Viaje</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`py-3 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 text-center ${
            activeStep === 3
              ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            activeStep === 3 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            3
          </span>
          <span className="hidden sm:inline">Presupuesto Inteligente</span>
        </button>
      </div>

      {/* Main Grid: 8 Cols Active Step Content + 4 Cols Dynamic Summary / Agent Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Step View */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* STEP 1: EVALUACIÓN DEL VIAJERO PRIMERO */}
          {activeStep === 1 && (
            <div className="stitch-card p-6 md:p-8 bg-surface-container-lowest rounded-2xl flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">psychology</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary">Paso 1 • Conociendo a la Persona Viajera</h2>
                    <p className="text-xs text-on-surface-variant">
                      Entendemos tu energía, estilo de compañía y preferencias de ritmo
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-surface-container text-secondary text-xs font-medium rounded-full">
                  Fase Inicial
                </span>
              </div>

              {/* ¿Con quién viajas? */}
              <div>
                <label className="text-xs font-semibold text-primary block mb-2.5">
                  ¿Cómo sueles viajar en esta ocasión?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'solo', label: 'Solo', count: 1, icon: 'person' },
                    { id: 'couple', label: 'En Pareja', count: 2, icon: 'favorite' },
                    { id: 'friends', label: 'Con Amigos', count: 3, icon: 'groups' },
                    { id: 'family', label: 'En Familia', count: 4, icon: 'family_restroom' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSocialSelect(item.id as any)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                        socialPreference === item.id
                          ? 'border-secondary bg-secondary-fixed/40 shadow-sm'
                          : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-[22px] text-primary">{item.icon}</span>
                        {socialPreference === item.id && (
                          <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-primary">{item.label}</span>
                      <span className="text-[11px] text-on-surface-variant">
                        {item.count} {item.count === 1 ? 'viajero' : 'viajeros'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders Psicométricos con feedback en vivo */}
              <div className="flex flex-col gap-6 pt-2">
                {/* Slider: Espontaneidad */}
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">shuffle</span>
                      <span className="text-xs font-semibold text-primary">
                        Espontaneidad del Itinerario
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-mono text-xs font-bold">
                      {spontaneityScore} / 5
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={spontaneityScore}
                    onChange={(e) => setSpontaneityScore(Number(e.target.value))}
                    className="w-full accent-[#004a75] cursor-pointer mt-1"
                  />
                  <div className="flex justify-between items-center text-[11px] text-on-surface-variant pt-1">
                    <span>Estructurado</span>
                    <span className="text-secondary font-semibold">{getSpontaneityText(spontaneityScore)}</span>
                    <span>Libre</span>
                  </div>
                </div>

                {/* Slider: Confort vs Aventura */}
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">balance</span>
                      <span className="text-xs font-semibold text-primary">
                        Preferencia de Confort & Descanso
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-mono text-xs font-bold">
                      {comfortPriority} / 5
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={comfortPriority}
                    onChange={(e) => setComfortPriority(Number(e.target.value))}
                    className="w-full accent-[#004a75] cursor-pointer mt-1"
                  />
                  <div className="flex justify-between items-center text-[11px] text-on-surface-variant pt-1">
                    <span>Mochilero</span>
                    <span className="text-secondary font-semibold">{getComfortText(comfortPriority)}</span>
                    <span>Lujo total</span>
                  </div>
                </div>

                {/* Slider: Curiosidad Cultural */}
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">explore</span>
                      <span className="text-xs font-semibold text-primary">
                        Inmersión Cultural & Patrimonio
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-mono text-xs font-bold">
                      {culturalCuriosity} / 5
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={culturalCuriosity}
                    onChange={(e) => setCulturalCuriosity(Number(e.target.value))}
                    className="w-full accent-[#004a75] cursor-pointer mt-1"
                  />
                  <div className="flex justify-between items-center text-[11px] text-on-surface-variant pt-1">
                    <span>Solo relax</span>
                    <span className="text-secondary font-semibold">
                      {culturalCuriosity >= 4 ? 'Exploración histórica profunda' : 'Visitas culturales selectas'}
                    </span>
                    <span>Inmersión total</span>
                  </div>
                </div>
              </div>

              {/* Intereses y Pasiones */}
              <div>
                <label className="text-xs font-semibold text-primary block mb-2.5">
                  ¿Qué experiencias te apasionan? (Selecciona las que desees)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {availableInterests.map((interest) => {
                    const isSelected = interests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[17px]">{interest.icon}</span>
                        <span>{interest.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-3 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all text-xs font-semibold flex items-center gap-2 shadow-sm"
                >
                  <span>Continuar a Datos del Viaje</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATOS DEL VIAJE (DESTINO Y LOGÍSTICA) */}
          {activeStep === 2 && (
            <div className="stitch-card p-6 md:p-8 bg-surface-container-lowest rounded-2xl flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">map</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary">Paso 2 • Datos y Logística del Viaje</h2>
                    <p className="text-xs text-on-surface-variant">
                      Coordenadas aeronáuticas, fechas y duración de tu experiencia
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-surface-container text-secondary text-xs font-medium rounded-full">
                  Duración: {durationDays} {durationDays === 1 ? 'Día' : 'Días'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Origen */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">flight_takeoff</span>
                    Ciudad de Origen
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low text-on-surface text-xs font-medium rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="Bogotá (BOG)">Bogotá • El Dorado Intl (BOG)</option>
                    <option value="Medellín (MDE)">Medellín • José María Córdova (MDE)</option>
                    <option value="Cali (CLO)">Cali • Alfonso Bonilla Aragón (CLO)</option>
                  </select>
                </div>

                {/* Destino */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">flight_land</span>
                    Destino Principal
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low text-on-surface text-xs font-medium rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="Cartagena (CTG)">Cartagena de Indias • Rafael Núñez (CTG)</option>
                    <option value="Santa Marta (SMR)">Santa Marta • Simón Bolívar (SMR)</option>
                    <option value="Medellín (MDE)">Medellín • Valle de Aburrá (MDE)</option>
                  </select>
                </div>

                {/* Route Vector Graphic (Stitch Visual Vector) */}
                <div className="md:col-span-2 py-3 px-4 rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">{origin.slice(-4, -1)}</span>
                    <span className="text-[11px] text-on-surface-variant">Origen</span>
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
                    <span className="text-[11px] text-on-surface-variant">Llegada</span>
                  </div>
                </div>

                {/* Fechas */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
                    Fecha de Salida
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low text-on-surface text-xs font-medium rounded-xl border border-outline-variant/30 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">event</span>
                    Fecha de Regreso
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low text-on-surface text-xs font-medium rounded-xl border border-outline-variant/30 focus:outline-none"
                  />
                </div>

                {/* Cantidad de Viajeros */}
                <div className="md:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-secondary text-[20px]">group</span>
                    <div>
                      <span className="text-xs font-bold text-primary block">Número de Pasajeros</span>
                      <span className="text-[11px] text-on-surface-variant">
                        El presupuesto y las reservas se calibrarán para este grupo
                      </span>
                    </div>
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

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-5 py-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-3 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all text-xs font-semibold flex items-center gap-2 shadow-sm"
                >
                  <span>Continuar a Presupuesto</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRESUPUESTO INTELIGENTE Y ADAPTATIVO (SIN NÚMERO DIRECTO A MENOS QUE ELIJA PERSONALIZADO) */}
          {activeStep === 3 && (
            <div className="stitch-card p-6 md:p-8 bg-surface-container-lowest rounded-2xl flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">payments</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary">Paso 3 • Presupuesto Adaptativo</h2>
                    <p className="text-xs text-on-surface-variant">
                      Sugerencias calculadas automáticamente para {travelers} {travelers === 1 ? 'viajero' : 'viajeros'} ({durationDays} días)
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-surface-container-low text-primary font-mono text-xs rounded-full">
                  COP ($)
                </span>
              </div>

              {/* Segmented Tier Controller (Stitch Inspired) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 bg-surface-container rounded-xl">
                <button
                  type="button"
                  onClick={() => setBudgetTier('ECONOMICO')}
                  className={`py-3 px-3 rounded-lg text-xs transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    budgetTier === 'ECONOMICO'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span>Económico</span>
                  <span className="text-[11px] font-mono text-secondary">
                    ~ {formatCOP(DAILY_RATES.ECONOMICO * travelers * durationDays)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBudgetTier('ESTANDAR')}
                  className={`py-3 px-3 rounded-lg text-xs transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    budgetTier === 'ESTANDAR'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span>Estándar Plus</span>
                  <span className="text-[11px] font-mono text-secondary">
                    ~ {formatCOP(DAILY_RATES.ESTANDAR * travelers * durationDays)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBudgetTier('LUJO')}
                  className={`py-3 px-3 rounded-lg text-xs transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    budgetTier === 'LUJO'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span>Lujo Boutique</span>
                  <span className="text-[11px] font-mono text-secondary">
                    ~ {formatCOP(DAILY_RATES.LUJO * travelers * durationDays)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBudgetTier('CUSTOM')}
                  className={`py-3 px-3 rounded-lg text-xs transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    budgetTier === 'CUSTOM'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span>Personalizado</span>
                  <span className="text-[11px] font-mono text-secondary">A tu elección</span>
                </button>
              </div>

              {/* Tier Explanation Card */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-[22px] text-secondary mt-0.5">info</span>
                <div className="text-xs leading-relaxed text-on-surface">
                  {budgetTier === 'ECONOMICO' && (
                    <p>
                      <strong>Categoría Económica:</strong> Optimizado para maximizar el valor. Incluye hostales con encanto y buena calificación, vuelos en tarifas promocionales y gastronomía local auténtica.
                    </p>
                  )}
                  {budgetTier === 'ESTANDAR' && (
                    <p>
                      <strong>Categoría Estándar Plus (Recomendada):</strong> Equilibrio ideal. Hoteles 3-4★ seleccionados, vuelos en horarios cómodos y actividades guiadas sin sobrecostos innecesarios.
                    </p>
                  )}
                  {budgetTier === 'LUJO' && (
                    <p>
                      <strong>Categoría Lujo Boutique:</strong> Exclusividad y descanso premium. Resorts o casonas históricas 5★, traslados privados y experiencias culinarias de autor.
                    </p>
                  )}
                  {budgetTier === 'CUSTOM' && (
                    <p>
                      <strong>Presupuesto Personalizado:</strong> Especifica el monto exacto en pesos colombianos que deseas invertir. Nuestro motor distribuirá la cifra entre vuelos, hospedaje y actividades.
                    </p>
                  )}
                </div>
              </div>

              {/* INPUT NUMÉRICO: SOLO SI ELIGE "PERSONALIZADO" */}
              {budgetTier === 'CUSTOM' && (
                <div className="p-4 rounded-xl bg-surface-container-lowest border-2 border-secondary animate-fade-in flex flex-col gap-2">
                  <label className="text-xs font-semibold text-primary">
                    Monto Total Personalizado para {travelers} {travelers === 1 ? 'viajero' : 'viajeros'} ({durationDays} días)
                  </label>
                  <div className="relative flex items-center rounded-xl bg-surface-container-low h-12 px-3">
                    <span className="font-mono text-xs text-primary font-bold pr-2">COP $</span>
                    <input
                      type="number"
                      step="100000"
                      min="500000"
                      value={customBudgetAmount}
                      onChange={(e) => setCustomBudgetAmount(Number(e.target.value))}
                      className="w-full bg-transparent font-mono text-sm font-bold text-primary focus:outline-none"
                    />
                    <span className="text-[11px] font-mono text-on-surface-variant uppercase">COP</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Equivale a aprox. {formatCOP(Math.round(customBudgetAmount / (travelers * durationDays)))} por persona / día.
                  </span>
                </div>
              )}

              {/* Desglose Heurístico de Reparto (Stitch Metric Bar) */}
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary">Inversión Estimada Consolidada:</span>
                  <span className="font-mono font-bold text-secondary text-sm">
                    {formatCOP(calculatedBudgetAmount)}
                  </span>
                </div>

                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden flex my-1">
                  <div className="bg-primary h-full" style={{ width: '42%' }} title="Hospedaje 42%"></div>
                  <div className="bg-secondary h-full" style={{ width: '30%' }} title="Vuelos 30%"></div>
                  <div className="bg-secondary-container h-full" style={{ width: '28%' }} title="Experiencias 28%"></div>
                </div>

                <div className="flex justify-between font-mono text-[11px] text-on-surface-variant">
                  <span>Hospedaje (42%)</span>
                  <span>Vuelos (30%)</span>
                  <span>Experiencias (28%)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Atrás</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit()}
                  className="flex-1 py-3.5 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                      <span>Diseñando tu Itinerario Inteligente...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">flight_takeoff</span>
                      <span>
                        {appMode === 'DEV'
                          ? 'Planificar Itinerario con IA (LangGraph Multiagent Mesh)'
                          : 'Generar Mi Itinerario Inteligente'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Dynamic Trip Profile Summary in User Mode / LangGraph Monitor in Dev Mode */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* User Mode Dynamic Profile Card */}
          <div className="stitch-card p-6 bg-surface-container-lowest rounded-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-[22px]">badge</span>
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                Resumen de tu Viajero
              </h3>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Modalidad:</span>
                <span className="font-semibold text-primary capitalize">
                  {socialPreference === 'solo' && 'Solo (1 persona)'}
                  {socialPreference === 'couple' && 'En Pareja (2 personas)'}
                  {socialPreference === 'friends' && `Con Amigos (${travelers} personas)`}
                  {socialPreference === 'family' && `En Familia (${travelers} personas)`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Ruta prevista:</span>
                <span className="font-semibold text-primary">
                  {origin.slice(-4, -1)} ➔ {destination.slice(-4, -1)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Duración:</span>
                <span className="font-semibold text-primary">
                  {durationDays} días ({startDate} al {endDate})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Estilo de viaje:</span>
                <span className="font-semibold text-secondary">
                  {comfortPriority >= 4 ? 'Confort & Exclusividad' : comfortPriority <= 2 ? 'Aventura & Exploración' : 'Balanceado'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Presupuesto:</span>
                <span className="font-mono font-bold text-primary">
                  {budgetTier === 'CUSTOM' ? 'Personalizado' : budgetTier}
                </span>
              </div>

              <div className="mt-2 pt-3 border-t border-outline-variant/20">
                <span className="text-[11px] text-on-surface-variant block mb-1">Intereses prioritarios:</span>
                <div className="flex flex-wrap gap-1">
                  {interests.map((i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-surface-container text-secondary text-[10px] font-medium capitalize">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dev Mode Only: LangGraph Multi-Agent Mesh Monitor */}
          {appMode === 'DEV' && (
            <div className="stitch-card p-6 bg-surface-container-low rounded-2xl border border-secondary/30 animate-fade-in">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant/30">
                <span className="material-symbols-outlined text-secondary text-[22px]">hub</span>
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Malla Multiagente LangGraph
                  </h3>
                  <span className="text-[10px] font-mono text-secondary">Pipeline Orquestado</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { name: 'Personality Profiler', desc: 'Arquetipo psicométrico', step: 1, icon: 'psychology' },
                  { name: 'Transport Adapter', desc: 'Vuelos y traslados', step: 2, icon: 'flight' },
                  { name: 'Activities Synthesizer', desc: 'Agenda horaria diaria', step: 3, icon: 'local_activity' },
                  { name: 'Budget Optimizer', desc: 'Límites y reservas COP', step: 4, icon: 'payments' },
                ].map((agent) => {
                  const isActive = pipelineStep >= agent.step;
                  return (
                    <div
                      key={agent.name}
                      className={`p-2.5 rounded-xl flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-surface-container-lowest text-primary border border-secondary/40 shadow-sm'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">{agent.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{agent.name}</span>
                          <span className="text-[10px] text-on-surface-variant">{agent.desc}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-secondary-fixed text-on-secondary-fixed font-bold'
                            : 'bg-surface-container-high text-outline'
                        }`}
                      >
                        {isActive ? 'READY' : 'STANDBY'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-surface-container-lowest text-xs text-on-surface-variant leading-relaxed border border-outline-variant/20">
                <p className="flex items-center gap-1.5 font-bold text-primary mb-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
                  Patrón Facade Activo
                </p>
                <code className="block mt-1 font-mono text-[10px] bg-surface-container p-1 rounded text-primary">
                  POST /api/v1/trips/plan
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
