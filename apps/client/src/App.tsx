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

function AppContent() {
  const { currentView, isChatOpen, setIsChatOpen, appMode, isDevInspectorOpen, setIsDevInspectorOpen } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans text-on-surface antialiased relative">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {currentView === 'LANDING' && <LandingView />}
        {currentView === 'ONBOARDING' && <OnboardingView />}
        {currentView === 'PROPOSAL' && <ProposalView />}
        {currentView === 'CHECKOUT' && <CheckoutView />}
        {currentView === 'ACTIVE_TRIP' && <ActiveTripView />}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 md:px-8 border-t border-outline-variant/30 bg-surface-container-lowest text-center text-xs text-on-surface-variant flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">Wayvo</span>
          <span>• Azure Clarity Travel Platform</span>
        </div>
        {appMode === 'DEV' && (
          <div className="font-mono text-[11px] text-secondary">
            GoF: Facade • Saga • Adapter • Mediator | AI: LangGraph
          </div>
        )}
        <div>Diseño de Software 2 • Universidad del Norte</div>
      </footer>

      {/* Floating Action Button for AI Chat */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          title="Abrir Asistente de Viajes IA"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-container hover:bg-primary text-on-primary flex items-center justify-center shadow-xl hover:scale-105 transition-all z-40"
        >
          <span className="material-symbols-outlined text-[26px]">smart_toy</span>
        </button>
      )}

      {/* Floating Action Button for Dev Inspector (Only in Dev Mode) */}
      {appMode === 'DEV' && !isDevInspectorOpen && (
        <button
          onClick={() => setIsDevInspectorOpen(true)}
          title="Abrir Panel de Telemetría Dev"
          className="fixed bottom-6 left-6 px-4 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center gap-2 shadow-xl hover:bg-secondary transition-all z-40 border border-secondary-fixed/30"
        >
          <span className="material-symbols-outlined text-[18px] text-secondary-fixed">terminal</span>
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
