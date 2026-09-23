import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/app/App';

describe('application shell', () => {
  it('shows Today and lets a keyboard user navigate', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Today' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('heading', { level: 1, name: 'Programs' })).toBeInTheDocument();
  });
});
