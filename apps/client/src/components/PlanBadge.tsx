import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// Chip del plan de la cuenta en la barra superior. Lleva a la pantalla de suscripción.
export const PlanBadge: React.FC = () => {
  const { isPremium, entitlements } = useAuth();
  const { setCurrentView, currentView } = useApp();

  if (!entitlements) return null;

  const remaining = entitlements.aiPlans.remaining ?? 0;
  const limit = entitlements.aiPlans.limit ?? 0;
  const low = !isPremium && remaining <= 1;

  const tone = isPremium
    ? 'bg-amber-100 text-amber-900 border-amber-300'
    : low
    ? 'bg-error-container text-on-error-container border-error/30'
    : 'bg-surface-container text-primary border-outline-variant/30';

  return (
    <button
      type="button"
      onClick={() => setCurrentView('SUBSCRIPTION')}
      title={
        isPremium
          ? 'Cuenta PREMIUM: planes ilimitados y todos los presupuestos'
          : `Te quedan ${remaining} de ${limit} planes de IA este mes. Haz clic para ver PREMIUM`
      }
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all hover:shadow-sm ${tone} ${
        currentView === 'SUBSCRIPTION' ? 'ring-2 ring-secondary/40' : ''
      }`}
    >
      <span className="material-symbols-outlined text-[14px]">{isPremium ? 'workspace_premium' : 'bolt'}</span>
      {isPremium ? (
        <span>PREMIUM</span>
      ) : (
        <>
          <span>
            FREE · {remaining}/{limit}
          </span>
          <span className="hidden lg:inline font-semibold">· Mejorar</span>
        </>
      )}
    </button>
  );
};
