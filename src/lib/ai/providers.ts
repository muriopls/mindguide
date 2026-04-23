import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { AIProvider } from '@/types';

export function getModel(provider: AIProvider, userKey?: string): LanguageModel {
  if (provider === 'openai') {
    const openai = createOpenAI({ apiKey: userKey ?? process.env.OPENAI_API_KEY });
    return openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini');
  }

  const anthropic = createAnthropic({ apiKey: userKey ?? process.env.ANTHROPIC_API_KEY });
  return anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6');
}
