export type PaymentSimulationMode = 'normal' | 'declined' | 'error' | 'slow';

export const PAYMENT_SIMULATION_MODES: PaymentSimulationMode[] = ['normal', 'declined', 'error', 'slow'];

// Estado del simulador de pagos. Permite provocar fallos a propósito en una demo:
//   normal   -> el pago entra (la suscripción pasa a ACTIVE al confirmar)
//   declined -> la tarjeta es rechazada (la suscripción queda INCOMPLETE)
//   error    -> la pasarela está caída (502)
//   slow     -> la pasarela responde con demora (delayMs)
export class PaymentSimulationState {
  mode: PaymentSimulationMode = 'normal';
  delayMs = 3000;
  // true = la cuenta (auth-service) falla al activar el plan, DESPUÉS de haber cobrado.
  // Sirve para demostrar la compensación: cancelar la suscripción y devolver el pago.
  activationFails = false;

  set(mode: PaymentSimulationMode, delayMs?: number): void {
    this.mode = mode;
    if (delayMs !== undefined) this.delayMs = delayMs;
  }

  reset(): void {
    this.mode = 'normal';
    this.delayMs = 3000;
    this.activationFails = false;
  }
}
