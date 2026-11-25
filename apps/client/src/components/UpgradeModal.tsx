import React from 'react';
import { AiPlanDenialCode, AccountEntitlements } from '@wayvo/contracts';
import { formatResetDate } from '../utils/plan';

export interface UpgradeReason {
  code: string;
  entitlements?: AccountEntitlements;
}

interface Props {
  reason: UpgradeReason;
  onClose: () => void;
  onUpgrade: () => void;
}

// Se muestra cuando una cuenta FREE choca con un límite (sin planes este mes o presupuesto Lujo).
export const UpgradeModal: React.FC<Props> = ({ reason, onClose, onUpgrade }) => {
  const isLuxury = reason.code === AiPlanDenialCode.LUXURY_REQUIRES_PREMIUM;
  const resetsAt = reason.entitlements?.aiPlans.resetsAt;
  const limit = reason.entitlements?.aiPlans.limit;

  return (
    <div
      className="fixed inset-0 z-[60] bg-inverse-surface/50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">{isLuxury ? 'diamond' : 'workspace_premium'}</span>
          </div>
          <h2 className="text-lg font-bold text-primary">
            {isLuxury ? 'El presupuesto Lujo es PREMIUM' : 'Llegaste a tu límite del mes'}
          </h2>
        </div>

        <p className="text-sm text-on-surface-variant leading-relaxed">
          {isLuxury
            ? 'Las cuentas gratuitas pueden planificar con presupuesto Económico, Estándar o Personalizado. Con PREMIUM desbloqueas también Lujo.'
            : `Las cuentas gratuitas generan hasta ${limit ?? 5} planes de IA por mes${
                resetsAt ? ` y los tuyos se renuevan el ${formatResetDate(resetsAt)}` : ''
              }. Con PREMIUM no hay límite.`}
        </p>

        <p className="text-xs text-on-surface-variant">
          Planificar y calcular tu presupuesto siempre es gratis. Reservar tampoco requiere pago en Wayvo.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors"
          >
            {isLuxury ? 'Elegir otro presupuesto' : 'Ahora no'}
          </button>
          <button
            type="button"
            onClick={onUpgrade}
            className="px-4 py-2 rounded-full bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
            Ver PREMIUM
          </button>
        </div>
      </div>
    </div>
  );
};
