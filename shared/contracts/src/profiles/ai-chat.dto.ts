export interface QuickChip {
  id: string;
  label: string;
  iconName?: string;
  actionPayload?: string;
  isPrimary?: boolean;
}

export interface SuggestedChatAction {
  type: 'NAVIGATE_TIMELINE' | 'SHOW_OPTIONS' | 'CONFIRM_ROUTE' | 'UPDATE_BUDGET';
  payload?: unknown;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  quickChips?: QuickChip[];
  suggestedAction?: SuggestedChatAction;
}

export interface AIChatRequest {
  userId: string;
  message: string;
  tripId?: string;
  conversationHistory?: ChatMessage[];
  context?: {
    currentDestination?: string;
    budgetCategory?: string;
    travelStyle?: string;
  };
}

export interface AIChatResponse {
  message: ChatMessage;
  quickChips?: QuickChip[];
  suggestedAction?: SuggestedChatAction;
}
