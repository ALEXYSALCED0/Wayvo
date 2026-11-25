import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { ActivationFailureCode, MySubscriptionDTO, PremiumPlanInfo } from '@wayvo/contracts';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ApiError, PaymentsApi } from '../services/api';
import { getStripe, STRIPE_PUBLISHABLE_KEY } from '../services/stripe';
import { formatDate, formatUsd } from '../utils/plan';

// Si el banco pide verificar la tarjeta (3D Secure), Stripe saca al usuario de la página y lo
// devuelve después. Guardamos qué suscripción se estaba pagando para terminar la activación al volver.
export const PENDING_SUBSCRIPTION_KEY = 'wayvo_pending_subscription';

type Step = 'overview' | 'paying' | 'activating' | 'success';

const BENEFITS = [
  { icon: 'all_inclusive', text: 'Planes de viaje con IA ilimitados' },
  { icon: 'diamond', text: 'Acceso a todos los presupuestos, incluido Lujo' },
  { icon: 'calculate', text: 'Planificar y calcular tu presupuesto sigue siendo gratis para todos' },
];

export const SubscriptionView: React.FC = () => {
  const { setCurrentView, setPlanResult } = useApp();
  const { isPremium, entitlements, refreshUser } = useAuth();

  const [plan, setPlan] = useState<PremiumPlanInfo | null>(null);
  const [mine, setMine] = useState<MySubscriptionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('overview');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  // Pago en curso
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [elementReady, setElementReady] = useState(false);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const [planInfo, subscription] = await Promise.all([PaymentsApi.getPlan(), PaymentsApi.getMySubscription()]);
      setPlan(planInfo);
      setMine(subscription);
    } catch (err: any) {
      setError(err?.message || 'No pudimos cargar la información del plan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Termina la Saga de activación: confirma el pago y pasa la cuenta a PREMIUM.
  // Si el cobro salió bien pero la cuenta falló, el servidor devuelve el dinero (compensación).
  const activate = useCallback(
    async (id: string) => {
      setStep('activating');
      setError(null);
      try {
        await PaymentsApi.activateSubscription(id);
        sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
        await Promise.all([refreshUser(), load()]);
        setStep('success');
      } catch (err: any) {
        const code = err instanceof ApiError ? err.code : undefined;
        if (code === ActivationFailureCode.PAYMENT_NOT_COMPLETED) {
          setError('Todavía no vemos el pago completado. Revisa los datos de tu tarjeta e inténtalo de nuevo.');
          setStep(clientSecret ? 'paying' : 'overview');
        } else if (code === ActivationFailureCode.SAGA_COMPENSATED) {
          sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
          setError('No pudimos activar tu cuenta PREMIUM, así que cancelamos el cobro y devolvimos tu dinero. Puedes intentarlo de nuevo.');
          setStep('overview');
        } else if (code === ActivationFailureCode.COMPENSATION_FAILED) {
          setError(`Hubo un problema al activar tu cuenta y no pudimos devolver el cobro automáticamente. Escríbenos con esta referencia: ${id}`);
          setStep('overview');
        } else {
          setError(err?.message || 'No fue posible activar tu suscripción.');
          setStep('overview');
        }
      }
    },
    [clientSecret, load, refreshUser],
  );

  // Regreso desde la verificación del banco (3D Secure): se termina la activación automáticamente.
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_SUBSCRIPTION_KEY);
    if (pending) activate(pending);
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monta el Payment Element de Stripe cuando hay un pago en curso.
  useEffect(() => {
    if (step !== 'paying' || !clientSecret) return;
    let cancelled = false;
    let element: StripePaymentElement | null = null;

    (async () => {
      const stripe = await getStripe();
      if (!stripe || cancelled || !mountRef.current) return;
      stripeRef.current = stripe;
      const elements = stripe.elements({ clientSecret, appearance: { theme: 'stripe' } });
      elementsRef.current = elements;
      element = elements.create('payment');
      element.on('ready', () => !cancelled && setElementReady(true));
      element.mount(mountRef.current);
    })();

    return () => {
      cancelled = true;
      element?.destroy();
      elementsRef.current = null;
      setElementReady(false);
    };
  }, [step, clientSecret]);

  const startSubscription = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await PaymentsApi.createSubscription();
      setSubscriptionId(created.subscription.id);
      setClientSecret(created.clientSecret);

      if (created.clientSecret && !STRIPE_PUBLISHABLE_KEY) {
        setError('Falta configurar VITE_STRIPE_PUBLISHABLE_KEY en el cliente para mostrar el formulario de pago.');
        return;
      }
      setStep('paying');
    } catch (err: any) {
      setError(err?.message || 'No fue posible iniciar la suscripción.');
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    if (!subscriptionId) return;
    setError(null);

    // Simulador (PAYMENTS_MODE=mock): no hay formulario real, el servidor simula el cobro.
    if (!clientSecret) {
      setBusy(true);
      await activate(subscriptionId);
      setBusy(false);
      return;
    }

    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) return;

    setBusy(true);
    sessionStorage.setItem(PENDING_SUBSCRIPTION_KEY, subscriptionId);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin },
      // Solo redirige si el banco lo exige; en el resto de casos seguimos aquí.
      redirect: 'if_required',
    });

    if (stripeError) {
      sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
      setError(stripeError.message || 'El pago no se pudo completar.');
      setBusy(false);
      return;
    }
    await activate(subscriptionId);
    setBusy(false);
  };

  const cancel = async () => {
    if (!mine?.subscription) return;
    setBusy(true);
    setError(null);
    try {
      await PaymentsApi.cancelSubscription(mine.subscription.id);
      setConfirmingCancel(false);
      await Promise.all([refreshUser(), load()]);
    } catch (err: any) {
      setError(err?.message || 'No fue posible cancelar la suscripción.');
    } finally {
      setBusy(false);
    }
  };

  const price = plan ? formatUsd(plan.amountCents, plan.currency) : '$4.95';
  const used = entitlements?.aiPlans.used ?? 0;
  const limit = entitlements?.aiPlans.limit ?? 5;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-sm text-on-surface-variant py-24">
        <span className="material-symbols-outlined animate-spin text-secondary">progress_activity</span>
        <span>Cargando tu plan...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">Tu plan en Wayvo</h1>
        <p className="text-sm text-on-surface-variant">
          Una sola suscripción mensual desbloquea todo. Reservar no requiere ningún pago dentro de Wayvo.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-error-container text-on-error-container text-xs leading-relaxed flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {step === 'success' && (
        <div className="stitch-card p-8 rounded-2xl bg-surface-container-lowest flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">workspace_premium</span>
          </div>
          <h2 className="text-xl font-bold text-primary">¡Ya eres PREMIUM!</h2>
          <p className="text-sm text-on-surface-variant max-w-md">
            Tus planes de IA ahora son ilimitados y tienes acceso a todos los presupuestos.
          </p>
          <button
            type="button"
            onClick={() => {
              setPlanResult(null);
              setCurrentView('ONBOARDING');
            }}
            className="px-6 py-2.5 rounded-full bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold transition-colors"
          >
            Planificar un viaje
          </button>
        </div>
      )}

      {step === 'activating' && (
        <div className="stitch-card p-8 rounded-2xl bg-surface-container-lowest flex items-center justify-center gap-3 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-secondary">progress_activity</span>
          <span>Confirmando tu pago y activando tu cuenta...</span>
        </div>
      )}

      {step !== 'success' && step !== 'activating' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FREE */}
          <div className={`stitch-card p-6 rounded-2xl bg-surface-container-lowest flex flex-col gap-4 ${!isPremium ? 'border-2 border-secondary' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">Gratis</h2>
              {!isPremium && <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">TU PLAN</span>}
            </div>
            <p className="text-2xl font-extrabold text-primary">$0</p>
            <ul className="flex flex-col gap-2 text-xs text-on-surface">
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-secondary">check</span>5 planes de IA por mes</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-secondary">check</span>Presupuestos Económico, Estándar y Personalizado</li>
              <li className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined text-[16px]">lock</span>Sin presupuesto Lujo</li>
            </ul>
            {!isPremium && entitlements && (
              <div className="mt-auto pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant">
                Llevas <strong className="text-primary">{used} de {limit}</strong> planes este mes.
              </div>
            )}
          </div>

          {/* PREMIUM */}
          <div className={`stitch-card p-6 rounded-2xl bg-surface-container-lowest flex flex-col gap-4 ${isPremium ? 'border-2 border-amber-400' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-amber-600">workspace_premium</span>
                PREMIUM
              </h2>
              {isPremium && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">TU PLAN</span>}
            </div>
            <p className="text-2xl font-extrabold text-primary">
              {price}
              <span className="text-sm font-medium text-on-surface-variant"> / mes</span>
            </p>
            <ul className="flex flex-col gap-2 text-xs text-on-surface">
              {BENEFITS.map((b) => (
                <li key={b.text} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">{b.icon}</span>
                  {b.text}
                </li>
              ))}
            </ul>

            {/* Cuenta PREMIUM: estado y cancelación */}
            {isPremium && mine?.subscription && (
              <div className="mt-auto pt-3 border-t border-outline-variant/20 flex flex-col gap-3 text-xs text-on-surface-variant">
                <p>
                  Tu suscripción está activa y vigente hasta el <strong className="text-primary">{formatDate(mine.subscription.currentPeriodEnd)}</strong>.
                </p>
                {!confirmingCancel ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(true)}
                    className="self-start px-4 py-2 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors"
                  >
                    Cancelar suscripción
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-error-container/40 flex flex-col gap-2">
                    <p className="text-on-surface">
                      Volverás al plan gratuito de inmediato: 5 planes de IA por mes y sin presupuesto Lujo.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={cancel}
                        className="px-4 py-2 rounded-full bg-error text-on-error text-xs font-semibold disabled:opacity-50"
                      >
                        {busy ? 'Cancelando...' : 'Sí, cancelar'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmingCancel(false)}
                        className="px-4 py-2 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold"
                      >
                        Mantener PREMIUM
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cuenta FREE: iniciar suscripción */}
            {!isPremium && step === 'overview' && (
              <button
                type="button"
                disabled={busy}
                onClick={startSubscription}
                className="mt-auto py-3 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                )}
                Suscribirme por {price}/mes
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pago */}
      {!isPremium && step === 'paying' && subscriptionId && (
        <div className="stitch-card p-6 md:p-8 rounded-2xl bg-surface-container-lowest flex flex-col gap-5 animate-fade-in">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">credit_card</span>
            Pago de tu suscripción
          </h2>

          {clientSecret ? (
            <>
              {/* Stripe Payment Element: los datos de la tarjeta los recibe Stripe directamente, nunca pasan por Wayvo. */}
              <div ref={mountRef} className="min-h-[120px]" />
              {!elementReady && (
                <p className="text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  Cargando el formulario seguro de Stripe...
                </p>
              )}
            </>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">science</span>
              <span>
                <strong>Modo de pruebas:</strong> el servidor está usando el simulador de pagos, así que no se cobra nada ni se piden datos de tarjeta.
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep('overview');
                setError(null);
              }}
              className="px-5 py-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={busy || (!!clientSecret && !elementReady)}
              onClick={pay}
              className="flex-1 sm:flex-none py-3 px-8 rounded-full bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>}
              {clientSecret ? `Pagar ${price}` : `Confirmar pago simulado de ${price}`}
            </button>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Se renueva cada mes y puedes cancelar cuando quieras desde esta pantalla.
          </p>
        </div>
      )}
    </div>
  );
};
