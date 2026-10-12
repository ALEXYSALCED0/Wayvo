import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { OnboardingView } from './components/OnboardingView';
import { ProposalView } from './components/ProposalView';
import { CheckoutView } from './components/CheckoutView';
import { ActiveTripView } from './components/ActiveTripView';
import { DevInspectorHUD } from './components/DevInspectorHUD';
import { AIChatDrawer } from './components/AIChatDrawer';
import { MessageSquare, Terminal } from 'lucide-react';

function AppContent() {
  const { currentView, isChatOpen, setIsChatOpen, appMode, isDevInspectorOpen, setIsDevInspectorOpen } = useApp();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentView === 'LANDING' && <LandingView />}
        {currentView === 'ONBOARDING' && <OnboardingView />}
        {currentView === 'PROPOSAL' && <ProposalView />}
        {currentView === 'CHECKOUT' && <CheckoutView />}
        {currentView === 'ACTIVE_TRIP' && <ActiveTripView />}
      </main>

      {/* Floating Action Button for AI Chat */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          title="Abrir Asistente de Viajes IA"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            zIndex: 40,
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Floating Action Button for Dev Inspector (Only in Dev Mode) */}
      {appMode === 'DEV' && !isDevInspectorOpen && (
        <button
          onClick={() => setIsDevInspectorOpen(true)}
          title="Abrir Panel de Telemetría Dev"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid var(--border-accent)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
        >
          <Terminal size={16} color="var(--color-primary)" />
          <span>Inspector de Red & Caos</span>
        </button>
      )}

      {/* Slide-over Drawers */}
      <AIChatDrawer />
      <DevInspectorHUD />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
