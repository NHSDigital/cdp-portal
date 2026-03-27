import { render, screen } from '@testing-library/react';
import { cookies } from 'next/headers';

import userDetailsPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/page';
import getAgreementUserDetails from '@/app/services/getAgreementUserDetails';
import { CookieNames, NATIONAL_SERVICE_DESK_EMAIL } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock('app/services/getAgreementUserDetails');
jest.mock('@/config/whiteLabel', () => ({
  getWhiteLabelValues: jest.fn(),
}));
jest.mock('@/app/_components/status-tags/StatusTags', () => ({
  StatusTag: ({ status }) => <span data-testid='status-tag'>{status}</span>,
  WhatDoTheseStatusesMean: () => <div data-testid='status-info' />,
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('helpers/logging/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
  }),
}));
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/user/[user]/_components/UserDescriptionList',
  () => {
    const UserDescriptionList = () => <div data-testid='UserDescriptionList' />;
    UserDescriptionList.displayName = 'UserDescriptionList';
    return UserDescriptionList;
  },
);

jest.mock('@/app/shared/backLink', () => {
  const BackLink = () => <div data-testid='BackLink' />;
  BackLink.displayName = 'BackLink';
  return BackLink;
});

describe('userDetailsPage tests', () => {
  const mockUserDetails = {
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice@test.com',
    status: 'ACTIVE',
  };

  const agreement_id = '123';
  const user = encodeURIComponent('alice@test.com');

  beforeEach(() => {
    (getAgreementUserDetails as jest.Mock).mockResolvedValue(mockUserDetails);
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    });
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      acronym: 'SDE',
    });
  });

  it('renders the user full name and support email', async () => {
    const Page = await userDetailsPage({ params: { agreement_id, user } });
    render(Page);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText(NATIONAL_SERVICE_DESK_EMAIL)).toBeInTheDocument();
    expect(screen.getByTestId('BackLink')).toBeInTheDocument();
    expect(screen.getByTestId('UserDescriptionList')).toBeInTheDocument();
    expect(screen.getByTestId('status-info')).toBeInTheDocument();
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
