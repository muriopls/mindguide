export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarMessage {
  id: string;
  message: string;
  variant: SnackbarVariant;
}

export type ChatErrorCode = 'no_key' | 'auth' | 'rate_limit' | 'server_error' | 'network' | 'generic';

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

export type AccountType = 'standalone' | 'parent' | 'child';

export interface UserProfile {
  id: string;
  displayName: string | null;
  accountType: AccountType;
  parentId: string | null;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  provider: AIProvider;
  locale: Locale;
  createdAt: string;
  endedAt: string | null;
  messageCount: number;
  subjectSlug: string | null;
}

export interface StudentSubject {
  slug: string;
  conversationCount: number;
  lastActiveAt: string | null;
}

export interface SavedMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface MisuseFlag {
  id: string;
  conversationId: string;
  childId: string;
  childName: string | null;
  parentId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  reviewed: boolean;
  createdAt: string;
}

export interface ChildAccount {
  id: string;
  displayName: string | null;
  email: string;
  createdAt: string;
}

export interface UsageStat {
  date: string;
  conversationCount: number;
  messageCount: number;
}
