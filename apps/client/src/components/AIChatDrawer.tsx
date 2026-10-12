import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { WayvoApi } from '../services/api';

export interface ChatCardAction {
  label: string;
  url: string;
  icon?: string;
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
  action: ChatCardAction;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  cards?: ChatCard[];
}

export const AIChatDrawer: React.FC = () => {
  const { isChatOpen, setIsChatOpen, activeTrip, planResult } = useApp();
  const currentDest = activeTrip?.destination || planResult?.tripDraft?.destination || 'tu destino';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      text: `¡Hola! Soy tu concierge inteligente de Wayvo impulsado por Google Gemini. Te brindo recomendaciones verificadas para ${currentDest}, reservas de mesas, comparativa de vuelos y protección ante imprevistos.`,
      time: 'Ahora',
      cards: [
        {
          id: 'card-welcome-1',
          type: 'restaurant',
          title: `Guía Gastronómica para ${currentDest}`,
          subtitle: 'Restaurantes con Reserva Previa',
          badge: 'Recomendado',
          location: currentDest,
          description: `Accede a las opciones culinarias mejor valoradas de ${currentDest} con enlace directo a menús y reservas.`,
          action: {
            label: 'Explorar Restaurantes en Maps',
            url: `https://www.google.com/maps/search/?api=1&query=mejores+restaurantes+en+${encodeURIComponent(currentDest)}`,
            icon: 'restaurant',
          },
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
    `¿Qué restaurantes recomiendas en ${currentDest}?`,
    `¿Qué opciones de vuelos hay hacia ${currentDest}?`,
    `¿Qué actividades imperdibles tiene ${currentDest}?`,
    `¿Cómo me protege Wayvo ante retrasos o clima?`,
  ];

  const generateSmartFallback = (
    query: string,
    dest: string
  ): { text: string; cards: ChatCard[] } => {
    const q = query.toLowerCase();
    const destLower = dest.toLowerCase();

    // 1. MIAMI
    if (destLower.includes('miami')) {
      if (
        q.includes('comida') ||
        q.includes('restaurante') ||
        q.includes('plato') ||
        q.includes('gastronom') ||
        q.includes('cenar') ||
        q.includes('almorzar')
      ) {
        return {
          text: `Para Miami, la gastronomía combina mariscos frescos de South Beach con el sabor de Little Havana. Te recomiendo reservar mesa en estos establecimientos:`,
          cards: [
            {
              id: 'fallback-mia-res-1',
              type: 'restaurant',
              title: "Joe's Stone Crab",
              subtitle: 'Especialidad en Cangrejo Moro & Key Lime Pie',
              badge: 'Clásico Histórico • 4.8 ★',
              location: '11 Washington Ave, South Beach',
              priceEstimate: '$$$ (~$65 - $110 USD)',
              description:
                'Fundado en 1913. Famoso por sus pinzas de cangrejo moro con salsa de mostaza dorada y su legendario postre de lima.',
              action: {
                label: 'Reservar Mesa en Joe’s',
                url: 'https://www.google.com/maps/search/?api=1&query=Joes+Stone+Crab+South+Beach+Miami',
                icon: 'restaurant',
              },
            },
            {
              id: 'fallback-mia-res-2',
              type: 'restaurant',
              title: 'Versailles Restaurant',
              subtitle: 'El epicentro de la cocina cubana en Miami',
              badge: 'Patrimonio Cultural • 4.7 ★',
              location: '3555 SW 8th St, Little Havana',
              priceEstimate: '$ (~$18 - $35 USD)',
              description:
                'El restaurante cubano más famoso del mundo. Imperdible su ropa vieja, sándwich cubano y café con leche al paso.',
              action: {
                label: 'Ver Menú y Ubicación',
                url: 'https://www.google.com/maps/search/?api=1&query=Versailles+Restaurant+Little+Havana+Miami',
                icon: 'restaurant',
              },
            },
            {
              id: 'fallback-mia-res-3',
              type: 'restaurant',
              title: 'Zuma Miami',
              subtitle: 'Alta Cocina Japonesa Contemporánea Izakaya',
              badge: 'Fine Dining • 4.6 ★',
              location: '270 Biscayne Blvd Way, Downtown',
              priceEstimate: '$$$$ (~$90 - $160 USD)',
              description:
                'Elegante terraza junto al río de Miami con robata grill, sashimi fresco y coctelería premiada.',
              action: {
                label: 'Reservar en OpenTable',
                url: 'https://www.google.com/maps/search/?api=1&query=Zuma+Miami+Downtown',
                icon: 'restaurant',
              },
            },
          ],
        };
      }

      if (
        q.includes('vuelo') ||
        q.includes('retraso') ||
        q.includes('aeropuerto') ||
        q.includes('volar')
      ) {
        return {
          text: `Para volar a Miami cuentas con frecuencias diarias directas a Miami International (MIA) y opciones a Fort Lauderdale (FLL):`,
          cards: [
            {
              id: 'fallback-mia-flt-1',
              type: 'flight',
              title: 'Vuelos Directos a Miami (MIA)',
              subtitle: 'Avianca • LATAM • American Airlines',
              badge: 'Ruta Directa',
              location: 'Miami International (MIA)',
              priceEstimate: 'Desde $1.250.000 COP ida y vuelta',
              description:
                'Vuelos sin escalas con horarios matutinos y vespertinos. Conexión rápida por Metrorail a Downtown y Brickell.',
              action: {
                label: 'Buscar en Google Flights',
                url: 'https://www.google.com/travel/flights?q=vuelos+a+Miami+MIA',
                icon: 'flight_takeoff',
              },
            },
            {
              id: 'fallback-mia-flt-2',
              type: 'flight',
              title: 'Vuelo Alternativo Fort Lauderdale (FLL)',
              subtitle: 'Spirit • JetBlue',
              badge: 'Tarifa Económica',
              location: 'Fort Lauderdale Intl (FLL)',
              priceEstimate: 'Desde $950.000 COP ida y vuelta',
              description:
                'A solo 35 minutos de Miami; conexión directa en el tren de alta velocidad Brightline hacia Miami Central.',
              action: {
                label: 'Comparar Vuelos a FLL',
                url: 'https://www.google.com/travel/flights?q=vuelos+a+Fort+Lauderdale+FLL',
                icon: 'flight_takeoff',
              },
            },
          ],
        };
      }

      if (
        q.includes('imprevisto') ||
        q.includes('clima') ||
        q.includes('lluvia') ||
        q.includes('huracan')
      ) {
        return {
          text: `En Miami las lluvias de tarde son frecuentes. El sistema Wayvo activa estas coberturas de reprogramación automática:`,
          cards: [
            {
              id: 'fallback-mia-inc-1',
              type: 'contingency',
              title: 'Compensación Climática Wayvo',
              subtitle: 'Sustitución inmediata por actividades bajo techo',
              badge: 'Garantía 100% Sin Costo',
              location: 'Miami Art & Science District',
              description:
                'Si el clima afecta tu plan de playa o paseo náutico, accedes de inmediato a pases para el Pérez Art Museum (PAMM) o Frost Science.',
              action: {
                label: 'Ver Actividades Bajo Techo',
                url: 'https://www.google.com/search?q=Perez+Art+Museum+Miami+tickets',
                icon: 'museum',
              },
            },
          ],
        };
      }

      return {
        text: `Miami es arte de vanguardia, sol y arquitectura Art Déco. Te recomiendo estos planes prioritarios:`,
        cards: [
          {
            id: 'fallback-mia-act-1',
            type: 'activity',
            title: 'Wynwood Walls & Graffiti District',
            subtitle: 'El epicentro mundial del arte urbano',
            badge: 'Top Attraction • 4.8 ★',
            location: '2516 NW 2nd Ave, Wynwood',
            priceEstimate: '~$12 USD Entrada',
            description:
              'Murales monumentales creados por los más destacados artistas contemporáneos y tiendas de diseño independiente.',
            action: {
              label: 'Reservar Entradas / Tickets',
              url: 'https://www.google.com/search?q=Wynwood+Walls+Miami+entradas+tickets',
              icon: 'confirmation_number',
            },
          },
          {
            id: 'fallback-mia-act-2',
            type: 'activity',
            title: 'Paseo en Barco por Biscayne Bay',
            subtitle: 'Vistas panorámicas del Skyline y Star Island',
            badge: 'Al Atardecer • 4.7 ★',
            location: 'Bayside Marketplace, Downtown Miami',
            priceEstimate: '~$38 USD por persona',
            description:
              'Recorrido de 90 minutos frente a las mansiones de celebridades con excelente iluminación al atardecer.',
              action: {
                label: 'Ver Disponibilidad de Tours',
                url: 'https://www.google.com/search?q=Biscayne+Bay+boat+tour+Miami+reservas',
                icon: 'sailing',
              },
          },
        ],
      };
    }

    // 2. CARTAGENA
    if (destLower.includes('cartagena')) {
      if (
        q.includes('comida') ||
        q.includes('restaurante') ||
        q.includes('plato') ||
        q.includes('gastronom')
      ) {
        return {
          text: `En Cartagena, te recomiendo la alta cocina caribeña con ingredientes autóctonos en estos restaurantes icónicos:`,
          cards: [
            {
              id: 'fallback-ctg-res-1',
              type: 'restaurant',
              title: 'Restaurante Celele',
              subtitle: 'Cocina del Caribe Contemporáneo',
              badge: 'Latin America’s 50 Best • 4.9 ★',
              location: 'Calle del Espíritu Santo, Getsemaní',
              priceEstimate: '$$$ (~$120.000 - $220.000 COP)',
              description:
                'Investigación de flora y sabores del litoral colombiano presentada en un exquisito menú degustación.',
              action: {
                label: 'Reservar Mesa / Ver Menú',
                url: 'https://www.google.com/maps/search/?api=1&query=Celele+Restaurante+Cartagena',
                icon: 'restaurant',
              },
            },
            {
              id: 'fallback-ctg-res-2',
              type: 'restaurant',
              title: 'Candé 100% Cartagenero',
              subtitle: 'Platos tradicionales en casona colonial',
              badge: 'Cultura Viva • 4.7 ★',
              location: 'Calle de la Serrezuela, San Diego',
              priceEstimate: '$$ (~$85.000 - $140.000 COP)',
              description:
                'Posta negra, arroz con coco, frutos del mar y presentaciones de folclor en vivo.',
              action: {
                label: 'Reservar Mesa en Candé',
                url: 'https://www.google.com/maps/search/?api=1&query=Cande+Restaurante+Cartagena',
                icon: 'restaurant',
              },
            },
          ],
        };
      }

      return {
        text: `En Cartagena de Indias, te sugiero combinar un pasadía en las islas con paseos al atardecer en el Centro Histórico:`,
        cards: [
          {
            id: 'fallback-ctg-act-1',
            type: 'activity',
            title: 'Excursión a Islas del Rosario',
            subtitle: 'Playas cristalinas y snorkel en arrecifes',
            badge: 'Pasadía Top • 4.8 ★',
            location: 'Muelle de la Bodeguita',
            priceEstimate: '~$180.000 COP por persona',
            description:
              'Transporte marítimo rápido, cóctel de bienvenida, deportes acuáticos y almuerzo caribeño en la playa.',
            action: {
              label: 'Ver Opciones y Reservas',
              url: 'https://www.google.com/search?q=Islas+del+Rosario+pasadia+Cartagena+reservas',
              icon: 'sailing',
            },
          },
        ],
      };
    }

    // 3. DESTINO GENERAL O PERSONALIZADO
    if (
      q.includes('comida') ||
      q.includes('restaurante') ||
      q.includes('plato') ||
      q.includes('gastronom')
    ) {
      return {
        text: `Para ${dest}, he seleccionado las recomendaciones culinarias más aclamadas con enlace directo para reservar:`,
        cards: [
          {
            id: 'fallback-gen-res-1',
            type: 'restaurant',
            title: `Mejores Restaurantes de ${dest}`,
            subtitle: 'Gastronomía autóctona & Guía de Autor',
            badge: 'Top Picks • 4.7+ ★',
            location: `Zonas principales de ${dest}`,
            priceEstimate: 'Menús y reservas disponibles',
            description: `Encuentra las mejores opciones gastronómicas de ${dest} con opiniones verificadas de comensales locales.`,
            action: {
              label: 'Explorar Restaurantes en Maps',
              url: `https://www.google.com/maps/search/?api=1&query=mejores+restaurantes+en+${encodeURIComponent(dest)}`,
              icon: 'restaurant',
            },
          },
        ],
      };
    }

    return {
      text: `Como tu asistente para ${dest}, aquí tienes las opciones prioritarias de vuelos, experiencias y reservas oficiales:`,
      cards: [
        {
          id: 'fallback-gen-flt-1',
          type: 'flight',
          title: `Vuelos hacia ${dest}`,
          subtitle: 'Comparador de itinerarios y aerolíneas',
          badge: 'Google Flights',
          location: `Aeropuerto de ${dest}`,
          priceEstimate: 'Tarifas en tiempo real',
          description: `Compara fechas y conexiones de aerolíneas para viajar hacia ${dest} con equipaje protegido.`,
          action: {
            label: 'Buscar Vuelos en Google Flights',
            url: `https://www.google.com/travel/flights?q=vuelos+a+${encodeURIComponent(dest)}`,
            icon: 'flight_takeoff',
          },
        },
        {
          id: 'fallback-gen-act-1',
          type: 'activity',
          title: `Tours y Entradas Oficiales en ${dest}`,
          subtitle: 'Atracciones, museos y naturaleza',
          badge: 'Experiencias Curadas',
          location: dest,
          priceEstimate: 'Acceso prioritario',
          description: `Reserva con antelación las actividades más destacadas de ${dest} con políticas de cancelación flexible.`,
          action: {
            label: 'Ver Actividades y Entradas',
            url: `https://www.google.com/search?q=mejores+tours+y+actividades+en+${encodeURIComponent(dest)}+reservas`,
            icon: 'confirmation_number',
          },
        },
      ],
    };
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

    const fallback = generateSmartFallback(text, currentDest);

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
        response.message?.text ||
        fallback.text;

      const replyCards =
        (response as any)?.cards ||
        (response as any)?.data?.cards ||
        fallback.cards;

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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          text: fallback.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cards: fallback.cards,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-surface-container-lowest shadow-2xl flex flex-col border-l border-outline-variant/30 animate-fade-in">
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
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[92%] ${
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
                <div>{msg.text}</div>

                {/* Interactive Cards inside Chat Bubble */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2.5 w-full">
                    {msg.cards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-1.5 text-xs hover:border-secondary transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-secondary text-[16px]">
                              {card.action?.icon ||
                                (card.type === 'restaurant'
                                  ? 'restaurant'
                                  : card.type === 'flight'
                                  ? 'flight'
                                  : card.type === 'contingency'
                                  ? 'shield'
                                  : 'local_activity')}
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

                        {card.action && (
                          <a
                            href={card.action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary text-[11px] font-semibold transition-all shadow-xs"
                          >
                            <span>{card.action.label}</span>
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          </a>
                        )}
                      </div>
                    ))}
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
            <span>Gemini está procesando tu consulta...</span>
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
          placeholder={`Pregunta sobre ${currentDest}, restaurantes, vuelos...`}
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
