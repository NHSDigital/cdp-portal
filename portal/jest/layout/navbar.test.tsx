import { render, screen } from '@testing-library/react';
import { useParams, usePathname } from 'next/navigation';

import Navbar from '@/app/layout/navbar';
import { WhiteLabelEntry } from '@/config/whiteLabel';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  usePathname: jest.fn(),
}));

const whiteLabelValues: WhiteLabelEntry = {
  acronym: 'SDE',
  longName: 'Secure Data Environment',
};

describe('Navigation bar tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders PageSelectorBar and ChangeAgreementBar on manage-users route', () => {
    (useParams as jest.Mock).mockReturnValue({ agreement_id: 'agreement-1' });
    (usePathname as jest.Mock).mockReturnValue(
      '/agreement/agreement-1/manage-users',
    );

    render(<Navbar whiteLabelValues={whiteLabelValues} />);

    expect(
      screen.getByRole('navigation', { name: /Primary navigation/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: /Currently selected agreement/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /SDE Portal/ })).toHaveAttribute(
      'href',
      '/agreement/agreement-1',
    );
    expect(screen.getByRole('link', { name: /Manage users/ })).toHaveAttribute(
      'href',
      '/agreement/agreement-1/manage-users',
    );
    expect(
      screen.getByRole('link', { name: /Change agreement/ }),
    ).toHaveAttribute('href', '/');
    expect(screen.getByText(/Reference Number:/).tagName).toBe('STRONG');
    expect(screen.getByText(/AGREEMENT-1/)).toBeInTheDocument();
  });

  it('renders nothing if no agreement_id', () => {
    (useParams as jest.Mock).mockReturnValue({});
    (usePathname as jest.Mock).mockReturnValue(
      '/agreement/agreement-1/manage-users',
    );

    render(<Navbar whiteLabelValues={whiteLabelValues} />);

    expect(
      screen.queryByRole('navigation', { name: /Primary navigation/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', {
        name: /Currently selected agreement/,
      }),
    ).not.toBeInTheDocument();
  });

  it('handles useParams returning undefined', () => {
    (useParams as jest.Mock).mockReturnValue(undefined);
    (usePathname as jest.Mock).mockReturnValue(
      '/agreement/agreement-1/manage-users',
    );

    render(<Navbar whiteLabelValues={whiteLabelValues} />);

    // should not render because agreement_id is missing
    expect(
      screen.queryByRole('navigation', { name: /Primary navigation/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', {
        name: /Currently selected agreement/,
      }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing if pathname does not include manage-users', () => {
    (useParams as jest.Mock).mockReturnValue({ agreement_id: 'agreement-1' });
    (usePathname as jest.Mock).mockReturnValue(
      '/agreement/agreement-1/other-page',
    );

    render(<Navbar whiteLabelValues={whiteLabelValues} />);

    expect(
      screen.queryByRole('navigation', { name: /Primary navigation/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', {
        name: /Currently selected agreement/,
      }),
    ).not.toBeInTheDocument();
  });

  it('hides "Change agreement" link on sub-paths under manage-users', () => {
    (useParams as jest.Mock).mockReturnValue({ agreement_id: 'agreement-1' });
    (usePathname as jest.Mock).mockReturnValue(
      '/agreement/agreement-1/manage-users/add-user',
    );

    render(<Navbar whiteLabelValues={whiteLabelValues} />);

    // Navbar should still render
    expect(
      screen.getByRole('navigation', { name: /Primary navigation/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: /Currently selected agreement/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /SDE Portal/ })).toHaveAttribute(
      'href',
      '/agreement/agreement-1',
    );
    expect(screen.getByRole('link', { name: /Manage users/ })).toHaveAttribute(
      'href',
      '/agreement/agreement-1/manage-users',
    );
    expect(screen.getByText(/Reference Number:/).tagName).toBe('STRONG');
    expect(screen.getByText(/AGREEMENT-1/)).toBeInTheDocument();

    // But no "Change agreement" link
    expect(
      screen.queryByRole('link', { name: /Change agreement/i }),
    ).not.toBeInTheDocument();
  });
});
