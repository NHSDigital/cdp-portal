import { render, screen } from '@testing-library/react';
import { cookies } from 'next/headers';

import getFilteredUsersInAgreement from '@/app/agreement/[agreement_id]/manage-users/_components/getFilteredUsersInAgreement';
import ManageUsersPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/page';
import { getFormattedTimestamp } from '@/app/shared/common';
import { CookieNames } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock('next/headers', () => ({
  __esModule: true,
  cookies: jest.fn(),
}));
jest.mock('next/link', () => {
  const MockLink = (props) => <a {...props} />;
  MockLink.displayName = 'MockLink';
  return MockLink;
});
jest.mock('@/config/whiteLabel', () => ({
  getWhiteLabelValues: jest.fn(),
}));

jest.mock('@/app/shared/backLink', () => {
  const MockBackLink = () => <div data-testid='mock-back-link'>Back</div>;
  MockBackLink.displayName = 'MockBackLink';
  return MockBackLink;
});

jest.mock('@/app/shared/common', () => ({
  getFormattedTimestamp: jest.fn(() => 'Formatted Timestamp'),
  NO_TIMESTAMP_TEXT: 'Never logged in',
}));

jest.mock('@/app/_components/status-tags/StatusTags', () => ({
  StatusTag: ({ status }) => <span data-testid='status-tag'>{status}</span>,
  WhatDoTheseStatusesMean: () => <div data-testid='status-info' />,
}));

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/_components/successBanner',
  () => {
    const MockSuccessBanner = (props) => (
      <div data-testid='success-banner'>{props.successMessage}</div>
    );
    MockSuccessBanner.displayName = 'MockSuccessBanner';
    return MockSuccessBanner;
  },
);

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/_components/filtersPane',
  () => {
    const MockFiltersPane = () => <div data-testid='filters-pane' />;
    MockFiltersPane.displayName = 'MockFiltersPane';
    return MockFiltersPane;
  },
);

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/_components/getFilteredUsersInAgreement',
  () => jest.fn(),
);

const usersMock = [
  {
    email: 'jane.doe@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    last_login: '2023-01-01T12:00:00Z',
    calculated_status: 'active',
  },
];

const agreementMock = {
  meaningful_name: 'Test Agreement',
};

