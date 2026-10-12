import React, { useState } from 'react';
import { Plane, Compass, Sparkles, Terminal, ShieldCheck, ArrowRight, Zap, Code2 } from 'lucide-react';

export default function App() {
  const [appMode, setAppMode] = useState<'USER' | 'DEV'>('USER');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner / Dev Mode HUD Indicator */}
      {appMode === 'DEV' && (
        <div
          style={{
            background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            letterSpacing: '0.05em',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} />
            <span>MODO ARQUITECTURA & DESARROLLADOR ACTIVO — TELEMETRÍA Y CONTROLES DE CAOS DISPONIBLES</span>
          </div>
          <span style={{ opacity: 0.85 }}>Gateway: localhost:3000</span>
        </div>
      )}

      {/* Main Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card-glass)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Plane size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>WAYVO</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1 }}>AI-Powered Travel OS</p>
          </div>
        </div>

        {/* Dual Mode Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-main)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={() => setAppMode('USER')}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              background: appMode === 'USER' ? 'var(--color-primary)' : 'transparent',
              color: appMode === 'USER' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            Modo Usuario
          </button>
          <button
            onClick={() => setAppMode('DEV')}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: appMode === 'DEV' ? 'var(--color-accent)' : 'transparent',
              color: appMode === 'DEV' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <Code2 size={14} />
            Modo Dev
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid var(--border-accent)',
            color: 'var(--color-primary)',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          <Sparkles size={16} />
          <span>Clean Architecture • Microservicios • 4 Patrones GoF • Multiagentes LangGraph</span>
        </div>

        <h1
          style={{
            fontSize: ' clamp(36px, 5vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '20px',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Viajes planificados por IA, <br />
          blindados por Sagas y adaptables en vivo.
        </h1>

        <p
          style={{
            fontSize: '18px',
            color: 'var(--text-muted)',
            maxWidth: '650px',
            marginBottom: '36px',
            lineHeight: 1.6,
          }}
        >
          La plataforma inteligente que comprende tu perfil psicológico, negocia vuelos y hoteles reales,
          y recalculá dinámicamente tu itinerario ante cualquier imprevisto.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: 'var(--radius-full)',
              fontSize: '16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>Comenzar Planificación</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => setAppMode(appMode === 'USER' ? 'DEV' : 'USER')}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-light)',
              padding: '14px 24px',
              borderRadius: 'var(--radius-full)',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Terminal size={16} color="var(--color-accent)" />
            <span>{appMode === 'USER' ? 'Ver Arquitectura (Modo Dev)' : 'Volver a Modo Usuario'}</span>
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginTop: '64px',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>
              <Compass size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>LangGraph Multiagente</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Evaluación psicológica, cotización de transporte, actividades y gastronomía ejecutadas en paralelo con Gemini.
            </p>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ color: 'var(--color-success)', marginBottom: '12px' }}>
              <ShieldCheck size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Orquestación Saga</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Transacciones distribuidas entre Viajes, Reservas y Proveedores con rollback compensatorio automático.
            </p>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>
              <Zap size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Patrón Mediator en Vivo</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Resolución de retrasos y cancelaciones recalculando alternativas inteligentes sin acoplamiento.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '20px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-dim)',
        }}
      >
        Wayvo MVP • Universidad del Norte • Diseño de Software 2
      </footer>
    </div>
  );
}
