import { render, screen, within } from '@testing-library/react';
import { cookies } from 'next/headers';
import { usePathname, useSearchParams } from 'next/navigation';

import getFilteredUsersInAgreement from '@/app/agreement/[agreement_id]/manage-users/_components/getFilteredUsersInAgreement';
import ManageUsersPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/page';
import { CookieNames } from '@/config/constants';
import { createMockUser } from '@/jest/testFactories';
import { getByDataCy, queryByDataCy } from '@/jest/utils';

jest.mock('next/headers', () => ({
  __esModule: true,
  cookies: jest.fn(),
}));
jest.mock('next/link', () => {
  const MockLink = (props) => <a {...props} />;
  MockLink.displayName = 'MockLink';
  return MockLink;
});
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({})),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/_components/getFilteredUsersInAgreement',
  () => jest.fn(),
);

const usersMock = [
  createMockUser({
    email: 'jane.doe@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    last_login: '2023-01-01T12:00:00Z',
    calculated_status: 'Activated',
  }),
  createMockUser({
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    last_login: '1998-05-18T12:00:00Z',
    calculated_status: 'Deactivated',
  }),
  createMockUser({
    email: 'horatio.jones@example.com',
    first_name: 'Horatio',
    last_name: 'Jones',
    last_login: '1963-12-27T11:00:00Z',
    calculated_status: 'Pending Induction',
  }),
];

const agreementMock = {
  meaningful_name: 'Test Agreement',
};

const params = { agreement_id: 'agreement-123' };

