import { render, screen } from '@testing-library/react';
import * as React from 'react';

import changeUserRole from '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/_components/serverActions';
import ChangeRolePage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/page';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/_components/serverActions',
);
jest.mock('@/config/whiteLabel');
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});

describe('ChangeRolePage tests', () => {
  const baseProps = {
    agreement_id: 'pumpkin123',
    user: 'alice@test.com',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      longName: 'Secure Data Environment',
      acronym: 'SDE',
    });
    (changeUserRole as jest.Mock).mockResolvedValue(undefined);
    (React.useActionState as jest.Mock).mockImplementation(
      (_action, initialState) => {
        return [initialState, jest.fn(), false];
      },
    );
  });

  it('renders the form with legend, hints, RoleSelector, and submit button', async () => {
    const element = await ChangeRolePage({
      params: Promise.resolve(baseProps),
    });
    render(element);

    expect(
      screen.getByRole('heading', { name: /Change user role/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Select a different role for this user.'),
    ).toBeInTheDocument();

    const analyst = document.getElementById('role-Analyst-description');
    expect(analyst).toHaveTextContent(
      'User can access data through the SDE platform. These users will be charged',
    );
    expect(analyst).toHaveTextContent('£435 a month');
    expect(analyst).toHaveTextContent('per agreement.');
    expect(analyst).toHaveTextContent('The price will increase to ');
    expect(analyst).toHaveTextContent('£472 a month');
    expect(analyst).toHaveTextContent('per agreement from ');
    expect(analyst).toHaveTextContent('1 April 2026.');
    const userManager = document.getElementById('role-UserManager-description');
    expect(userManager).toHaveTextContent(
      'User can add and manage other users on the SDE platform. User Managers are',
    );
    expect(userManager).toHaveTextContent('not charged.');

    const both = document.getElementById('role-Both-description');
    expect(both).toHaveTextContent(
      'User can access data and manage other users on the SDE platform. These users will be charged',
    );
    expect(both).toHaveTextContent('£435 a month');
    expect(both).toHaveTextContent('per agreement.');
    expect(analyst).toHaveTextContent('The price will increase to ');
    expect(analyst).toHaveTextContent('£472 a month');
    expect(analyst).toHaveTextContent('per agreement from ');
    expect(analyst).toHaveTextContent('1 April 2026.');

    expect(screen.getByRole('radio', { name: /Analyst/ })).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /User Manager/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Both/ })).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Confirm role/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go back/ })).toHaveAttribute(
      'href',
      '.',
    );
  });

  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Change user role - ${whiteLabelValues.acronym}`,
    );
  });
});
