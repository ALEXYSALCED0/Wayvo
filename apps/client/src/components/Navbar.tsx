import React from 'react';
import { Plane, Code2, Terminal, MessageSquare, Compass, ShieldCheck, Calendar, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Navbar() {
  const {
    appMode,
    setAppMode,
    currentView,
    setCurrentView,
    isDevInspectorOpen,
    setIsDevInspectorOpen,
    isChatOpen,
    setIsChatOpen,
    telemetryLogs,
  } = useApp();

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-card-glass)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Home */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => setCurrentView('LANDING')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Plane size={20} color="#fff" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>WAYVO</h2>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1 }}>AI-Powered Travel OS</p>
          </div>
        </button>

        {currentView !== 'LANDING' && (
          <button
            onClick={() => setCurrentView('LANDING')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <ArrowLeft size={14} />
            <span>Inicio</span>
          </button>
        )}
      </div>

      {/* Dev Mode Quick Nav Navigation Bar */}
      {appMode === 'DEV' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={() => setCurrentView('ONBOARDING')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 600,
              background: currentView === 'ONBOARDING' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: currentView === 'ONBOARDING' ? 'var(--color-primary)' : 'var(--text-muted)',
            }}
          >
            1. Plan (IA)
          </button>
          <button
            onClick={() => setCurrentView('PROPOSAL')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 600,
              background: currentView === 'PROPOSAL' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: currentView === 'PROPOSAL' ? 'var(--color-primary)' : 'var(--text-muted)',
            }}
          >
            2. Itinerario
          </button>
          <button
            onClick={() => setCurrentView('CHECKOUT')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 600,
              background: currentView === 'CHECKOUT' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: currentView === 'CHECKOUT' ? 'var(--color-primary)' : 'var(--text-muted)',
            }}
          >
            3. Saga Checkout
          </button>
          <button
            onClick={() => setCurrentView('ACTIVE_TRIP')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 600,
              background: currentView === 'ACTIVE_TRIP' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: currentView === 'ACTIVE_TRIP' ? 'var(--color-primary)' : 'var(--text-muted)',
            }}
          >
            4. Viaje & Mediator
          </button>
        </div>
      )}

      {/* Actions and Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Chat Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--radius-full)',
            background: isChatOpen ? 'var(--color-accent)' : 'var(--bg-card)',
            color: '#fff',
            border: '1px solid var(--border-light)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <MessageSquare size={14} />
          <span>Asistente IA</span>
        </button>

        {/* Dev Telemetry Toggle Button */}
        {appMode === 'DEV' && (
          <button
            onClick={() => setIsDevInspectorOpen(!isDevInspectorOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              background: isDevInspectorOpen ? 'var(--color-primary)' : 'rgba(15, 23, 42, 0.8)',
              color: '#fff',
              border: '1px solid var(--border-accent)',
              fontSize: '12px',
              fontWeight: 600,
              position: 'relative',
            }}
          >
            <Terminal size={14} />
            <span>Inspector ({telemetryLogs.length})</span>
          </button>
        )}

        {/* Dual Mode Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-main)',
            padding: '3px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={() => {
              setAppMode('USER');
              setIsDevInspectorOpen(false);
            }}
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 600,
              background: appMode === 'USER' ? 'var(--color-primary)' : 'transparent',
              color: appMode === 'USER' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            Modo Usuario
          </button>
          <button
            onClick={() => {
              setAppMode('DEV');
              setIsDevInspectorOpen(true);
            }}
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: appMode === 'DEV' ? 'var(--color-accent)' : 'transparent',
              color: appMode === 'DEV' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <Code2 size={13} />
            Modo Dev
          </button>
        </div>
      </div>
    </header>
  );
}
