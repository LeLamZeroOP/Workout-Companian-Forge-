import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/app/App';

describe('application shell', () => {
  it('shows Today and lets a keyboard user navigate', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Today' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('heading', { level: 1, name: 'Programs' })).toBeInTheDocument();
  });

  it('opens body tracking from primary navigation', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Body' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Body' })).toBeInTheDocument();
    expect(screen.getByText(/start with today's weight/i)).toBeInTheDocument();
  });

  it('places muscle analytics inside Progress instead of desktop navigation', async () => {
    render(<App />);
    const navigation = screen.getByRole('navigation', { name: /desktop primary/i });
    expect(within(navigation).queryByRole('button', { name: 'Muscles' })).not.toBeInTheDocument();
    await userEvent.click(within(navigation).getByRole('button', { name: 'Progress' }));
    expect(screen.getByRole('button', { name: 'Muscles' })).toBeInTheDocument();
  });

  it('uses five mobile destinations and opens an accessible More page', async () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }) });
    render(<App />);
    const navigation = screen.getByRole('navigation', { name: /mobile primary/i });
    expect(within(navigation).getAllByRole('button')).toHaveLength(5);
    expect(within(navigation).getByRole('button', { name: 'Workout' })).toBeInTheDocument();
    await userEvent.click(within(navigation).getByRole('button', { name: 'More' }));
    expect(screen.getByRole('heading', { level: 1, name: 'More' })).toBeInTheDocument();
    for (const label of ['History', 'Body', 'Nutrition', 'Settings']) expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /open body/i }));
    expect(within(navigation).getByRole('button', { name: 'More' })).toHaveAttribute('aria-current', 'page');
  });
});
