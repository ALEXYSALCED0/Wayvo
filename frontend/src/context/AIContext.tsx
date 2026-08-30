/**
 * AIContext - Chat and conversational assistance state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatMessage, QuickChip } from '../types/ai';
import { aiService } from '../services/aiService';
import { mockInitialAIMessages } from '../data/mockData';

interface AIContextType {
  messages: ChatMessage[];
  isThinking: boolean;
  sendMessage: (text: string) => Promise<void>;
  handleChipPress: (chip: QuickChip) => Promise<void>;
  clearChat: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with initial messages synchronously so they are immediately visible on mobile
  const [messages, setMessages] = useState<ChatMessage[]>([...mockInitialAIMessages]);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  useEffect(() => {
    aiService.getChatHistory().then((history) => {
      if (history && history.length > 0) {
        setMessages(history);
      }
    });
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setIsThinking(true);
    const updatedUser: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, updatedUser]);

    const reply = await aiService.sendMessage(text);
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === reply.id);
      return exists ? prev : [...prev, reply];
    });
    setIsThinking(false);
  };

  const handleChipPress = async (chip: QuickChip) => {
    await sendMessage(chip.label);
  };

  const clearChat = () => {
    setMessages([...mockInitialAIMessages]);
  };

  return (
    <AIContext.Provider
      value={{
        messages,
        isThinking,
        sendMessage,
        handleChipPress,
        clearChat,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
