import React, { useState } from 'react';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import { ChatMessage, QuickChip } from '@wayvo/contracts';

export function AIChatDrawer() {
  const { isChatOpen, setIsChatOpen, planResult, appMode } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: '¡Hola! Soy tu asistente de viajes inteligente en Wayvo. ¿Tienes preguntas sobre tu destino, recomendaciones gastronómicas o consejos de presupuesto?',
      timestamp: new Date().toLocaleTimeString(),
      quickChips: [
        { id: 'q1', label: '¿Qué comida típica probar en mi destino?', actionPayload: '¿Qué comida típica puedo probar?' },
        { id: 'q2', label: '¿Planes económicos recomendados?', actionPayload: '¿Qué actividades económicas me recomiendas?' },
        { id: 'q3', label: 'Consejos de seguridad y transporte', actionPayload: 'Dame consejos de seguridad y transporte local' },
      ],
    },
  ]);

  if (!isChatOpen) return null;

  const currentDestination = planResult?.itinerary?.destination || 'Cartagena';

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await WayvoApi.sendChatMessage({
        userId: 'usr-client',
        message: text,
        conversationHistory: [...messages, userMsg],
        context: {
          currentDestination,
          budgetCategory: planResult?.budget?.category || 'Estándar',
          travelStyle: planResult?.personality?.analyzedStyle || 'Cultural',
        },
      });

      if (response && response.message) {
        setMessages((prev) => [...prev, response.message]);
      }
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Lo siento, no pude conectar con Gemini en este momento (${err.message}). Por favor verifica tu clave de API o intenta de nuevo.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '100%',
        maxWidth: '420px',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--border-light)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Asistente Wayvo AI</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Impulsado por Google Gemini</p>
          </div>
        </div>

        <button
          onClick={() => setIsChatOpen(false)}
          style={{ color: 'var(--text-muted)', display: 'flex' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                flexDirection: isAi ? 'row' : 'row-reverse',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-full)',
                  background: isAi ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {isAi ? <Sparkles size={14} color="var(--color-accent)" /> : <User size={14} color="var(--color-primary)" />}
              </div>

              <div style={{ maxWidth: '82%' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    background: isAi ? 'var(--bg-card)' : 'var(--color-primary)',
                    color: '#fff',
                    border: isAi ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  {msg.text}
                </div>

                {/* Quick Chips if present */}
                {msg.quickChips && msg.quickChips.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {msg.quickChips.map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => handleSendMessage(chip.actionPayload || chip.label)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid var(--border-accent)',
                          color: 'var(--color-primary)',
                          fontSize: '11px',
                          fontWeight: 500,
                          textAlign: 'left',
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Loader2 size={16} className="spin" />
            <span>Gemini está respondiendo...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputMessage);
        }}
        style={{
          padding: '14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Pregunta sobre ${currentDestination}...`}
          style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-full)',
            padding: '10px 16px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-full)',
            background: inputMessage.trim() ? 'var(--color-primary)' : 'var(--bg-card)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: inputMessage.trim() ? 1 : 0.4,
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
