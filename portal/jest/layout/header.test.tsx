import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import { getServerSession } from 'next-auth';

import Header from '@/app/layout/header';

import { getWhiteLabelValues } from '../../config/whiteLabel';
import { checkAccessibility } from '../utils';

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/app/layout/userDetails', () => {
  const MockUserDetails = () => (
    <div>
      Logged in as Alice
      <button>Logout</button>
    </div>
  );
  MockUserDetails.displayName = 'MockUserDetails';
  return MockUserDetails;
});

jest.mock('@/app/layout/navbar', () => {
  const MockNavbar = () => <nav data-testid='navbar'>Mock Navbar</nav>;
  MockNavbar.displayName = 'MockNavbar';
  return MockNavbar;
});

const whiteLabelValues = getWhiteLabelValues();

describe('Header tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header correctly', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'Alice' },
    });

    const component = await Header();
    const { container } = render(component);

    const header = screen.getByRole('banner');
    expect(header).toHaveAttribute('data-cy', 'header');

    const link = screen.getByRole('link', {
      name: new RegExp(`${whiteLabelValues.acronym} homepage`, 'i'),
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');

    expect(
      screen.getByText(new RegExp(`${whiteLabelValues.longName}`, 'i')),
    ).toBeInTheDocument();
    expect(screen.getByText(/Logged in as Alice/i)).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();

    await checkAccessibility(container);
  });
});
