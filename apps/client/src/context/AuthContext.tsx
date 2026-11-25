import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import type { AccountEntitlements, AuthSession, AuthUserDTO, LoginRequest, RegisterRequest } from '@wayvo/contracts';
import { AccountPlan, UserRole } from '@wayvo/contracts';
import { AuthApi } from '../services/api';
import { session } from '../services/session';

// checking: al abrir la app se está validando el token guardado.
type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

interface AuthContextType {
  status: AuthStatus;
  user: AuthUserDTO | null;
  isAdmin: boolean;
  // Plan de la cuenta y cuánto lleva usado este mes (viene de /auth/me).
  isPremium: boolean;
  entitlements: AccountEntitlements | null;
  // Vuelve a pedir /auth/me: se llama después de generar un plan o de cambiar de plan.
  refreshUser: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => (session.getToken() ? 'checking' : 'anonymous'));
  const [user, setUser] = useState<AuthUserDTO | null>(null);

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const startSession = (auth: AuthSession) => {
    session.setToken(auth.token);
    setUser(auth.user);
    setStatus('authenticated');
  };

  // Al abrir la app: si hay un token guardado, se valida con /auth/me.
  useEffect(() => {
    if (!session.getToken()) return;
    AuthApi.me()
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => logout());
  }, [logout]);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await AuthApi.me());
    } catch {
      // Si falla (red, 401) no se toca la sesión actual: el 401 ya cierra la sesión por su lado.
    }
  }, []);

  // Si en cualquier momento el gateway responde 401 (token expirado), se cierra la sesión.
  useEffect(() => session.onUnauthorized(logout), [logout]);

  const value: AuthContextType = {
    status,
    user,
    isAdmin: user?.role === UserRole.ADMIN,
    isPremium: user?.plan === AccountPlan.PREMIUM,
    entitlements: user?.entitlements ?? null,
    refreshUser,
    login: async (payload) => startSession(await AuthApi.login(payload)),
    register: async (payload) => startSession(await AuthApi.register(payload)),
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
