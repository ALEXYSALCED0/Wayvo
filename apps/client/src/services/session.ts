// Guarda el token de sesión (JWT) en el navegador y avisa cuando deja de ser válido.
// El token lo emite auth-service; el cliente solo lo guarda y lo envía en cada petición.

const TOKEN_KEY = 'wayvo_token';

type UnauthorizedListener = () => void;
const unauthorizedListeners: UnauthorizedListener[] = [];

export const session = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    // Datos de navegación ligados a la sesión anterior: no deben pasar al siguiente usuario.
    localStorage.removeItem('wayvo_active_trip_id');
  },

  // El AuthContext se suscribe para cerrar la sesión si el gateway responde 401.
  onUnauthorized(listener: UnauthorizedListener): () => void {
    unauthorizedListeners.push(listener);
    return () => {
      const idx = unauthorizedListeners.indexOf(listener);
      if (idx !== -1) unauthorizedListeners.splice(idx, 1);
    };
  },

  notifyUnauthorized(): void {
    unauthorizedListeners.forEach((l) => l());
  },
};
