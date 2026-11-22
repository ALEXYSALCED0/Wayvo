import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface ' +
  'placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all';

// Pantalla de inicio de sesión y registro (multiusuario).
export const AuthView: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) await register({ name, email, password });
      else await login({ email, password });
    } catch (err: any) {
      setError(err?.message || 'No fue posible conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface flex items-center justify-center px-4 py-10 font-sans text-on-surface antialiased">
      <div className="w-full max-w-md flex flex-col gap-8 animate-fade-in">
        {/* Marca */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-on-primary shadow-md">
            <span className="material-symbols-outlined text-[30px]">near_me</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-2xl text-primary tracking-tight">WAYVO</span>
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
          </div>
          <p className="text-sm text-on-surface-variant">
            {isRegister ? 'Crea tu cuenta para planificar tus viajes.' : 'Inicia sesión para ver tus viajes.'}
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-[0_8px_30px_rgba(55,79,113,0.06)] flex flex-col gap-6">
          {/* Pestañas */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container rounded-full border border-outline-variant/30">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`py-2 text-xs font-semibold rounded-full transition-all ${
                  mode === m
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-primary">Nombre</span>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-primary">Correo electrónico</span>
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-primary">Contraseña</span>
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
            </label>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-error-container text-on-error-container text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3.5 rounded-xl bg-secondary hover:bg-primary disabled:opacity-60 disabled:cursor-wait text-on-primary font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {submitting && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              <span>{isRegister ? 'Crear cuenta' : 'Entrar'}</span>
            </button>
          </form>

          <p className="text-center text-xs text-on-surface-variant">
            {isRegister ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
              className="font-semibold text-secondary hover:text-primary"
            >
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
