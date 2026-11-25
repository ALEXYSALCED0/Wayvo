import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatResetDate } from '../utils/plan';

// Aviso de cuántos planes de IA le quedan a una cuenta FREE este mes.
// Es solo informativo: quien hace cumplir el límite es el servidor.
export const PlanLimitBanner: React.FC = () => {
  const { isPremium, entitlements } = useAuth();
  const { setCurrentView } = useApp();

  if (isPremium || !entitlements) return null;

  const { remaining, limit, resetsAt } = entitlements.aiPlans;
  const left = remaining ?? 0;
  const empty = left === 0;
  const low = left === 1;

  const tone = empty
    ? 'bg-error-container text-on-error-container border-error/30'
    : low
    ? 'bg-amber-50 text-amber-900 border-amber-300'
    : 'bg-surface-container-low text-on-surface border-outline-variant/30';

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${tone}`} role={empty ? 'alert' : 'status'}>
      <span className="material-symbols-outlined text-[22px] mt-0.5">{empty ? 'lock' : 'bolt'}</span>
      <div className="flex-1 text-xs leading-relaxed">
        {empty ? (
          <p>
            <strong>Ya usaste tus {limit} planes de IA de este mes.</strong> Se renuevan el {formatResetDate(resetsAt)}.
            Con PREMIUM generas planes sin límite.
          </p>
        ) : (
          <p>
            <strong>
              Te {left === 1 ? 'queda' : 'quedan'} {left} de {limit} planes de IA este mes.
            </strong>{' '}
            Se renuevan el {formatResetDate(resetsAt)}. El presupuesto Lujo es solo para PREMIUM.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setCurrentView('SUBSCRIPTION')}
        className="shrink-0 px-3 py-1.5 rounded-full bg-primary-container hover:bg-primary text-on-primary text-[11px] font-semibold transition-colors"
      >
        Ver PREMIUM
      </button>
    </div>
  );
};
