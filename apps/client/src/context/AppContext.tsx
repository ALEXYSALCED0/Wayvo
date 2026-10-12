import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AIPlanRecommendationResult,
  Trip,
  ConfirmTripSagaResult,
  CompensationLogOutput,
} from '@wayvo/contracts';
import { subscribeToTelemetry, TelemetryLogEntry, WayvoApi } from '../services/api';

export type AppView = 'LANDING' | 'ONBOARDING' | 'PROPOSAL' | 'CHECKOUT' | 'ACTIVE_TRIP';
export type AppMode = 'USER' | 'DEV';

interface AppContextType {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  
  // Trip & Plan State
  planResult: AIPlanRecommendationResult | null;
  setPlanResult: (plan: AIPlanRecommendationResult | null) => void;
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
  checkoutResult: ConfirmTripSagaResult | null;
  setCheckoutResult: (result: ConfirmTripSagaResult | null) => void;
  compensationLog: CompensationLogOutput | null;
  setCompensationLog: (log: CompensationLogOutput | null) => void;

  // Selected event for incident handling
  selectedEventId: string | null;
  setSelectedEventId: (eventId: string | null) => void;

  // Telemetry & Dev State
  telemetryLogs: TelemetryLogEntry[];
  clearTelemetry: () => void;
  isDevInspectorOpen: boolean;
  setIsDevInspectorOpen: (open: boolean) => void;
  chaosMode: 'normal' | 'unavailable' | 'slow' | 'error';
  setChaosMode: (mode: 'normal' | 'unavailable' | 'slow' | 'error') => void;

  // Chat State
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appMode, setAppMode] = useState<AppMode>('USER');
  const [currentView, setCurrentView] = useState<AppView>('LANDING');

  const [planResult, setPlanResult] = useState<AIPlanRecommendationResult | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<ConfirmTripSagaResult | null>(null);
  const [compensationLog, setCompensationLog] = useState<CompensationLogOutput | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogEntry[]>([]);
  const [isDevInspectorOpen, setIsDevInspectorOpen] = useState(false);
  const [chaosMode, setChaosModeState] = useState<'normal' | 'unavailable' | 'slow' | 'error'>('normal');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTelemetry((entry) => {
      setTelemetryLogs((prev) => [entry, ...prev].slice(0, 50));
    });
    return unsubscribe;
  }, []);

  const clearTelemetry = () => setTelemetryLogs([]);

  const setChaosMode = async (mode: 'normal' | 'unavailable' | 'slow' | 'error') => {
    setChaosModeState(mode);
    try {
      if (mode === 'normal') {
        await WayvoApi.resetSimulation();
      } else {
        await WayvoApi.simulateFailure(mode);
      }
    } catch {
      // Ignored if service is offline in initial setup
    }
  };

  return (
    <AppContext.Provider
      value={{
        appMode,
        setAppMode,
        currentView,
        setCurrentView,
        planResult,
        setPlanResult,
        activeTrip,
        setActiveTrip,
        checkoutResult,
        setCheckoutResult,
        compensationLog,
        setCompensationLog,
        selectedEventId,
        setSelectedEventId,
        telemetryLogs,
        clearTelemetry,
        isDevInspectorOpen,
        setIsDevInspectorOpen,
        chaosMode,
        setChaosMode,
        isChatOpen,
        setIsChatOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
