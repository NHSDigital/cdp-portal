import { render, screen, within } from '@testing-library/react';
import { cookies } from 'next/headers';

import userDetailsPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/page';
import getAgreementUserDetails from '@/app/services/getAgreementUserDetails';
import { CookieNames, NATIONAL_SERVICE_DESK_EMAIL } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import { createMockUser } from '@/jest/testFactories';

import { checkAccessibility, getByDataCy } from '../../utils';

jest.mock('@/app/services/getAgreementUserDetails');
jest.mock('@/config/whiteLabel');
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('helpers/logging/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
  }),
}));

const mockUserDetails = createMockUser({
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice@test.com',
  application_roles_agreement: ['Analyst'],
  induction: { passed: true, passed_timestamp: '2024-01-02' },
});

const agreement_id = 'cinnamon123';
const user = encodeURIComponent('alice@test.com');

describe('userDetailsPage integration tests', () => {
  beforeEach(() => {
    (getAgreementUserDetails as jest.Mock).mockResolvedValue(mockUserDetails);
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    });
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      acronym: 'SDE',
      longName: 'Secure Data Environment',
    });
  });

  it('renders the page content correctly', async () => {
    const { container } = render(
      await await userDetailsPage({ params: { agreement_id, user } }),
    );

    expect(screen.getByText('Go back')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Alice Smith',
    );
    const contact_us = screen
      .getByText(/To update this user's name/i)
      .closest('p');
    expect(contact_us).toHaveTextContent(
      `To update this user's name or email address, contact support at ${NATIONAL_SERVICE_DESK_EMAIL}.`,
    );
    expect(screen.getByText('Status', { selector: 'dt' })).toBeInTheDocument();
    const statusCell = getByDataCy('status');
    expect(within(statusCell).getByText('ACTIVATED')).toBeInTheDocument();
    const changeActivationButton = screen.getByText('Deactivate user');
    expect(changeActivationButton).toBeInTheDocument();
    expect(changeActivationButton).toHaveAttribute(
      'href',
      `/agreement/${agreement_id}/manage-users/user/alice@test.com/confirm-change-activation`,
    );

    expect(screen.getByText('Email address')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();

    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Data Analyst')).toBeInTheDocument();
    const changeRoleLink = screen.getByText('Change role');
    expect(changeRoleLink).toBeInTheDocument();
    expect(changeRoleLink).toHaveAttribute(
      'href',
      `/agreement/${agreement_id}/manage-users/user/alice@test.com/change-role`,
    );

    expect(screen.getByText('VDI memory size')).toBeInTheDocument();
    expect(screen.getByText('32 GB')).toBeInTheDocument();

    expect(screen.getByText('Added to agreement')).toBeInTheDocument();
    expect(screen.getByText('1 January 2024')).toBeInTheDocument();

    expect(screen.getByText('Induction assessment passed')).toBeInTheDocument();
    expect(screen.getByText('2 January 2024')).toBeInTheDocument();

    expect(screen.getByText('Last logged in')).toBeInTheDocument();
    expect(screen.getByText('1 June 2024')).toBeInTheDocument();

    expect(screen.getByText('Reactivated')).toBeInTheDocument();
    expect(screen.getByText('1 May 2024')).toBeInTheDocument();

    const statusTable = getByDataCy('status_key_table');
    expect(statusTable).toBeInTheDocument();
    expect(statusTable).toHaveTextContent('Status');
    expect(statusTable).toHaveTextContent('Description');
    expect(statusTable).toHaveTextContent('ACTIVATED');
    expect(statusTable).toHaveTextContent('User has access to the SDE');
    expect(statusTable).toHaveTextContent('DEACTIVATED');
    expect(statusTable).toHaveTextContent('User account is temporarily closed');
    expect(statusTable).toHaveTextContent('PENDING INDUCTION');
    expect(statusTable).toHaveTextContent(
      'User has been sent induction assessment',
    );

    checkAccessibility(container);
  });

  it('renders the success banner if the cookie is present', async () => {
    const successMessage = 'User successfully updated';
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue({
        name: CookieNames.MANAGE_USERS_SUCCESS_MESSAGE,
        value: successMessage,
      }),
    });

    const Page = await userDetailsPage({ params: { agreement_id, user } });
    render(Page);

    const banner = await screen.findByTestId('success-banner');
    expect(banner).toHaveTextContent(successMessage);
  });

  it('does not render the success banner if the cookie is not present', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const Page = await userDetailsPage({ params: { agreement_id, user } });
    render(Page);

    expect(screen.queryByTestId('SuccessBanner')).not.toBeInTheDocument();
  });

  it('returns correct metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: 'User details - SDE',
    });
  });
});
