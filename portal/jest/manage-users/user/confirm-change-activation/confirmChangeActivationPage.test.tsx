'use client';

import { render, screen } from '@testing-library/react';
import React from 'react';

import ConfirmChangeActivationPage, {
  ConfirmChangeActivationProps,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/confirm-change-activation/_components/confirmChangeActivationPage';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormState: jest.fn(),
}));

jest.mock('@/app/shared/backLink', () => ({
  __esModule: true,
  default: ({ href }: { href: string }) => (
    <a href={href} data-cy='go-back-link'>
      Go back
    </a>
  ),
}));
jest.mock('@/app/shared/errorSummary', () => ({
  __esModule: true,
  default: ({
    errors,
  }: {
    errors: { input_id: string; errors_list: string[] }[];
  }) => (
    <div data-testid='error-summary' tabIndex={-1}>
      {errors.map((e, idx) => (
        <div key={idx}>{e.errors_list[0]}</div>
      ))}
    </div>
  ),
}));
jest.mock('@/app/shared/formFields', () => ({
  RadioButtonInputField: jest.fn(() => <div data-testid='test-radio' />),
}));
jest.mock('@/app/shared/submitButton', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button type='submit'>{children}</button>
  ),
}));

const mockUseFormState = require('react-dom').useFormState as jest.Mock;
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
    mockUseFormState.mockReturnValue([{ errors: {} }, undefined]);

    render(<ConfirmChangeActivationPage {...props} />);

    expect(
      screen.getAllByText(`Do you want to reactivate ${mockUserName}?`)[0],
    ).toBeInTheDocument();
    const radios = screen.getAllByTestId('test-radio');
    expect(radios.length).toBe(2);
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
      screen.getByText(/Users are charged the full standard fee for the month/),
    ).toBeInTheDocument();
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
    mockUseFormState.mockReturnValue([{ errors: {} }, undefined]);
    props.userIsActive = true;

    render(<ConfirmChangeActivationPage {...props} />);

    expect(
      screen.getAllByText(`Do you want to deactivate ${mockUserName}?`)[0],
    ).toBeInTheDocument();

    const radios = screen.getAllByTestId('test-radio');
    expect(radios.length).toBe(2);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: `Deactivate ${mockUserName}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Deactivated users will receive an email notification.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Deactivated users are not charged for/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can reactivate a user that has been deactivated at any time.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Do you want to deactivate ${mockUserName}?`),
    ).toBeInTheDocument();

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
    mockUseFormState.mockReturnValue([{ error: errorMessage }, undefined]);

    render(<ConfirmChangeActivationPage {...props} />);

    const errors = screen.getAllByText(errorMessage);
    expect(errors.length).toBe(2);

    expect(screen.getByTestId('error-summary')).toHaveTextContent(errorMessage);
  });
});
