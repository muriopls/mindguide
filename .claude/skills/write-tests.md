# Skill: Tests schreiben

Generiere Unit Tests (Vitest + RTL) und E2E Tests (Playwright) für MindGuide.

## Befehle
```bash
npm test              # alle unit tests
npm run test:watch    # watch mode
npm run test:e2e      # playwright e2e
```

## Unit Test — Komponente (Vitest + RTL)

Muster für `tests/unit/components/<ComponentName>.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '@/components/path/ComponentName';

// Mock next-intl wenn nötig
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<ComponentName onAction={onAction} />);
    await user.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
```

## Unit Test — API Route (Vitest)

```ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/route';
import { NextRequest } from 'next/server';

describe('POST /api/route', () => {
  it('returns 200 with valid input', async () => {
    const req = new NextRequest('http://localhost/api/route', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hallo' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
```

## E2E Test (Playwright)

Muster für `e2e/<feature>.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Chat Feature', () => {
  test('user can send a message and receive a response', async ({ page }) => {
    await page.goto('/de');
    const input = page.getByPlaceholder(/Stelle mir eine Frage/);
    await input.fill('Was ist eine Primzahl?');
    await input.press('Enter');
    await expect(page.getByRole('alert')).toBeVisible(); // loading
    await expect(page.getByText(/denkst du/i)).toBeVisible({ timeout: 10000 });
  });
});
```

## Regeln
- Immer echte Assertionen — kein `expect(true).toBe(true)`
- next-intl in Unit Tests immer mocken
- Jede neue Komponente bekommt mindestens einen Render-Test
- Bei Bugs: erst fehlschlagenden Test schreiben, dann fixen
