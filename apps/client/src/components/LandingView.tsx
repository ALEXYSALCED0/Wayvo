import React from 'react';
import { useApp } from '../context/AppContext';

export const LandingView: React.FC = () => {
  const { setCurrentView, appMode, userTrips } = useApp();

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-surface flex flex-col justify-between animate-fade-in font-sans">
      {/* Main Hero Container (Exactly matching reference design) */}
      <main className="max-w-7xl mx-auto w-full px-6 md:px-12 py-10 md:py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column (7 cols): Hero Typography and Action */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            {/* Top Tag Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low text-secondary border border-outline-variant/40 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>IA de Viajes y Personalización Adaptativa</span>
              <span className="text-outline-variant">|</span>
              <span className="text-on-surface-variant font-mono">v2.4 Desktop</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-[56px] font-black text-primary tracking-tight leading-[1.12]">
              Tu próximo viaje <br />
              <span className="text-secondary">empieza contigo.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-xl">
              Cuéntanos quién eres, cómo te gusta viajar y qué te inspira. Wayvo utilizará esta información para diseñar experiencias de viaje calculadas a tu medida.
            </p>

            {/* Three Value Badges (Horizontally as in reference) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl pt-2">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">explore</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary">Perfil Único</span>
                  <span className="text-[11px] text-on-surface-variant">Tus gustos reales</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">map</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary">Itinerario Vivo</span>
                  <span className="text-[11px] text-on-surface-variant">Reactivo a cambios</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary">Motor Wayvo AI</span>
                  <span className="text-[11px] text-on-surface-variant">Decisiones en vivo</span>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col items-start gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setCurrentView('ONBOARDING')}
                  className="px-8 py-4 rounded-xl bg-secondary hover:bg-primary text-on-primary font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-3 group"
                >
                  <span>Planificar Nuevo Viaje</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>

                {userTrips.length > 0 && (
                  <button
                    onClick={() => setCurrentView('MY_TRIPS')}
                    className="px-6 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-sm border border-outline-variant/30 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px] text-secondary">luggage</span>
                    <span>Mis Viajes ({userTrips.length})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                <span>Organizador autónomo con IA reactiva a cambios e imprevistos.</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Interactive Itinerary Matrix Graphic (from reference) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,51,82,0.06)] border border-outline-variant/40 flex flex-col gap-6 relative overflow-hidden">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <span className="font-mono text-xs font-bold text-primary tracking-wider uppercase">
                    ITINERARY MATRIX
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-mono text-[11px] font-semibold">
                  LIVE MODEL
                </span>
              </div>

              {/* Graphic Matrix: SVG Flight and Adaptive Neural Mesh */}
              <div className="relative py-8 px-4 flex flex-col items-center justify-center min-h-[220px]">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="w-full h-full bg-[radial-gradient(#28628f_1px,transparent_1px)] [background-size:16px_16px]"></div>
                </div>

                {/* SVG Visual Network */}
                <svg className="w-full h-36" viewBox="0 0 320 140" fill="none">
                  {/* Outer Orbit Arcs */}
                  <path
                    d="M 40 100 Q 160 10 280 40"
                    stroke="#cae6ff"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 40 100 Q 160 130 280 40"
                    stroke="#cae6ff"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />

                  {/* Connecting Trajectory */}
                  <path
                    d="M 40 100 C 110 90, 110 50, 160 50 C 210 50, 220 40, 280 40"
                    stroke="#28628f"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                    className="animate-pulse"
                  />

                  {/* Node 1: Origen */}
                  <circle cx="40" cy="100" r="14" fill="#ffffff" stroke="#003352" strokeWidth="2.5" />
                  <circle cx="40" cy="100" r="5" fill="#003352" />
                  <text x="40" y="126" textAnchor="middle" fill="#003352" fontSize="9" fontWeight="700" fontFamily="monospace">
                    ORIGEN
                  </text>

                  {/* Node 2: AI Adaptativa (Center) */}
                  <rect x="120" y="36" width="80" height="28" rx="14" fill="#003352" />
                  <circle cx="134" cy="50" r="6" fill="#cae6ff" />
                  <text x="164" y="54" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700" letterSpacing="0.05em">
                    AI ADAPTATIVA
                  </text>

                  {/* Node 3: Destino Ideal */}
                  <circle cx="280" cy="40" r="16" fill="#cae6ff" stroke="#28628f" strokeWidth="2" />
                  <circle cx="280" cy="40" r="10" fill="#ffffff" />
                  <path
                    d="M 280 34 L 282 38 L 286 38.5 L 283 41.5 L 284 45.5 L 280 43 L 276 45.5 L 277 41.5 L 274 38.5 L 278 38 Z"
                    fill="#28628f"
                  />
                  <text x="280" y="68" textAnchor="middle" fill="#003352" fontSize="9" fontWeight="700" fontFamily="monospace">
                    DESTINO IDEAL
                  </text>

                  {/* Star dust pips */}
                  <circle cx="95" cy="40" r="2" fill="#28628f" opacity="0.6" />
                  <circle cx="230" cy="100" r="2.5" fill="#28628f" opacity="0.6" />
                  <circle cx="260" cy="90" r="1.5" fill="#cae6ff" />
                </svg>
              </div>

              {/* Bottom Accuracy Metric Pill (Matching reference) */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary">Precisión del Itinerario</span>
                    <span className="text-[11px] text-on-surface-variant">16 Parámetros de Personalidad</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-primary font-mono text-xs font-bold">
                  98.4% Match
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Telemetry Footer Bar (Matching reference) */}
      <footer className="w-full border-t border-outline-variant/30 bg-surface-container-lowest py-3.5 px-6 md:px-12 text-xs text-on-surface-variant flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-primary">WAYVO Intelligence Services • Operacional</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-on-surface-variant/80">
          <span>Desktop Version • 1280px / 1440px / 1920px</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Rubik Typography System</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Havelock Blue Scale</span>
        </div>

        <div className="font-mono text-[10px] text-on-surface-variant/60">
          {appMode === 'DEV' ? 'SYS.ROUTE_CALC // SEC_AUTH_ONBOARD [DEV]' : 'SYS.ROUTE_CALC // SEC_AUTH_ONBOARD'}
        </div>
      </footer>
    </div>
  );
};
