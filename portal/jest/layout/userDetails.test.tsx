import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import UserDetails from '@/app/layout/userDetails';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('UserDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing if there is no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const component = await UserDetails();

    expect(component).toBeNull();
  });

  it('renders user name and logout button when session exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'Alice' },
    });

    const component = await UserDetails();
    render(component);

    expect(screen.getByText(/Logged in as Alice/i)).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
