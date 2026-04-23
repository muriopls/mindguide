import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ChatBubble } from '@/components/chat/ChatBubble';

const messages = {
  chat: {
    errorNoKey: 'Kein API-Schlüssel konfiguriert.',
    errorAuth: 'Der API-Schlüssel ist ungültig.',
    errorRateLimit: 'Zu viele Anfragen.',
    errorNetwork: 'Keine Verbindung.',
    errorGeneric: 'Ups, das hat nicht geklappt.',
    retry: 'Nochmal versuchen',
  },
};

const wrap = (ui: React.ReactElement) => (
  <NextIntlClientProvider locale="de" messages={messages}>{ui}</NextIntlClientProvider>
);

const msg = (role: 'user' | 'assistant', content: string) => ({ id: 'test-id', role, content });

describe('ChatBubble', () => {
  it('renders user message content', () => {
    render(wrap(<ChatBubble message={msg('user', 'Hallo!')} />));
    expect(screen.getByText('Hallo!')).toBeInTheDocument();
  });

  it('renders assistant message content', () => {
    render(wrap(<ChatBubble message={msg('assistant', 'Was denkst du?')} />));
    expect(screen.getByText('Was denkst du?')).toBeInTheDocument();
  });

  it('shows user avatar label for user messages', () => {
    render(wrap(<ChatBubble message={msg('user', 'Test')} />));
    expect(screen.getByText('Du')).toBeInTheDocument();
  });

  it('shows no "Du" label for assistant messages', () => {
    render(wrap(<ChatBubble message={msg('assistant', 'Test')} />));
    expect(screen.queryByText('Du')).not.toBeInTheDocument();
  });

  it('renders error state with generic message and retry button', () => {
    const onRetry = () => {};
    render(wrap(
      <ChatBubble
        message={{ ...msg('assistant', ''), error: true, errorCode: 'generic' }}
        onRetry={onRetry}
      />,
    ));
    expect(screen.getByText('Ups, das hat nicht geklappt.')).toBeInTheDocument();
    expect(screen.getByText('Nochmal versuchen')).toBeInTheDocument();
  });

  it('renders error state without retry button when onRetry not provided', () => {
    render(wrap(
      <ChatBubble message={{ ...msg('assistant', ''), error: true, errorCode: 'network' }} />,
    ));
    expect(screen.getByText('Keine Verbindung.')).toBeInTheDocument();
    expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument();
  });
});
