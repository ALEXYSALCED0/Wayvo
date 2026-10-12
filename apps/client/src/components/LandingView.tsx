import React from 'react';
import { ArrowRight, Sparkles, Compass, ShieldCheck, Zap, Terminal, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function LandingView() {
  const { setCurrentView, setAppMode } = useApp();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Hero Section */}
      <section
        style={{
          width: '100%',
          maxWidth: '1100px',
          padding: '72px 24px 48px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid var(--border-accent)',
            color: 'var(--color-primary)',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '28px',
          }}
        >
          <Sparkles size={16} />
          <span>Arquitectura Limpia • Patrones Saga, Facade, Mediator, Adapter • LangGraph</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(40px, 6vw, 68px)',
            fontWeight: 800,
            lineHeight: 1.08,
            marginBottom: '24px',
            background: 'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: '900px',
          }}
        >
          Planifica viajes con IA, resérvalos con Sagas y adáptalos ante imprevistos.
        </h1>

        <p
          style={{
            fontSize: '18px',
            color: 'var(--text-muted)',
            maxWidth: '680px',
            marginBottom: '40px',
            lineHeight: 1.6,
          }}
        >
          Wayvo analiza tu perfil psicológico con agentes inteligentes en paralelo, garantiza la consistencia
          distribuida de tus reservas y recalcula tu itinerario automáticamente si pierdes un tren o vuelo.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setAppMode('USER');
              setCurrentView('ONBOARDING');
            }}
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              color: '#fff',
              padding: '16px 32px',
              borderRadius: 'var(--radius-full)',
              fontSize: '16px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-glow)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>Planificar mi Viaje (Modo Usuario)</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => {
              setAppMode('DEV');
              setCurrentView('ONBOARDING');
            }}
            style={{
              background: 'var(--bg-card)',
              color: '#fff',
              border: '1px solid var(--border-light)',
              padding: '16px 28px',
              borderRadius: 'var(--radius-full)',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Terminal size={18} color="var(--color-accent)" />
            <span>Explorar Modo Arquitectura & Demo</span>
          </button>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section
        style={{
          width: '100%',
          maxWidth: '1100px',
          padding: '24px 24px 64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              marginBottom: '16px',
            }}
          >
            <Compass size={26} />
          </div>
          <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '10px' }}>Multiagentes con LangGraph</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Fan-out paralelo: analiza tu test psicométrico, selecciona rutas de transporte, actividades y gastronomía típica
            con Gemini, integrándolas con inventario de proveedores reales.
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-success)',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '10px' }}>Saga con Rollback Automático</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Orquestación transaccional distribuida. Si un vuelo o hotel no tiene cupo en el último paso, la Saga ejecuta
            compensación en orden LIFO cancelando la reserva y el viaje para proteger tus fondos.
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
              marginBottom: '16px',
            }}
          >
            <Zap size={26} />
          </div>
          <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '10px' }}>Patrón Mediator en Vivo</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            ¿Perdiste un tren o cancelaron un tour? El mediador desacoplado genera opciones inteligentes en tiempo real
            e inyecta los nuevos eventos en tu itinerario activo sin afectar los días posteriores.
          </p>
        </div>
      </section>
    </div>
  );
}
