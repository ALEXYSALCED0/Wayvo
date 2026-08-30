/**
 * Types for Wayvo AI Assistant and Conversational Interface
 */

export interface QuickChip {
  id: string;
  label: string;
  iconName?: string;
  actionPayload?: string;
  isPrimary?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  quickChips?: QuickChip[];
  suggestedAction?: {
    type: 'NAVIGATE_TIMELINE' | 'SHOW_OPTIONS' | 'CONFIRM_ROUTE';
    payload?: string;
  };
}
