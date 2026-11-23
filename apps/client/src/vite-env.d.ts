/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // Clave PUBLICABLE de Stripe (pk_test_...). Es pública por diseño; la clave secreta nunca va en el cliente.
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}
