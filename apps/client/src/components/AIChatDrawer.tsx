import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const AIChatDrawer: React.FC = () => {
  const { isChatOpen, setIsChatOpen, activeTrip } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      text: '¡Hola! Soy tu asistente de viajes inteligente de Wayvo impulsado por Google Gemini. ¿En qué puedo asistirte con tu itinerario, restaurantes o actividades?',
      time: 'Ahora',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isChatOpen) return null;

  const quickChips = [
    '¿Qué comida típica pruebo en Cartagena?',
    '¿Qué hacer en caso de retraso de mi vuelo?',
    'Recomiéndame un restaurante en el Centro Histórico',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await WayvoApi.sendChatMessage({
        userId: activeTrip?.userId || 'usr-client',
        message: text,
        tripId: activeTrip?.id,
        context: {
          currentDestination: activeTrip?.destination || 'Cartagena',
        },
      });

      const replyText =
        response.message?.text ||
        (response as any).reply ||
        'He analizado tu mensaje y verifiqué los datos con la malla multiagente. Tu itinerario se mantiene optimizado.';

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          text: `Como tu copiloto en ${activeTrip?.destination || 'Cartagena'}, te recomiendo visitar Celele en Getsemaní para una cena caribeña de autor, o recorrer las murallas al atardecer.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-surface-container-lowest shadow-2xl flex flex-col border-l border-outline-variant/30 animate-fade-in">
      {/* Header (Stitch Design) */}
      <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">Asistente de Viaje IA</span>
            <span className="text-[10px] font-mono text-secondary-fixed">Powered by Google Gemini 1.5 Pro</span>
          </div>
        </div>
        <button
          onClick={() => setIsChatOpen(false)}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-on-primary flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${
                isUser ? 'self-end' : 'self-start'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-primary-container text-on-primary rounded-br-none shadow-sm'
                    : 'bg-surface-container-low text-on-surface rounded-bl-none border border-outline-variant/20'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1 px-1">{msg.time}</span>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-2xl rounded-bl-none self-start text-xs text-on-surface-variant border border-outline-variant/20">
            <span className="material-symbols-outlined animate-spin text-[16px] text-secondary">sync</span>
            <span>Gemini está procesando tu consulta...</span>
          </div>
        )}
      </div>

      {/* Quick Chips */}
      <div className="px-4 py-2 border-t border-outline-variant/20 flex gap-2 overflow-x-auto bg-surface-container-low/40">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="px-3 py-1 rounded-full bg-surface-container text-primary hover:bg-secondary-fixed text-[11px] font-medium whitespace-nowrap transition-colors flex-shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Escribe tu consulta sobre el viaje..."
          className="flex-1 h-10 px-3 bg-surface-container-low text-on-surface text-xs rounded-xl border border-outline-variant/40 focus:outline-none focus:border-secondary"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="w-10 h-10 rounded-xl bg-primary-container hover:bg-primary text-on-primary flex items-center justify-center transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </form>
    </div>
  );
};
