import { fireEvent, render, screen } from '@testing-library/react';
import { redirect, useSearchParams } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { signIn } from 'next-auth/react';

import WelcomePage, { generateMetadata } from '@/app/(sign-in)/welcome/page';
import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import { checkAccessibility } from '@/jest/utils';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('@/config/whiteLabel', () => ({
  getWhiteLabelValues: jest.fn(),
}));

describe('Welcome page tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      longName: 'Secure Data Environment',
      acronym: 'SDE',
    });
  });

  it('returns correct metadata for SDE', async () => {
    const result = await generateMetadata();
    expect(result.title).toBe(
      'Welcome to the NHS Secure Data Environment - SDE',
    );
  });

  it('returns correct metadata for CDP', async () => {
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      longName: 'Common Data Platform',
      acronym: 'CDP',
    });

    const result = await generateMetadata();
    expect(result.title).toBe('Welcome to the NHS Common Data Platform - CDP');
  });

  it('redirects when login session exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'Alice' },
    });

    await WelcomePage({ searchParams: { callbackUrl: '/dashboard' } });
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to root when session exists but no callbackUrl', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'Bob' },
    });

    await WelcomePage({});
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('redirects correctly when callbackUrl is an array', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'Bob' },
    });

    render(
      await WelcomePage({
        searchParams: { callbackUrl: ['/vampires', 'ghosts'] },
      }),
    );

    expect(redirect).toHaveBeenCalledWith('/vampires');
  });

  it('redirects correctly when callbackUrl is a string', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'Bob' },
    });

    render(await WelcomePage({ searchParams: { callbackUrl: '/ghosts' } }));

    expect(redirect).toHaveBeenCalledWith('/ghosts');
  });

  it('renders SDE content when acronym is SDE', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { container } = render(await WelcomePage({}));

    expect(
      screen.getByRole('heading', {
        name: /Sign in to the Secure Data Environment \(SDE\) Portal/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('The SDE Portal is the home page for SDE services.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Sign into the Portal to:')).toBeInTheDocument();
    expect(
      screen.getByText('launch the virtual SDE desktop'),
    ).toBeInTheDocument();
    expect(screen.getByText('import reference data files')).toBeInTheDocument();
    expect(screen.getByText('output your results')).toBeInTheDocument();
    expect(
      screen.getByText('If you are a User Manager, sign into the Portal to:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('add, view and manage your SDE users'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You will not be charged for managing users on the SDE.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You must have an existing account to sign into the SDE Portal.',
      ),
    ).toBeInTheDocument();
    const contact_us = screen.getByText(/issues with signing in/i).closest('p');
    expect(contact_us).toHaveTextContent(
      `For issues with signing in, contact the National Service Desk on ${NATIONAL_SERVICE_DESK_TELEPHONE} or email ${NATIONAL_SERVICE_DESK_EMAIL}`,
    );
    expect(screen.getByRole('button', { name: /Sign in/ })).toBeInTheDocument();

    await checkAccessibility(container);
  });

  it('renders CDP content when acronym is CDP', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      longName: 'Common Data Platform',
      acronym: 'CDP',
    });

    const { container } = render(await WelcomePage({}));

    expect(
      screen.getByRole('heading', {
        name: /Sign in to the Common Data Platform \(CDP\) Portal/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('The CDP Portal is the home page for CDP services.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Sign into the Portal to:')).toBeInTheDocument();
    expect(
      screen.getByText('launch the virtual CDP desktop'),
    ).toBeInTheDocument();
    expect(screen.getByText('output your results')).toBeInTheDocument();
    expect(
      screen.getByText('If you are a User Manager, sign into the Portal to:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('add, view and manage your CDP users'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You must have an existing account to sign into the CDP Portal.',
      ),
    ).toBeInTheDocument();
    const contact_us = screen.getByText(/issues with signing in/i).closest('p');
    expect(contact_us).toHaveTextContent(
      `For issues with signing in, contact the National Service Desk on ${NATIONAL_SERVICE_DESK_TELEPHONE} or email ${NATIONAL_SERVICE_DESK_EMAIL}`,
    );
    expect(screen.getByRole('button', { name: /Sign in/ })).toBeInTheDocument();

    await checkAccessibility(container);
  });

  it('throws error for unknown acronym', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      longName: 'Unknown Service',
      acronym: 'XYZ',
    });

    await expect(WelcomePage({})).rejects.toThrow(
      /welcomPageContentMap entry missing: XYZ/,
    );
  });

  it('welcome page handles no callback url', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    render(await WelcomePage({}));

    expect(screen.getByRole('button', { name: /Sign in/ })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('welcome-button'));
    expect(signIn).toHaveBeenCalledWith(
      'keycloak',
      expect.objectContaining({
        callbackUrl: '/',
      }),
    );
  });

  it('sign in button handles callback url array', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => ['/pumpkinhead', '/ghosts'],
    });

    render(await WelcomePage({}));

    expect(screen.getByRole('button', { name: /Sign in/ })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('welcome-button'));
    expect(signIn).toHaveBeenCalledWith(
      'keycloak',
      expect.objectContaining({
        callbackUrl: '/pumpkinhead',
      }),
    );
  });

  it('sign in button handles string callback url', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => '/spooky-biscuits',
    });

    render(await WelcomePage({}));

    expect(screen.getByRole('button', { name: /Sign in/ })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('welcome-button'));
    expect(signIn).toHaveBeenCalledWith(
      'keycloak',
      expect.objectContaining({
        callbackUrl: '/spooky-biscuits',
      }),
    );
  });

  it('sign in button handles no callback url', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    render(await WelcomePage({}));

    expect(screen.getByRole('button', { name: /Sign in/ })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('welcome-button'));
    expect(signIn).toHaveBeenCalledWith(
      'keycloak',
      expect.objectContaining({
        callbackUrl: '/',
      }),
    );
  });
});
