import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';
import {
  getKayakFlightUrl,
  OFFICIAL_AIRLINE_PORTALS,
  getBookingHotelUrl,
  getHotelesUrl,
  getCivitatisTourUrl,
  getGetYourGuideTourUrl,
  getGoogleMapsPlaceUrl,
  getTripadvisorSearchUrl,
} from '../utils/travelLinks';

export interface ChatCardAction {
  label: string;
  url: string;
  icon?: string;
  isPrimary?: boolean;
}

export interface ChatCard {
  id: string;
  type: 'restaurant' | 'flight' | 'hotel' | 'activity' | 'contingency';
  title: string;
  subtitle?: string;
  description: string;
  badge?: string;
  priceEstimate?: string;
  location?: string;
  action?: ChatCardAction;
  actions?: ChatCardAction[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  cards?: ChatCard[];
  isError?: boolean;
}

export const AIChatDrawer: React.FC = () => {
  const { isChatOpen, setIsChatOpen, activeTrip, planResult } = useApp();
  const currentDest = activeTrip?.destination || planResult?.tripDraft?.destination || 'tu destino';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      text: `¡Hola! Soy tu asistente de viaje inteligente de Wayvo respaldado por Google Gemini. Puedo resolver preguntas de clima, sugerir restaurantes, comparar vuelos o encontrar hoteles para ${currentDest}.`,
      time: 'Ahora',
      cards: [
        {
          id: 'card-welcome-1',
          type: 'activity',
          title: `Guía en Vivo: ${currentDest}`,
          subtitle: 'Enlaces directos de reserva y redes oficiales',
          badge: 'Verificado',
          location: currentDest,
          description: `Explora reservas de hospedaje, vuelos y las mejores alternativas culinarias con enlaces oficiales.`,
          actions: [
            {
              label: 'Ver Hoteles en Booking.com',
              url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(currentDest)}`,
              icon: 'hotel',
              isPrimary: true,
            },
            {
              label: 'Ver en Hoteles.com',
              url: `https://es.hoteles.com/Hotel-Search?destination=${encodeURIComponent(currentDest)}`,
              icon: 'travel_explore',
            },
            {
              label: 'Ver en Google Maps',
              url: `https://www.google.com/maps/search/?api=1&query=atracciones+turisticas+en+${encodeURIComponent(currentDest)}`,
              icon: 'location_on',
            },
          ],
        },
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  if (!isChatOpen) return null;

  const quickChips = [
    `¿Qué tal es el clima en ${currentDest}?`,
    `¿Qué restaurantes recomiendas en ${currentDest}?`,
    `¿Qué opciones de hoteles hay en ${currentDest}?`,
    `¿Qué actividades imperdibles tiene ${currentDest}?`,
  ];

  /**
   * Generador dinámico de tarjetas contextuales basadas en la respuesta real de Gemini
   * y en el destino actual del usuario. No contiene mockups estáticos.
   */
  const buildContextualCards = (
    query: string,
    replyText: string,
    dest: string
  ): ChatCard[] => {
    const q = (query + ' ' + replyText).toLowerCase();
    const destTag = dest.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cards: ChatCard[] = [];

    const startDate = activeTrip?.startDate || planResult?.tripDraft?.startDate;
    const endDate = activeTrip?.endDate || planResult?.tripDraft?.endDate;
    const origin = planResult?.tripDraft?.origin || 'Bogotá';

    // 1. Hoteles / Alojamiento
    if (
      q.includes('hotel') ||
      q.includes('hospedaje') ||
      q.includes('alojamiento') ||
      q.includes('dormir') ||
      q.includes('resort')
    ) {
      cards.push({
        id: `card-hotel-${Date.now()}`,
        type: 'hotel',
        title: `Hospedaje en ${dest}`,
        subtitle: 'Reservas directas con tarifas oficiales',
        badge: 'Reserva Directa',
        location: dest,
        description: `Compara tarifas y disponibilidad en tiempo real para las fechas de tu viaje.`,
        actions: [
          {
            label: 'Reservar en Booking.com',
            url: getBookingHotelUrl(`Hotel en ${dest}`, dest, startDate, endDate, 2),
            icon: 'hotel',
            isPrimary: true,
          },
          {
            label: 'Ver en Hoteles.com',
            url: getHotelesUrl(`Hotel en ${dest}`, dest, startDate, endDate, 2),
            icon: 'travel_explore',
          },
          {
            label: 'Ficha en Google Maps',
            url: getGoogleMapsPlaceUrl(`Hoteles en ${dest}`, dest),
            icon: 'location_on',
          },
        ],
      });
    }

    // 2. Gastronomía / Restaurantes / Comida
    if (
      q.includes('restaurante') ||
      q.includes('comida') ||
      q.includes('gastronom') ||
      q.includes('cenar') ||
      q.includes('almorzar') ||
      q.includes('plato') ||
      q.includes('café') ||
      q.includes('bar')
    ) {
      cards.push({
        id: `card-food-${Date.now()}`,
        type: 'restaurant',
        title: `Gastronomía y Restaurantes en ${dest}`,
        subtitle: 'Menús, reservas y reseñas verificadas',
        badge: 'Recomendado',
        location: dest,
        description: `Consulta cartas de platos, fotos y disponibilidad sin muros de login.`,
        actions: [
          {
            label: 'Ver Menú y Ficha en Google Maps',
            url: getGoogleMapsPlaceUrl(`mejores restaurantes en ${dest}`, dest),
            icon: 'restaurant',
            isPrimary: true,
          },
          {
            label: 'Guía y Ranking en TripAdvisor',
            url: getTripadvisorSearchUrl(`restaurantes en ${dest}`, dest),
            icon: 'reviews',
          },
        ],
      });
    }

    // 3. Vuelos / Aerolíneas (Directo en aerolíneas oficiales)
    if (
      q.includes('vuelo') ||
      q.includes('avion') ||
      q.includes('aerolínea') ||
      q.includes('volar') ||
      q.includes('aeropuerto') ||
      q.includes('escala')
    ) {
      cards.push({
        id: `card-flight-${Date.now()}`,
        type: 'flight',
        title: `Vuelos hacia ${dest}`,
        subtitle: `${origin} ➔ ${dest} (Ruta y fechas)`,
        badge: 'Web Oficial',
        location: dest,
        description: `Vuelos con ruta, fechas y pasajeros ya configurados para comparar y reservar directamente.`,
        actions: [
          {
            label: 'Ver Vuelos Avianca (Fechas Cargadas)',
            url: getKayakFlightUrl({
              origin,
              destination: dest,
              startDate: startDate || '',
              endDate: endDate || '',
              travelers: 2,
              airline: 'AVIANCA',
            }),
            icon: 'flight_takeoff',
            isPrimary: true,
          },
          {
            label: 'Ver Vuelos LATAM (Fechas Cargadas)',
            url: getKayakFlightUrl({
              origin,
              destination: dest,
              startDate: startDate || '',
              endDate: endDate || '',
              travelers: 2,
              airline: 'LATAM',
            }),
            icon: 'flight',
          },
          {
            label: OFFICIAL_AIRLINE_PORTALS.AVIANCA.label,
            url: OFFICIAL_AIRLINE_PORTALS.AVIANCA.url,
            icon: 'open_in_new',
          },
          {
            label: OFFICIAL_AIRLINE_PORTALS.LATAM.label,
            url: OFFICIAL_AIRLINE_PORTALS.LATAM.url,
            icon: 'open_in_new',
          },
        ],
      });
    }

    // 4. Actividades, Lugares y Tours Dinámicos
    if (
      q.includes('actividad') ||
      q.includes('lugar') ||
      q.includes('tour') ||
      q.includes('hacer') ||
      q.includes('visitar') ||
      q.includes('museo') ||
      q.includes('playa') ||
      q.includes('parque')
    ) {
      cards.push({
        id: `card-activity-${Date.now()}`,
        type: 'activity',
        title: `Lugares & Actividades en ${dest}`,
        subtitle: 'Atracciones oficiales y tours guiados',
        badge: 'Imperdible',
        location: dest,
        description: `Explora atracciones con enlace directo a operadores oficiales y catálogo de tours.`,
        actions: [
          {
            label: 'Tours en Civitatis (Guías en Español)',
            url: getCivitatisTourUrl(`tours en ${dest}`, dest),
            icon: 'local_activity',
            isPrimary: true,
          },
          {
            label: 'Opciones en GetYourGuide',
            url: getGetYourGuideTourUrl(`actividades en ${dest}`, dest),
            icon: 'confirmation_number',
          },
          {
            label: 'Opiniones en TripAdvisor',
            url: getTripadvisorSearchUrl(`atracciones en ${dest}`, dest),
            icon: 'reviews',
          },
          {
            label: 'Atracciones en Google Maps',
            url: getGoogleMapsPlaceUrl(`atracciones turisticas en ${dest}`, dest),
            icon: 'location_on',
          },
        ],
      });
    }

    // 5. Clima / Tiempo
    if (
      q.includes('clima') ||
      q.includes('tiempo') ||
      q.includes('lluvia') ||
      q.includes('temperatura') ||
      q.includes('ropa') ||
      q.includes('calor') ||
      q.includes('frío')
    ) {
      cards.push({
        id: `card-weather-${Date.now()}`,
        type: 'contingency',
        title: `Monitoreo del Clima: ${dest}`,
        subtitle: 'Pronóstico meteorológico en tiempo real',
        badge: 'Meteorología',
        location: dest,
        description: `Consulta el pronóstico satelital y alertas de precipitación para coordinar tus actividades.`,
        actions: [
          {
            label: 'Pronóstico en AccuWeather',
            url: `https://www.accuweather.com/es/search-locations?query=${encodeURIComponent(dest)}`,
            icon: 'wb_sunny',
            isPrimary: true,
          },
          {
            label: 'Ver en Weather.com',
            url: `https://weather.com/es-ES/tiempo/hoy/l/${encodeURIComponent(dest)}`,
            icon: 'open_in_new',
          },
        ],
      });
    }

    return cards;
  };

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
          currentDestination: currentDest,
        },
      });

      const replyText =
        (response as any)?.reply ||
        (response as any)?.data?.reply ||
        response.message?.text;

      if (!replyText) {
        throw new Error('La respuesta del servicio de IA llegó vacía.');
      }

      const replyCards = buildContextualCards(text, replyText, currentDest);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cards: replyCards,
        },
      ]);
    } catch (err: any) {
      // Sin mockups: Notificar el fallo real del servidor
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'assistant',
          text: `⚠️ Error con el servidor: No fue posible comunicarse con el servicio de IA (${err?.message || 'Servicio no disponible'}). Por favor verifica que el microservicio esté activo e inténtalo de nuevo.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-surface-container-lowest shadow-2xl flex flex-col border-l border-outline-variant/30 animate-fade-in">
      {/* Header */}
      <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">Asistente de Viaje IA</span>
            <span className="text-[10px] font-mono text-secondary-fixed">Google Gemini 3.5 Flash</span>
          </div>
        </div>
        <button
          onClick={() => setIsChatOpen(false)}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-on-primary flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface/30">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-secondary text-on-secondary rounded-br-none shadow-xs'
                    : msg.isError
                    ? 'bg-error-container text-on-error-container border border-error/30 rounded-bl-none shadow-xs'
                    : 'bg-surface-container-low text-on-surface rounded-bl-none border border-outline-variant/30 shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Interactive Dynamic Cards */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2.5 w-full">
                    {msg.cards.map((card) => {
                      const allActions = card.actions || (card.action ? [card.action] : []);
                      return (
                        <div
                          key={card.id}
                          className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-2 text-xs hover:border-secondary transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-secondary text-[16px]">
                                {card.type === 'restaurant'
                                  ? 'restaurant'
                                  : card.type === 'flight'
                                  ? 'flight'
                                  : card.type === 'hotel'
                                  ? 'hotel'
                                  : card.type === 'contingency'
                                  ? 'wb_sunny'
                                  : 'local_activity'}
                              </span>
                              <span className="font-bold text-primary">{card.title}</span>
                            </div>
                            {card.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-secondary-fixed text-on-secondary-fixed whitespace-nowrap">
                                {card.badge}
                              </span>
                            )}
                          </div>

                          {card.subtitle && (
                            <span className="text-[11px] text-secondary font-medium">{card.subtitle}</span>
                          )}

                          <p className="text-[11px] text-on-surface-variant leading-normal">
                            {card.description}
                          </p>

                          {(card.location || card.priceEstimate) && (
                            <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-outline-variant/10">
                              {card.location && <span>📍 {card.location}</span>}
                              {card.priceEstimate && (
                                <span className="font-semibold text-primary font-mono">{card.priceEstimate}</span>
                              )}
                            </div>
                          )}

                          {/* Direct Action Links */}
                          {allActions.length > 0 && (
                            <div className="flex flex-col gap-1.5 pt-1 border-t border-outline-variant/15">
                              {allActions.map((action, aIdx) => (
                                <a
                                  key={aIdx}
                                  href={action.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shadow-xs ${
                                    action.isPrimary
                                      ? 'bg-primary text-on-primary hover:bg-secondary'
                                      : 'bg-surface-container hover:bg-secondary-fixed text-primary border border-outline-variant/30'
                                  }`}
                                >
                                  {action.icon && (
                                    <span className="material-symbols-outlined text-[13px]">{action.icon}</span>
                                  )}
                                  <span>{action.label}</span>
                                  <span className="material-symbols-outlined text-[11px] ml-auto">open_in_new</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1 px-1">{msg.time}</span>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-2xl rounded-bl-none self-start text-xs text-on-surface-variant border border-outline-variant/20">
            <span className="material-symbols-outlined animate-spin text-[16px] text-secondary">sync</span>
            <span>Gemini 3.5 Flash está analizando tu consulta...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chips */}
      <div className="px-4 py-2 border-t border-outline-variant/20 flex gap-2 overflow-x-auto bg-surface-container-low/40">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="px-3 py-1 rounded-full bg-surface-container text-primary hover:bg-secondary-fixed text-[11px] font-medium whitespace-nowrap transition-colors flex-shrink-0 border border-outline-variant/20"
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
          placeholder={`Pregunta sobre clima, restaurantes, hoteles en ${currentDest}...`}
          className="flex-1 h-10 px-3 bg-surface-container-low text-on-surface text-xs rounded-xl border border-outline-variant/40 focus:outline-none focus:border-secondary"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="w-10 h-10 rounded-xl bg-primary hover:bg-secondary text-on-primary flex items-center justify-center transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </form>
    </div>
  );
};
