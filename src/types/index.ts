export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarMessage {
  id: string;
  message: string;
  variant: SnackbarVariant;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type Locale = 'de' | 'en';

export type AIProvider = 'claude' | 'openai';
