import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';

import LogoutButton from '@/app/layout/logoutButton';
import { useAsyncError } from '@/helpers/errorHelpers';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

jest.mock('@/helpers/errorHelpers', () => ({
  useAsyncError: jest.fn(),
}));

describe('LogoutButton', () => {
  const mockThrowAsyncError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useParams as jest.Mock).mockReturnValue({
      agreement_id: 'agreement-123',
    });

    (useAsyncError as jest.Mock).mockReturnValue(mockThrowAsyncError);

    global.fetch = jest.fn();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders the logout button', () => {
    render(<LogoutButton />);

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('submits successfully and calls signOut', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 204,
    });

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /logout/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/signout', {
      method: 'POST',
      body: JSON.stringify({
        agreement_id: 'agreement-123',
        uses_js: true,
      }),
    });

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({
        callbackUrl: '/logout_confirm',
      });
    });

    expect(mockThrowAsyncError).not.toHaveBeenCalled();
  });

  it('throws async error when logout fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 500,
    });

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /logout/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockThrowAsyncError).toHaveBeenCalledWith('Failed to logout');
    });
  });

  it('renders hidden inputs with correct values', () => {
    render(<LogoutButton />);

    expect(screen.getByDisplayValue('agreement-123')).toBeInTheDocument();

    expect(screen.getByDisplayValue('false')).toBeInTheDocument();
  });

  it('handles missing agreement_id gracefully', async () => {
    (useParams as jest.Mock).mockReturnValue({});
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 204,
    });

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /logout/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/signout', {
        method: 'POST',
        body: JSON.stringify({
          agreement_id: '',
          uses_js: true,
        }),
      });
    });
  });
});
