import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import ChangeUserRole from '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/_components/changeUserRoleForm';
import { WhiteLabelEntry } from '@/config/whiteLabel';

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
    <div id='error-summary' tabIndex={-1}>
      {errors.map((e, idx) => (
        <div key={idx}>{e.errors_list[0]}</div>
      ))}
    </div>
  ),
}));

jest.mock('@/app/_components/role-selector/RoleSelector', () => ({
  __esModule: true,
  default: ({ errors }: { errors?: string[] }) => (
    <div>
      <label htmlFor='role-Analyst-input'>Role</label>
      {errors && errors.length > 0 && <span role='alert'>{errors[0]}</span>}
      <input id='role-Analyst-input' name='role' />
    </div>
  ),
}));

jest.mock('@/app/shared/submitButton', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button type='submit'>{children}</button>
  ),
}));

const mockUseFormState = require('react-dom').useFormState as jest.Mock;
const mockWhiteLabelValues: WhiteLabelEntry = {
  acronym: 'SDE',
  longName: 'Secure Data Environment',
};
const props = {
  changeUserRole: jest.fn(),
  whiteLabelValues: mockWhiteLabelValues,
};

describe('ChangeUserRoleForm tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields and heading', () => {
    mockUseFormState.mockReturnValue([{ errors: {} }, undefined]);

    render(<ChangeUserRole {...props} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Change user role' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Select a different role for this user.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Confirm role/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go back/i })).toBeInTheDocument();
  });

  it('renders error summary and error message when state.error is present', () => {
    mockUseFormState.mockReturnValue([
      { error: 'Role is required' },
      undefined,
    ]);

    render(<ChangeUserRole {...props} />);

    const errors = screen.getAllByText('Role is required');
    expect(errors.length).toBe(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Role is required');
    expect(
      screen.getByText('Select a different role for this user.'),
    ).toBeInTheDocument();
  });

  it('calls formAction on form submission', async () => {
    const formActionMock = jest.fn();
    mockUseFormState.mockReturnValue([{ errors: {} }, formActionMock]);

    render(<ChangeUserRole {...props} />);

    const button = screen.getByRole('button', { name: /Confirm role/i });
    fireEvent.click(button);
    expect(button).toBeEnabled();
  });

  it('focuses on error summary when error exists', () => {
    const focusMock = jest.fn();
    mockUseFormState.mockReturnValue([{ error: 'Some error' }, undefined]);

    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn().mockReturnValue({ focus: focusMock });

    render(<ChangeUserRole {...props} />);
    expect(focusMock).toHaveBeenCalled();

    document.getElementById = originalGetElementById;
  });
});
