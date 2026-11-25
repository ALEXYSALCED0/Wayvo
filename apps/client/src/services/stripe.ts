import { loadStripe, Stripe } from '@stripe/stripe-js';

// La clave PUBLICABLE (pk_test_...) es pública por diseño: solo sirve para mostrar el formulario
// de Stripe. Cobrar y cancelar se hace en el servidor con la clave secreta, que nunca llega aquí.
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() || '';

let stripePromise: Promise<Stripe | null> | null = null;

// Stripe.js se carga solo cuando hace falta (al abrir la pantalla de suscripción), no en cada página.
export function getStripe(): Promise<Stripe | null> {
  if (!STRIPE_PUBLISHABLE_KEY) return Promise.resolve(null);
  stripePromise ??= loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}