describe('ManageUsersPage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/some-path');
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('?foo=bar'),
    );
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
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: `${CookieNames.MANAGE_USERS_SUCCESS_MESSAGE}=Test success message`,
    });

    render(
      await ManageUsersPage({
        params,
        searchParams: {},
      }),
    );

    // back link
    expect(getByDataCy('go-back-link')).toBeInTheDocument();
    expect(getByDataCy('go-back-link')).toHaveTextContent('Go back');
    expect(getByDataCy('go-back-link')).toHaveAttribute('href', '.');

    //heading and agreement name
    expect(screen.getByText('Manage users')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(getByDataCy('agreement_name')).toBeInTheDocument();
    expect(getByDataCy('agreement_name')).toHaveTextContent('Test Agreement');
    expect(screen.getByText('users found')).toBeInTheDocument();

    // add user button
    expect(
      screen.getByRole('link', { name: 'Add a new user' }),
    ).toHaveAttribute('href', '/agreement/agreement-123/manage-users/add-user');

    // success banner
    expect(screen.getByText('User successfully added')).toBeInTheDocument();

    // filters pane
    expect(
      screen.getByRole('heading', { name: /Filters/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Search by name or email/ }),
    ).toBeInTheDocument();
    expect(document.getElementById('user-search-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/ })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Role/ })).toBeInTheDocument();
    expect(
      document.querySelector('label[for="role-analyst-input"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('label[for="role-user-manager-input"]'),
    ).toBeTruthy();
    expect(document.querySelector('label[for="role-both-input"]')).toBeTruthy();
    expect(
      screen
        .getAllByRole('checkbox')
        .find((input) => (input as HTMLInputElement).value === 'analyst'),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('checkbox')
        .find((input) => (input as HTMLInputElement).value === 'user-manager'),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('checkbox')
        .find((input) => (input as HTMLInputElement).value === 'both'),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Status/ })).toBeInTheDocument();
    expect(
      document.getElementById('status-activated-input'),
    ).toBeInTheDocument();
    expect(
      document.getElementById('status-deactivated-input'),
    ).toBeInTheDocument();
    expect(
      document.getElementById('status-pending-induction-input'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('label[for="status-activated-input"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('label[for="status-deactivated-input"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('label[for="status-pending-induction-input"]'),
    ).toBeTruthy();
    expect(
      screen
        .getAllByRole('checkbox')
        .find((input) => (input as HTMLInputElement).value === 'activated'),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('checkbox')
        .find((input) => (input as HTMLInputElement).value === 'deactivated'),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('checkbox')
        .find(
          (input) => (input as HTMLInputElement).value === 'pending-induction',
        ),
    ).toBeInTheDocument();

    // // table and contents
    const tableScope = within(getByDataCy('user-table'));
    expect(
      tableScope.getByRole('columnheader', { name: /Name/ }),
    ).toBeInTheDocument();
    expect(
      tableScope.getByRole('columnheader', { name: /Last logged in/ }),
    ).toBeInTheDocument();
    expect(
      tableScope.getByRole('columnheader', { name: /Status/i }),
    ).toBeInTheDocument();
    expect(
      tableScope.getByRole('row', {
        name: /Jane Doe 1 January 2023 ACTIVATED/,
      }),
    ).toBeInTheDocument();
    expect(
      tableScope.getByRole('row', { name: /John Doe 18 May 1998 DEACTIVATED/ }),
    ).toBeInTheDocument();
    expect(
      tableScope.getByRole('row', {
        name: /Horatio Jones 27 December 1963 PENDING\s+INDUCTION/,
      }),
    ).toBeInTheDocument();
    expect(
      within(tableScope.getByRole('row', { name: /Jane Doe/i })).getByRole(
        'link',
        { name: /Jane Doe/ },
      ),
    ).toHaveAttribute(
      'href',
      '/agreement/agreement-123/manage-users/user/jane.doe@example.com',
    );
    expect(
      within(tableScope.getByRole('row', { name: /John Doe/i })).getByRole(
        'link',
        { name: /John Doe/ },
      ),
    ).toHaveAttribute(
      'href',
      '/agreement/agreement-123/manage-users/user/john.doe@example.com',
    );
    expect(
      within(tableScope.getByRole('row', { name: /Horatio Jones/i })).getByRole(
        'link',
        { name: /Horatio Jones/ },
      ),
    ).toHaveAttribute(
      'href',
      '/agreement/agreement-123/manage-users/user/horatio.jones@example.com',
    );

    expect(
      screen.getByText('What do these statuses mean?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Expand to see')).toBeInTheDocument();
    const status_table = within(getByDataCy('status_key_table'));
    expect(
      status_table.getByRole('columnheader', { name: /Status/ }),
    ).toBeInTheDocument();
    expect(
      status_table.getByRole('columnheader', { name: /Description/ }),
    ).toBeInTheDocument();
    expect(
      status_table.getByRole('row', {
        name: /ACTIVATED User has access to the SDE./,
      }),
    ).toBeInTheDocument();
    expect(
      status_table.getByRole('row', {
        name: /DEACTIVATED User account is temporarily closed but can be reactivated at any time./,
      }),
    ).toBeInTheDocument();
    expect(
      status_table.getByRole('row', {
        name: /PENDING\s+INDUCTION User has been sent induction assessment invite email but has not yet passed the assessment./,
      }),
    ).toBeInTheDocument();
  });

  it('correctly encodes user email in detail link', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: [
        createMockUser({
          email: 'john.smith+test@example.com',
          first_name: 'John',
          last_name: 'Smith',
          last_login: '2023-01-01T12:00:00Z',
          calculated_status: 'Activated',
        }),
      ],
      agreement: agreementMock,
    });

    (cookies as jest.Mock).mockReturnValue({ get: () => undefined });

    render(
      await ManageUsersPage({
        params,
        searchParams: {},
      }),
    );

    const userLink = screen.getByRole('link', { name: 'John Smith' });
    expect(userLink).toHaveAttribute(
      'href',
      '/agreement/agreement-123/manage-users/user/john.smith+test@example.com',
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
        params,
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
        params,
        searchParams: {},
      }),
    );

    expect(screen.getByText('agreement-123')).toBeInTheDocument();
  });

  it('renders visually hidden message when user has never logged in', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: [
        createMockUser({
          email: 'no.login@example.com',
          first_name: 'No',
          last_name: 'Login',
          last_login: undefined,
          calculated_status: 'Deactivated',
        }),
      ],
      agreement: agreementMock,
    });

    (cookies as jest.Mock).mockImplementation(() => ({
      get: () => undefined,
    }));

    render(
      await ManageUsersPage({
        params,
        searchParams: {},
      }),
    );

    expect(screen.getByText('Never logged in')).toBeInTheDocument();
    expect(screen.getByText('Never logged in')).toHaveClass(
      'nhsuk-u-visually-hidden',
    );
    expect(screen.getByText('-')).toBeInTheDocument();
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
        params,
        searchParams: {},
      }),
    );

    expect(queryByDataCy('success-message')).not.toBeInTheDocument();
  });

  it('returns correct metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: 'Manage users - SDE',
    });
  });

  it('success banner updates based on cookie value change', async () => {
    (getFilteredUsersInAgreement as jest.Mock).mockResolvedValue({
      users: usersMock,
      agreement: agreementMock,
    });

    (cookies as jest.Mock).mockImplementation(() => ({
      get: (name: string) => {
        if (name === CookieNames.MANAGE_USERS_SUCCESS_MESSAGE) {
          return { name, value: 'Initial success' };
        }
        return undefined;
      },
    }));
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: `${CookieNames.MANAGE_USERS_SUCCESS_MESSAGE}=Test success message`,
    });

    const { rerender } = render(
      await ManageUsersPage({
        params,
        searchParams: {},
      }),
    );

    expect(screen.getByText('Initial success')).toBeInTheDocument();

    (cookies as jest.Mock).mockImplementation(() => ({
      get: () => undefined,
    }));

    rerender(
      await ManageUsersPage({
        params,
        searchParams: {},
      }),
    );

    expect(queryByDataCy('success-message')).not.toBeInTheDocument();
  });
});
