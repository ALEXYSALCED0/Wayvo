import React, { useState } from 'react';
import { X, AlertTriangle, Sparkles, CheckCircle2, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { IssueType, AlternativeOption, TripMediatorIncidentResult, Trip } from '@wayvo/contracts';
import { WayvoApi } from '../services/api';
import { useApp } from '../context/AppContext';

interface IncidentModalProps {
  tripId: string;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onResolved: (updatedTrip: Trip) => void;
}

export function IncidentModal({ tripId, eventId, eventTitle, onClose, onResolved }: IncidentModalProps) {
  const { appMode } = useApp();

  const [step, setStep] = useState<'REPORT' | 'SELECT'>('REPORT');
  const [issueType, setIssueType] = useState<IssueType>(IssueType.MISSED);
  const [reason, setReason] = useState('Tráfico intenso hacia el punto de salida, perdí el horario programado.');
  const [isLoading, setIsLoading] = useState(false);
  const [incidentResult, setIncidentResult] = useState<TripMediatorIncidentResult | null>(null);

  const handleReportIncident = async () => {
    setIsLoading(true);
    try {
      const result = await WayvoApi.reportIncident(tripId, {
        eventId,
        type: issueType,
        reason,
      });
      setIncidentResult(result);
      setStep('SELECT');
    } catch (err: any) {
      alert(`Error al reportar la incidencia: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAlternative = async (alternativeId: string) => {
    setIsLoading(true);
    try {
      const result = await WayvoApi.selectAlternative(tripId, {
        eventId,
        alternativeId,
      });
      if (result && result.updatedTrip) {
        onResolved(result.updatedTrip);
      }
    } catch (err: any) {
      alert(`Error al seleccionar la alternativa: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        {/* Modal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertTriangle size={22} color="var(--color-warning)" />
          <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Resolución Dinámica de Imprevistos</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Coordinado desacopladamente mediante el patrón <strong>Mediator</strong> en <code>trip-service</code>.
        </p>

        {step === 'REPORT' ? (
          <div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '8px', marginBottom: '18px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Evento afectado:</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{eventTitle}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Tipo de Imprevisto
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '14px' }}
              >
                <option value={IssueType.MISSED}>Pérdida de transporte o conexión (MISSED)</option>
                <option value={IssueType.CANCELLED}>Cancelado por el proveedor o clima (CANCELLED)</option>
                <option value={IssueType.UNAVAILABLE}>Lugar temporalmente no disponible (UNAVAILABLE)</option>
                <option value={IssueType.USER_CHANGED_PLAN}>Quiero cambiar mis planes (USER_CHANGED_PLAN)</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Motivo / Descripción del Problema
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '13px', resize: 'vertical' }}
              />
            </div>

            <button
              onClick={handleReportIncident}
              disabled={isLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                color: '#fff',
                padding: '14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '15px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Mediator calculando alternativas...</span>
                </>
              ) : (
                <>
                  <span>Consultar Soluciones Inteligentes</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                Alternativas Propuestas por AlternativeService:
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Selecciona una alternativa para cancelar el evento afectado e inyectar automáticamente la nueva ruta en tu itinerario.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {incidentResult?.alternatives?.map((alt: AlternativeOption) => (
                <div
                  key={alt.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: alt.isRecommended ? '1px solid var(--color-primary)' : '1px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h5 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{alt.title}</h5>
                      {alt.isRecommended && (
                        <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(59, 130, 246, 0.2)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                          RECOMENDADA
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{alt.description}</p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Inyecta: {alt.newEventsToInject?.map((e) => e.title).join(', ') || 'Eventos recalculados'}
                    </span>

                    <button
                      onClick={() => handleSelectAlternative(alt.id)}
                      disabled={isLoading}
                      style={{
                        background: alt.isRecommended ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>Aplicar Solución</span>
                      <CheckCircle2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('REPORT')}
              style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', width: '100%' }}
            >
              Cambiar motivo del imprevisto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
