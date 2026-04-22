import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Snackbar } from '@/components/ui/snackbar';

describe('Snackbar', () => {
  it('renders message text', () => {
    render(<Snackbar message="Gespeichert" variant="success" onDismiss={() => {}} />);
    expect(screen.getByText('Gespeichert')).toBeInTheDocument();
  });

  it('calls onDismiss when close button clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Snackbar message="Test" variant="info" onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: /schließen/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('has role alert for accessibility', () => {
    render(<Snackbar message="Fehler" variant="error" onDismiss={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders all variants without error', () => {
    const variants = ['success', 'error', 'warning', 'info'] as const;
    for (const variant of variants) {
      const { unmount } = render(<Snackbar message={variant} variant={variant} onDismiss={() => {}} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      unmount();
    }
  });
});
