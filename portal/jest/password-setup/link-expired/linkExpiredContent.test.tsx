import { render, screen } from '@testing-library/react';
import * as React from 'react';

import LinkExpiredContent from '@/app/(password-setup)/link-expired/_components/LinkExpiredContent';

import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '../../../config/constants';
import { getByDataCy, queryByDataCy } from '../../utils';

const mockFormAction = jest.fn();
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});
jest.mock('app/shared/submitButtonClient', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button type='submit'>{children}</button>
  ),
}));
jest.mock(
  '@/app/(password-setup)/link-expired/_components/serverActions',
  () => ({
    ...jest.requireActual(
      '@/app/(password-setup)/link-expired/_components/serverActions',
    ),
    invokeResendEmail: jest.fn(),
  }),
);

describe('LinkExpiredContent tests', () => {
  const email = 'testy@test.com';

  beforeEach(() => {
    jest.clearAllMocks();
    (React.useActionState as jest.Mock).mockImplementation(
      (_action, initialState) => {
        return [initialState, jest.fn(), false];
      },
    );
  });

  it('renders content correctly', () => {
    render(<LinkExpiredContent email={email} />);

    expect(screen.getByRole('heading')).toHaveTextContent('Setup link expired');
    expect(
      screen.getByText('The link to set up your account has expired.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can request a new link. The link in the email will be valid for 24 hours.',
      ),
    ).toBeInTheDocument();
    const emailLink = screen.getByRole('link', {
      name: NATIONAL_SERVICE_DESK_EMAIL,
    });
    expect(emailLink).toHaveAttribute(
      'href',
      `mailto:${NATIONAL_SERVICE_DESK_EMAIL}`,
    );
    expect(
      screen.getByText(
        new RegExp(`or call ${NATIONAL_SERVICE_DESK_TELEPHONE}`, 'i'),
      ),
    ).toBeInTheDocument();
    const hiddenInput = screen.getByDisplayValue(email);
    expect(hiddenInput).toHaveAttribute('type', 'hidden');
    expect(hiddenInput).toHaveAttribute('name', 'email');
    expect(
      screen.getByRole('button', { name: 'Request a new link' }),
    ).toBeInTheDocument();
    expect(queryByDataCy('success-banner')).not.toBeInTheDocument();
  });

  it('shows the SuccessBanner when success is true', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { success: true },
      mockFormAction,
    ]);

    render(<LinkExpiredContent email={email} />);

    const banner = getByDataCy('success-message');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Your email has been resent');
  });
});
