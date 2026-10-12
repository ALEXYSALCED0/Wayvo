import React, { useState } from 'react';
import { Compass, Sparkles, Calendar, Users, DollarSign, Brain, ArrowRight, Loader2, PlayCircle, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import { BudgetCategory, TripPlanRequest } from '@wayvo/contracts';

export function OnboardingView() {
  const { setCurrentView, setPlanResult, appMode, setIsDevInspectorOpen } = useApp();

  // Form State
  const [origin, setOrigin] = useState('Medellin');
  const [destination, setDestination] = useState('Cartagena');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-05');
  const [travelers, setTravelers] = useState(2);
  const [budgetCategory, setBudgetCategory] = useState<BudgetCategory>(BudgetCategory.ESTANDAR);
  const [approximateBudgetAmount, setApproximateBudgetAmount] = useState(3500000);

  // Psychological Assessment State
  const [spontaneityScore, setSpontaneityScore] = useState(4);
  const [comfortPriority, setComfortPriority] = useState(3);
  const [culturalCuriosity, setCulturalCuriosity] = useState(5);
  const [socialPreference, setSocialPreference] = useState<'solo' | 'couple' | 'family' | 'friends' | 'group'>('couple');
  const [physicalActivityLevel, setPhysicalActivityLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [interests, setInterests] = useState<string[]>(['historia', 'playa', 'gastronomia']);

  // Loading Pipeline State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);

  // Quick Demo Autofill
  const handleLoadDemoData = () => {
    setOrigin('Medellin');
    setDestination('Cartagena');
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
      setPipelineStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 900);

    const payload: TripPlanRequest = {
      userId: 'usr-client',
      origin,
      destination,
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
      preferredStyle: 'Cultural' as any,
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
      alert(`Error al generar el plan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: '32px 20px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      {/* Title & Quick Demo Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Planificador Inteligente de Viaje</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Configura los parámetros de tu viaje y completa el perfil psicométrico para los agentes LangGraph.
          </p>
        </div>

        {/* Quick Demo Button for Presentations */}
        <button
          type="button"
          onClick={handleLoadDemoData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid var(--border-accent)',
            color: 'var(--color-accent)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <PlayCircle size={15} />
          <span>Cargar Datos Demo</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Basic Trip Details */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="var(--color-primary)" />
            <span>1. Destino y Fechas</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Ciudad de Origen</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Ciudad de Destino</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Fecha de Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Fecha de Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Budget & Travelers */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="var(--color-success)" />
            <span>2. Presupuesto y Viajeros</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Número de Viajeros</label>
              <input
                type="number"
                min="1"
                max="10"
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Categoría de Presupuesto</label>
              <select
                value={budgetCategory}
                onChange={(e) => setBudgetCategory(e.target.value as BudgetCategory)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
              >
                <option value={BudgetCategory.ECONOMICO}>Económico (Mochilero / Low-Cost)</option>
                <option value={BudgetCategory.ESTANDAR}>Estándar (Confort equilibrado)</option>
                <option value={BudgetCategory.LUJO}>Lujo (Premium / 5 Estrellas)</option>
                <option value={BudgetCategory.PERSONALIZADO}>Personalizado</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Presupuesto Aproximado (COP)</label>
              <input
                type="number"
                step="50000"
                value={approximateBudgetAmount}
                onChange={(e) => setApproximateBudgetAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Psychological Assessment Test (Requisito Distintivo) */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} color="var(--color-accent)" />
              <span>3. Evaluación Psicológica del Viajero</span>
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
              Procesado por personality_agent
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Slider 1: Espontaneidad */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#fff' }}>Espontaneidad vs Planificación Rígida</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{spontaneityScore} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={spontaneityScore}
                onChange={(e) => setSpontaneityScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>1 (Itinerario estricto)</span>
                <span>5 (Totalmente improvisado)</span>
              </div>
            </div>

            {/* Slider 2: Confort */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#fff' }}>Prioridad de Confort vs Aventura</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{comfortPriority} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={comfortPriority}
                onChange={(e) => setComfortPriority(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>1 (Aventura agreste)</span>
                <span>5 (Máximo confort/descanso)</span>
              </div>
            </div>

            {/* Slider 3: Curiosidad Cultural */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#fff' }}>Curiosidad Cultural y Gastronómica</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{culturalCuriosity} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={culturalCuriosity}
                onChange={(e) => setCulturalCuriosity(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>1 (Atracciones populares)</span>
                <span>5 (Inmersión local profunda)</span>
              </div>
            </div>

            {/* Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Preferencia Social</label>
                <select
                  value={socialPreference}
                  onChange={(e) => setSocialPreference(e.target.value as any)}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
                >
                  <option value="couple">En Pareja</option>
                  <option value="solo">En Solitario</option>
                  <option value="friends">Con Amigos</option>
                  <option value="family">En Familia</option>
                  <option value="group">En Grupo</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Nivel de Actividad Física</label>
                <select
                  value={physicalActivityLevel}
                  onChange={(e) => setPhysicalActivityLevel(e.target.value as any)}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
                >
                  <option value="low">Bajo (Paseos lentos, relajado)</option>
                  <option value="moderate">Moderado (Caminatas urbanas)</option>
                  <option value="high">Alto (Trekking, senderismo activo)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submit & Loading Pipeline Display */}
        {isSubmitting ? (
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
              <Loader2 size={24} className="spin" color="var(--color-primary)" />
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                Ejecutando Grafo Multiagente LangGraph...
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div style={{ color: pipelineStep >= 1 ? 'var(--color-success)' : 'var(--text-dim)' }}>
                {pipelineStep >= 1 ? '✓' : '○'} Fan-out: personality_agent, transport_agent & activities_food_agent
              </div>
              <div style={{ color: pipelineStep >= 2 ? 'var(--color-success)' : 'var(--text-dim)' }}>
                {pipelineStep >= 2 ? '✓' : '○'} Fan-in: provider_catalog_agent cruzando inventario real
              </div>
              <div style={{ color: pipelineStep >= 3 ? 'var(--color-success)' : 'var(--text-dim)' }}>
                {pipelineStep >= 3 ? '✓' : '○'} budget_agent validando desglose y límites
              </div>
              <div style={{ color: pipelineStep >= 4 ? 'var(--color-success)' : 'var(--text-dim)' }}>
                {pipelineStep >= 4 ? '✓' : '○'} itinerary_builder construyendo agenda horaria sin solapes
              </div>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              color: '#fff',
              padding: '16px 28px',
              borderRadius: 'var(--radius-full)',
              fontSize: '16px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-glow)',
              transition: 'transform 0.2s ease',
            }}
          >
            <span>Generar Plan Inteligente con IA</span>
            <ArrowRight size={18} />
          </button>
        )}
      </form>
    </div>
  );
}
