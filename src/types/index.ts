export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarMessage {
  id: string;
  message: string;
  variant: SnackbarVariant;
}

export type ChatErrorCode = 'no_key' | 'auth' | 'rate_limit' | 'network' | 'generic';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
  errorCode?: ChatErrorCode;
}

export type Locale = 'de' | 'en';

export type AIProvider = 'claude' | 'openai';
