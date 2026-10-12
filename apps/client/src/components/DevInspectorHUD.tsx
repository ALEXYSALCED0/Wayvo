import React, { useState } from 'react';
import { Terminal, X, Trash2, AlertTriangle, RefreshCw, ChevronDown, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function DevInspectorHUD() {
  const {
    isDevInspectorOpen,
    setIsDevInspectorOpen,
    telemetryLogs,
    clearTelemetry,
    chaosMode,
    setChaosMode,
  } = useApp();

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  if (!isDevInspectorOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '100%',
        maxWidth: '720px',
        maxHeight: '480px',
        background: 'rgba(10, 15, 29, 0.96)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-accent)',
        borderBottom: 'none',
        borderRadius: '16px 16px 0 0',
        zIndex: 100,
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HUD Header */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.03em', color: '#fff' }}>
            TELEMETRÍA EN VIVO Y CONTROLES DE CAOS (SAGA / MEDIATOR / ADAPTER)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={clearTelemetry}
            title="Limpiar logs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <Trash2 size={12} />
            <span>Limpiar</span>
          </button>
          <button
            onClick={() => setIsDevInspectorOpen(false)}
            style={{ color: 'var(--text-muted)', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chaos Controls Toolbar */}
      <div
        style={{
          padding: '8px 18px',
          background: 'rgba(30, 41, 59, 0.5)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={14} color="var(--color-warning)" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Simulador Provider-Service (Adapter / Fallos Saga):
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setChaosMode('normal')}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              background: chaosMode === 'normal' ? 'var(--color-success)' : 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
          >
            Normal (OK)
          </button>
          <button
            onClick={() => setChaosMode('unavailable')}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              background: chaosMode === 'unavailable' ? 'var(--color-danger)' : 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
            title="Fuerza a que los proveedores reporten sin cupo para probar el rollback de la Saga"
          >
            Forzar Sin Cupo (409 Rollback)
          </button>
          <button
            onClick={() => setChaosMode('slow')}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              background: chaosMode === 'slow' ? 'var(--color-warning)' : 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
          >
            Lento (Timeout)
          </button>
          <button
            onClick={() => setChaosMode('error')}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              background: chaosMode === 'error' ? 'var(--color-danger)' : 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
          >
            Error 502
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {telemetryLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '13px' }}>
            No hay llamadas registradas aún. Interactúa con la app para inspeccionar peticiones en vivo.
          </div>
        ) : (
          telemetryLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isSuccess = log.status && log.status >= 200 && log.status < 300;
            const isCompensated = log.status === 409;

            return (
              <div
                key={log.id}
                style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  borderRadius: '8px',
                  border: `1px solid ${
                    isSuccess
                      ? 'rgba(16, 185, 129, 0.3)'
                      : isCompensated
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: log.method === 'POST' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                        color: log.method === 'POST' ? 'var(--color-primary)' : 'var(--color-accent)',
                        fontWeight: 700,
                      }}
                    >
                      {log.method}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{log.endpoint}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {log.durationMs && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{log.durationMs}ms</span>
                    )}
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isSuccess
                          ? 'rgba(16, 185, 129, 0.2)'
                          : isCompensated
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                        color: isSuccess
                          ? 'var(--color-success)'
                          : isCompensated
                          ? 'var(--color-warning)'
                          : 'var(--color-danger)',
                        fontWeight: 700,
                      }}
                    >
                      {log.status || 'ERR'}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{log.timestamp}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  >
                    <div style={{ marginBottom: '6px', color: 'var(--color-primary)' }}>
                      <strong>Correlation ID:</strong> {log.correlationId}
                    </div>

                    {Boolean(log.requestPayload) && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Request Body:</div>
                        <pre
                          style={{
                            background: 'rgba(0, 0, 0, 0.5)',
                            padding: '6px',
                            borderRadius: '4px',
                            overflowX: 'auto',
                            maxHeight: '120px',
                            color: '#cbd5e1',
                          }}
                        >
                          {JSON.stringify(log.requestPayload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {Boolean(log.responsePayload) && (
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Response Body:</div>
                        <pre
                          style={{
                            background: 'rgba(0, 0, 0, 0.5)',
                            padding: '6px',
                            borderRadius: '4px',
                            overflowX: 'auto',
                            maxHeight: '160px',
                            color: isSuccess ? '#86efac' : isCompensated ? '#fde047' : '#fca5a5',
                          }}
                        >
                          {JSON.stringify(log.responsePayload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {log.error && (
                      <div style={{ color: 'var(--color-danger)', marginTop: '4px' }}>
                        <strong>Error:</strong> {log.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
