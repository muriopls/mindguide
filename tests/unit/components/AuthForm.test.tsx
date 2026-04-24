import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
    },
  }),
}));

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useLocale: () => 'de',
  };
});

const messages = {
  auth: {
    loginTitle: 'Willkommen zurück',
    loginSubtitle: 'Melde dich an.',
    registerTitle: 'Konto erstellen',
    registerSubtitle: 'Leg dein Konto an.',
    email: 'E-Mail-Adresse',
    emailPlaceholder: 'deine@email.de',
    password: 'Passwort',
    passwordPlaceholder: 'Mindestens 8 Zeichen',
    displayName: 'Dein Name',
    displayNamePlaceholder: 'Wie sollen wir dich nennen?',
    loginButton: 'Anmelden',
    registerButton: 'Konto erstellen',
    switchToRegister: 'Noch kein Konto? Registrieren',
    switchToLogin: 'Schon ein Konto? Anmelden',
    errorInvalidCredentials: 'E-Mail oder Passwort ist falsch.',
    errorEmailTaken: 'Diese E-Mail-Adresse ist bereits vergeben.',
    errorGeneric: 'Etwas ist schiefgelaufen.',
    successRegister: 'Konto erstellt!',
  },
};

const wrap = (ui: React.ReactElement) => (
  <NextIntlClientProvider locale="de" messages={messages}>{ui}</NextIntlClientProvider>
);

describe('AuthForm — login mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', async () => {
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="login" />));
    expect(screen.getByLabelText('E-Mail-Adresse')).toBeInTheDocument();
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
  });

  it('does not render display name field in login mode', async () => {
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="login" />));
    expect(screen.queryByLabelText('Dein Name')).not.toBeInTheDocument();
  });

  it('renders the login button', async () => {
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="login" />));
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
  });

  it('calls signInWithPassword with entered credentials', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="login" />));

    fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    });
  });

  it('shows invalid credentials error on auth failure', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="login" />));

    fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => {
      expect(screen.getByText('E-Mail oder Passwort ist falsch.')).toBeInTheDocument();
    });
  });

  it('shows generic error on unexpected auth failure', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Network error' } });
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="login" />));

    fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), { target: { value: 'x@x.com' } });
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'password1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => {
      expect(screen.getByText('Etwas ist schiefgelaufen.')).toBeInTheDocument();
    });
  });
});

describe('AuthForm — register mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders display name field in register mode', async () => {
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="register" />));
    expect(screen.getByLabelText('Dein Name')).toBeInTheDocument();
  });

  it('renders the register button', async () => {
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="register" />));
    expect(screen.getByRole('button', { name: 'Konto erstellen' })).toBeInTheDocument();
  });

  it('calls signUp with email, password, and display name', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="register" />));

    fireEvent.change(screen.getByLabelText('Dein Name'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), { target: { value: 'maria@school.de' } });
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'securepass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Konto erstellen' } ));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'maria@school.de',
        password: 'securepass',
        options: { data: { display_name: 'Maria' } },
      });
    });
  });

  it('shows email taken error when address already exists', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'User already registered' } });
    const { AuthForm } = await import('@/components/auth/AuthForm');
    render(wrap(<AuthForm mode="register" />));

    fireEvent.change(screen.getByLabelText('Dein Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'password1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Konto erstellen' } ));

    await waitFor(() => {
      expect(screen.getByText('Diese E-Mail-Adresse ist bereits vergeben.')).toBeInTheDocument();
    });
  });
});
