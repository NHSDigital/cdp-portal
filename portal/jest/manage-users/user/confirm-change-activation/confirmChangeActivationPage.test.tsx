import { render, screen } from '@testing-library/react';
import * as React from 'react';

import ConfirmChangeActivationPage, {
  ConfirmChangeActivationProps,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/confirm-change-activation/_components/confirmChangeActivationPage';

import { getByDataCy } from '../../../utils';

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});

const mockUseActionState = React.useActionState as jest.Mock;
const mockUserName = 'Jane Doe';

const props: ConfirmChangeActivationProps = {
  usersFullName: mockUserName,
  userIsActive: false,
  changeActivation: jest.fn(),
  whiteLabelKey: 'SDE',
};

const errorMessage = 'Terrible error occurred';

describe('ConfirmChangeActivationPage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reactivation content when user is not active', () => {
    mockUseActionState.mockReturnValue([{ errors: {} }, undefined, false]);

    render(<ConfirmChangeActivationPage {...props} />);

    expect(screen.getByRole('link', { name: /Go back/ })).toHaveAttribute(
      'href',
      '.',
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: `Reactivate ${mockUserName}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Reactivated users will receive an email notification.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Users are charged the full standard fee for the month. For example, if you reactivate a user in June, they will be charged for the whole month of June.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: `Do you want to reactivate ${mockUserName}?`,
      }),
    ).toBeInTheDocument();

    const yesRadio = screen.getByRole('radio', { name: 'Yes' });
    expect(yesRadio).toBeInTheDocument();
    expect(yesRadio).toHaveAttribute('name', 'confirm');
    expect(yesRadio).toHaveAttribute('value', 'Yes');

    const noRadio = screen.getByRole('radio', { name: 'No' });
    expect(noRadio).toBeInTheDocument();
    expect(noRadio).toHaveAttribute('name', 'confirm');
    expect(noRadio).toHaveAttribute('value', 'No');

    expect(
      screen.getByRole('button', { name: 'Continue' }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('heading', {
        level: 1,
        name: `Deactivate ${mockUserName}`,
      }),
    ).not.toBeInTheDocument();
  });

  it('renders deactivation content when user is active', () => {
    mockUseActionState.mockReturnValue([{ errors: {} }, undefined, true]);
    props.userIsActive = true;

    render(<ConfirmChangeActivationPage {...props} />);

    expect(screen.getByRole('link', { name: /Go back/ })).toHaveAttribute(
      'href',
      '.',
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: `Deactivate ${mockUserName}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: `Do you want to deactivate ${mockUserName}?`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Deactivated users will receive an email notification.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Deactivated users are not charged for. However, if these users have been active at any time during an invoiced calendar month, the user will still be charged for as standard.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can reactivate a user that has been deactivated at any time.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Do you want to deactivate ${mockUserName}?`),
    ).toBeInTheDocument();

    const yesRadio = screen.getByRole('radio', { name: 'Yes' });
    expect(yesRadio).toBeInTheDocument();
    expect(yesRadio).toHaveAttribute('name', 'confirm');
    expect(yesRadio).toHaveAttribute('value', 'Yes');

    const noRadio = screen.getByRole('radio', { name: 'No' });
    expect(noRadio).toBeInTheDocument();
    expect(noRadio).toHaveAttribute('name', 'confirm');
    expect(noRadio).toHaveAttribute('value', 'No');

    expect(
      screen.getByRole('button', { name: 'Continue' }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('heading', {
        level: 1,
        name: `Reactivate ${mockUserName}`,
      }),
    ).not.toBeInTheDocument();
  });

  it('renders error summary when error is present in form state', () => {
    mockUseActionState.mockReturnValue([
      { error: errorMessage },
      jest.fn(),
      false,
    ]);

    render(<ConfirmChangeActivationPage {...props} />);

    const errors = screen.getAllByText(errorMessage);
    expect(errors.length).toBe(2);

    expect(getByDataCy('error-summary-link')).toHaveTextContent(errorMessage);
  });
});
