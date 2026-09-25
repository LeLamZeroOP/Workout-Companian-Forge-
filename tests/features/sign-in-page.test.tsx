import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SignInPage } from '../../src/features/auth/SignInPage';

describe('SignInPage', () => {
  it('starts Google sign-in and explains what syncs', () => {
    const onGoogleSignIn = vi.fn();
    render(<SignInPage onGoogleSignIn={onGoogleSignIn} />);
    expect(screen.getByText(/workouts, body logs, and meals/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(onGoogleSignIn).toHaveBeenCalledOnce();
  });

  it('shows an actionable error', () => {
    render(<SignInPage onGoogleSignIn={() => {}} error="Sign-in was cancelled." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Sign-in was cancelled.');
  });
});