describe('ManageUsersPage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      acronym: 'SDE',
    });
  });

  it('renders the full user page with all expected content', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: usersMock,
      agreement: agreementMock,
    });

    (cookies as jest.Mock).mockImplementation(() => ({
      get: (name: string) => {
        if (name === CookieNames.MANAGE_USERS_SUCCESS_MESSAGE) {
          return { name, value: 'User successfully added' };
        }
        return undefined;
      },
    }));

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-123' },
        searchParams: {},
      }),
    );

    expect(screen.getByText('Manage users')).toBeInTheDocument();
    expect(screen.getByText('Test Agreement')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
    expect(screen.getByText('users found')).toBeInTheDocument();
    expect(screen.getByTestId('success-banner')).toHaveTextContent(
      'User successfully added',
    );
    expect(screen.getByTestId('filters-pane')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Last logged in')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Formatted Timestamp')).toBeInTheDocument();
    expect(screen.getByTestId('status-tag')).toHaveTextContent('active');
    expect(screen.getByTestId('status-info')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Add a new user' }),
    ).toHaveAttribute('href', '/agreement/agreement-123/manage-users/add-user');
    const alertSpan = screen.getByRole('alert');
    expect(alertSpan).toHaveAttribute('aria-live', 'polite');
    expect(alertSpan).toHaveAttribute('aria-atomic', 'true');
  });

  it('correctly encodes user email in detail link', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: [
        {
          email: 'john.smith+test@example.com',
          first_name: 'John',
          last_name: 'Smith',
          last_login: '2023-01-01T12:00:00Z',
          calculated_status: 'active',
        },
      ],
      agreement: agreementMock,
    });

    (cookies as jest.Mock).mockReturnValue({ get: () => undefined });

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-enc' },
        searchParams: {},
      }),
    );

    const userLink = screen.getByRole('link', { name: 'John Smith' });
    expect(userLink).toHaveAttribute(
      'href',
      '/agreement/agreement-enc/manage-users/user/john.smith+test@example.com',
    );
  });

  it('renders NoResultsFound when there are no users', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: [],
      agreement: agreementMock,
    });

    (cookies as jest.Mock).mockReturnValue({ get: () => undefined });

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-123' },
        searchParams: {},
      }),
    );

    expect(screen.getByText('0 results found')).toBeInTheDocument();
    expect(screen.getByText('Try:')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'contact us' })).toHaveAttribute(
      'href',
      'https://digital.nhs.uk/about-nhs-digital/contact-us',
    );

    expect(
      screen.getByText(
        'checking if the name or email address has been spelt correctly',
      ),
    ).toBeInTheDocument();

    expect(screen.getByText('clearing your filters')).toBeInTheDocument();
  });

  it('falls back to agreement_id if agreement meaningful_name is not provided', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: usersMock,
      agreement: {},
    });

    (cookies as jest.Mock).mockImplementation(() => ({
      get: () => undefined,
    }));

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-456' },
        searchParams: {},
      }),
    );

    expect(screen.getByText('agreement-456')).toBeInTheDocument();
  });

  it('renders visually hidden message when user has never logged in', async () => {
    (getFormattedTimestamp as jest.Mock).mockImplementation(
      () => 'Never logged in',
    );

    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: [
        {
          email: 'no.login@example.com',
          first_name: 'No',
          last_name: 'Login',
          last_login: 'never-logged-in',
          calculated_status: 'inactive',
        },
      ],
      agreement: agreementMock,
    });

    (cookies as jest.Mock).mockImplementation(() => ({
      get: () => undefined,
    }));

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-789' },
        searchParams: {},
      }),
    );

    const matches = screen.getAllByText('Never logged in');
    expect(matches).toHaveLength(2);
  });

  it('does not render success banner when success cookie is not present', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: usersMock,
      agreement: agreementMock,
    });

    (cookies as jest.Mock).mockImplementation(() => ({
      get: () => undefined,
    }));

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-321' },
        searchParams: {},
      }),
    );

    expect(screen.queryByTestId('success-banner')).not.toBeInTheDocument();
  });

  it('returns correct metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: 'Manage users - SDE',
    });
  });

  it('renders multiple users correctly', async () => {
    const multipleUsers = [
      ...usersMock,
      {
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        last_login: '2023-02-02T10:00:00Z',
        calculated_status: 'pending',
      },
    ];
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: multipleUsers,
      agreement: agreementMock,
    });
    (cookies as jest.Mock).mockReturnValue({ get: () => undefined });
    (getFormattedTimestamp as jest.Mock).mockReturnValue('Formatted Timestamp');

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-999' },
        searchParams: {},
      }),
    );

    multipleUsers.forEach((user) => {
      expect(
        screen.getByText(`${user.first_name} ${user.last_name}`),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText('Formatted Timestamp').length,
      ).toBeGreaterThanOrEqual(multipleUsers.length);
      expect(
        screen
          .getAllByTestId('status-tag')
          .some((el) => el.textContent === user.calculated_status),
      ).toBeTruthy();
    });
  });

  it('renders the BackLink component', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: usersMock,
      agreement: agreementMock,
    });
    (cookies as jest.Mock).mockReturnValue({ get: () => undefined });

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-123' },
        searchParams: {},
      }),
    );

    expect(screen.getByTestId('mock-back-link')).toBeInTheDocument();
    expect(screen.getByTestId('mock-back-link')).toHaveTextContent('Back');
  });

  it('renders filters pane with correct test id', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: usersMock,
      agreement: agreementMock,
    });
    (cookies as jest.Mock).mockReturnValue({ get: () => undefined });

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-123' },
        searchParams: {},
      }),
    );

    expect(screen.getByTestId('filters-pane')).toBeInTheDocument();
  });

  it('success banner updates based on cookie value change', async () => {
    const cookieMock = jest.fn();
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: usersMock,
      agreement: agreementMock,
    });

    cookieMock.mockReturnValue({
      name: CookieNames.MANAGE_USERS_SUCCESS_MESSAGE,
      value: 'Initial success',
    });
    (cookies as jest.Mock).mockImplementation(() => ({ get: cookieMock }));

    const { rerender } = render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-555' },
        searchParams: {},
      }),
    );

    expect(screen.getByTestId('success-banner')).toHaveTextContent(
      'Initial success',
    );

    cookieMock.mockReturnValue(undefined);
    (cookies as jest.Mock).mockImplementation(() => ({ get: cookieMock }));

    rerender(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-555' },
        searchParams: {},
      }),
    );

    expect(screen.queryByTestId('success-banner')).not.toBeInTheDocument();
  });

  it('handles getFormattedTimestamp returning unexpected values gracefully', async () => {
    (getFormattedTimestamp as jest.Mock).mockImplementation(() => '');

    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: usersMock,
      agreement: agreementMock,
    });

    (cookies as jest.Mock).mockReturnValue({ get: () => undefined });

    render(
      await ManageUsersPage({
        params: { agreement_id: 'agreement-123' },
        searchParams: {},
      }),
    );

    const lastLoginCell = screen.getAllByRole('cell')[1];
    expect(lastLoginCell).toBeInTheDocument();
    expect(lastLoginCell.textContent).toBe('');
  });
});
