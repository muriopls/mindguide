import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import type { ChatMessage } from '@/types';

const makeMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: 'test-id',
  role,
  content,
  timestamp: new Date(),
});

describe('ChatBubble', () => {
  it('renders user message content', () => {
    render(<ChatBubble message={makeMessage('user', 'Hallo!')} />);
    expect(screen.getByText('Hallo!')).toBeInTheDocument();
  });

  it('renders assistant message content', () => {
    render(<ChatBubble message={makeMessage('assistant', 'Was denkst du?')} />);
    expect(screen.getByText('Was denkst du?')).toBeInTheDocument();
  });

  it('shows user avatar label for user messages', () => {
    render(<ChatBubble message={makeMessage('user', 'Test')} />);
    expect(screen.getByText('Du')).toBeInTheDocument();
  });

  it('shows sparkles icon for assistant messages', () => {
    render(<ChatBubble message={makeMessage('assistant', 'Test')} />);
    expect(screen.queryByText('Du')).not.toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
