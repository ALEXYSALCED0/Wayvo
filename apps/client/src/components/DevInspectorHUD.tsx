import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const DevInspectorHUD: React.FC = () => {
  const {
    isDevInspectorOpen,
    setIsDevInspectorOpen,
    telemetryLogs,
    clearTelemetry,
    chaosMode,
    setChaosMode,
    compensationLog,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'CHAOS' | 'COMPENSATION'>('TELEMETRY');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  if (!isDevInspectorOpen) return null;

  const selectedLog = telemetryLogs.find((l) => l.id === selectedLogId) || telemetryLogs[0];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-surface-container-lowest shadow-2xl flex flex-col border-l border-outline-variant/30 animate-fade-in">
      {/* Header */}
      <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-secondary-fixed">terminal</span>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">Inspector de Red & Telemetría Dev</span>
            <span className="text-[10px] font-mono text-secondary-fixed">Gateway Facade Port :3000</span>
          </div>
        </div>
        <button
          onClick={() => setIsDevInspectorOpen(false)}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-on-primary flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 bg-surface-container border-b border-outline-variant/20 text-xs">
        <button
          onClick={() => setActiveTab('TELEMETRY')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'TELEMETRY'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Tráfico HTTP ({telemetryLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('CHAOS')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'CHAOS'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Inyección de Caos
        </button>
        <button
          onClick={() => setActiveTab('COMPENSATION')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'COMPENSATION'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Log Saga
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === 'TELEMETRY' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-medium">Peticiones capturadas en vivo:</span>
              <button
                onClick={clearTelemetry}
                className="text-xs text-secondary font-semibold hover:underline"
              >
                Limpiar consola
              </button>
            </div>

            {telemetryLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                No hay peticiones registradas aún. Interactúa con las pantallas para ver el tráfico HTTP y sus correlation IDs.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {telemetryLogs.slice(0, 15).map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  const isError = log.status && log.status >= 400;

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-secondary bg-surface-container ring-1 ring-secondary'
                          : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{log.method}</span>
                          <span className="font-mono text-on-surface-variant truncate max-w-[220px]">
                            {log.endpoint}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            isError
                              ? 'bg-error-container text-error'
                              : 'bg-surface-container-highest text-primary'
                          }`}
                        >
                          {log.status || 'ERR'} ({log.durationMs || 0}ms)
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-outline truncate">
                        x-correlation-id: {log.correlationId}
                      </div>
                    </div>
                  );
                })}

                {/* Selected Log Inspector */}
                {selectedLog && (
                  <div className="mt-4 p-4 rounded-xl bg-primary text-on-primary text-xs font-mono overflow-x-auto shadow-md">
                    <span className="text-secondary-fixed block font-bold mb-2">Detalles del Paquete HTTP:</span>
                    <div className="text-[11px] leading-relaxed">
                      <div>Method: {selectedLog.method}</div>
                      <div>Endpoint: {selectedLog.endpoint}</div>
                      <div>Status: {selectedLog.status}</div>
                      <div>Duration: {selectedLog.durationMs}ms</div>
                      <div className="text-secondary-fixed mt-2">Correlation-ID:</div>
                      <div className="text-white/80">{selectedLog.correlationId}</div>
                      {Boolean(selectedLog.responsePayload) && (
                        <>
                          <div className="text-secondary-fixed mt-2">Response Envelope:</div>
                          <pre className="text-[10px] bg-black/30 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(selectedLog.responsePayload, null, 2)}
                          </pre>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'CHAOS' && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <span className="font-bold text-primary block mb-1">Inyector de Caos (Provider Service)</span>
              <p className="text-on-surface-variant leading-relaxed">
                Modifica el comportamiento en caliente del adaptador de proveedores para demostrar la resiliencia
                de la Saga transaccional y el rollback automático ante caídas de terceros.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { mode: 'normal', label: 'Normal (Sin Caos)', desc: '200 OK / Disponibilidad completa' },
                { mode: 'unavailable', label: 'No Disponible', desc: 'Dispara HTTP 409 COMPENSATED' },
                { mode: 'slow', label: 'Latencia Lenta', desc: 'Inyecta 5000ms de retraso simulado' },
                { mode: 'error', label: 'Error 500', desc: 'Simula caída interna de proveedor' },
              ].map((item) => (
                <button
                  key={item.mode}
                  onClick={() => setChaosMode(item.mode as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    chaosMode === item.mode
                      ? 'border-secondary bg-secondary-fixed/30 ring-1 ring-secondary shadow-sm'
                      : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <span className="font-bold text-primary block mb-1">{item.label}</span>
                  <span className="text-[11px] text-on-surface-variant">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'COMPENSATION' && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <span className="font-bold text-primary block mb-1">Auditoría del Registro de Compensación</span>
              <p className="text-on-surface-variant leading-relaxed">
                Muestra los pasos exactos ejecutados durante el rollback de la Saga para asegurar consistencia eventual.
              </p>
            </div>

            {compensationLog ? (
              <pre className="p-4 rounded-xl bg-primary text-on-primary text-[11px] font-mono overflow-x-auto shadow-md">
                {JSON.stringify(compensationLog, null, 2)}
              </pre>
            ) : (
              <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                Aún no se ha cargado ningún log de compensación. Ejecuta una reserva con fallo de proveedor para ver la reversión.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
