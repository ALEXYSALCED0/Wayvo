/**
 * AI Service (Mock Layer)
 * Leaves room for the future Multi-Agent AI architecture while providing a polished mobile experience today
 */

import { ChatMessage, QuickChip } from '../types/ai';
import { mockInitialAIMessages } from '../data/mockData';

class AIService {
  private messages: ChatMessage[] = [...mockInitialAIMessages];

  async getChatHistory(): Promise<ChatMessage[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [...this.messages];
  }

  async sendMessage(userText: string): Promise<ChatMessage> {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.messages.push(userMsg);

    // Simulate AI thinking
    await new Promise((resolve) => setTimeout(resolve, 900));

    let replyText = "I'm analyzing your request with your travel preferences.";
    let chips: QuickChip[] = [
      { id: 'c1', label: 'View Itinerary', iconName: 'map' },
      { id: 'c2', label: 'Show more options', iconName: 'tune' },
    ];

    const lower = userText.toLowerCase();
    if (lower.includes('train') || lower.includes('miss') || lower.includes('late')) {
      replyText = "I've checked the latest schedules. The next high-speed train to France leaves at 15:30 with open seats in Standard Premier. Would you like me to reserve it?";
      chips = [
        { id: 'c-book', label: 'Yes, reserve seat', iconName: 'check-circle', isPrimary: true },
        { id: 'c-bus', label: 'Check bus options', iconName: 'directions-bus' },
        { id: 'c-human', label: 'Talk to concierge', iconName: 'support-agent' },
      ];
    } else if (lower.includes('rome') || lower.includes('stay') || lower.includes('extend')) {
      replyText = "Staying longer in Rome is a wonderful choice! I can extend your hotel reservation by 1 night and add a private evening tour of the Colosseum and Trastevere food walk.";
      chips = [
        { id: 'c-rome-ok', label: 'Apply Rome extension', iconName: 'check-circle', isPrimary: true },
        { id: 'c-rome-hotel', label: 'View hotel options', iconName: 'hotel' },
      ];
    } else if (lower.includes('dinner') || lower.includes('food') || lower.includes('restaurant')) {
      replyText = "For tonight in Paris, I recommend Le Gabriel (2 Michelin stars) at 20:30, or a casual artisan bistro in Saint-Germain. Shall I confirm a table?";
      chips = [
        { id: 'c-dine-1', label: 'Reserve Le Gabriel', iconName: 'restaurant', isPrimary: true },
        { id: 'c-dine-2', label: 'See casual bistros', iconName: 'local-cafe' },
      ];
    } else if (lower.includes('weekend') || lower.includes('plan')) {
      replyText = "Based on your interest in culture and scenic views, a weekend getaway to the Swiss Alps or Bordeaux wine valley would be ideal. Which one would you prefer to explore?";
      chips = [
        { id: 'c-swiss', label: 'Swiss Alps Retreat', iconName: 'landscape' },
        { id: 'c-wine', label: 'Bordeaux Wine Tour', iconName: 'wine-bar' },
      ];
    }

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickChips: chips,
    };
    this.messages.push(aiMsg);

    return aiMsg;
  }
}

export const aiService = new AIService();
