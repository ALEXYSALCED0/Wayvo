// Contador de planes de IA por usuario y mes. Se guarda aparte del usuario a propósito:
// así guardar el usuario (cambio de plan, etc.) nunca pisa un contador que se está moviendo.
export interface AiPlanUsageRepository {
  getUsed(userId: string, period: string): Promise<number>;
  // Suma 1 SOLO si todavía no se llegó al límite. Atómico: dos peticiones simultáneas
  // no pueden pasarse del límite. Devuelve false si ya no quedaban planes.
  tryConsume(userId: string, period: string, limit: number): Promise<boolean>;
  // Devuelve un plan (la generación falló). Nunca baja de cero.
  release(userId: string, period: string): Promise<void>;
}
