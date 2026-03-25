import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import AddUserForm, {
  AddUserFormProps,
  AddUserFormState,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/_components/addUserForm';
import { WhiteLabelEntry } from '@/config/whiteLabel';

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});

const mockUseActionState = React.useActionState as jest.Mock;
const mockWhiteLabelValues: WhiteLabelEntry = {
  acronym: 'SDE',
  longName: 'Secure Data Environment',
};
const mockAddUserAction = jest.fn(
  (state: AddUserFormState, _formData: FormData) => state,
);

const props: AddUserFormProps = {
  agreement_id: 'test-agreement',
  form_id: 'form123',
  user_id: 'user456',
  addUserAction: mockAddUserAction,
  whiteLabelValues: mockWhiteLabelValues,
};
describe('AddUserForm tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields and heading', () => {
    mockUseActionState.mockReturnValue([{ errors: {} }, undefined, false]);

    render(<AddUserForm {...props} />);

    expect(
      screen.getByRole('heading', { name: /^Add a new user/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^First name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm their email/i)).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('sets backlink href to default if no sessionStorage data', async () => {
    mockUseActionState.mockReturnValue([{ errors: {} }, undefined, false]);

    jest
      .spyOn(window.sessionStorage.__proto__, 'getItem')
      .mockReturnValue(null);

    render(<AddUserForm {...props} />);

    const backlink = screen.getByRole('link', { name: /Back/i });
    await waitFor(() => {
      expect(backlink).toHaveAttribute(
        'href',
        '/agreement/test-agreement/manage-users',
      );
    });
  });

  it('updates backlink href if sessionStorage contains form data', async () => {
    mockUseActionState.mockReturnValue([{ errors: {} }, undefined, false]);

    jest
      .spyOn(window.sessionStorage.__proto__, 'getItem')
      .mockImplementation(() =>
        JSON.stringify({
          'test-agreement': {
            form123: {},
          },
        }),
      );

    render(<AddUserForm {...props} />);

    const backlink = screen.getByRole('link', { name: /Back/i });

    await waitFor(() => {
      expect(backlink).toHaveAttribute(
        'href',
        '/agreement/test-agreement/manage-users/add-user/confirm?form_id=form123',
      );
    });
  });

  it('prefills input values if user data exists in sessionStorage', () => {
    mockUseActionState.mockReturnValue([{ errors: {} }, undefined, false]);
    const userData = {
      'test-agreement': {
        form123: {
          user456: {
            first_name: 'Alice',
            last_name: 'Smith',
            email: 'alice@example.com',
            role: 'Analyst',
          },
        },
      },
    };

    jest
      .spyOn(window.sessionStorage.__proto__, 'getItem')
      .mockReturnValue(JSON.stringify(userData));

    const setAttributeMock = jest.fn();
    const clickMock = jest.fn();

    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id.endsWith('-input')) {
        return {
          setAttribute: setAttributeMock,
          click: clickMock,
        } as Partial<HTMLElement> as HTMLElement;
      }
      return null;
    });

    render(<AddUserForm {...props} />);

    expect(setAttributeMock).toHaveBeenCalledWith('value', 'Alice');
    expect(setAttributeMock).toHaveBeenCalledWith('value', 'Smith');
    expect(setAttributeMock).toHaveBeenCalledWith('value', 'alice@example.com');
    expect(clickMock).toHaveBeenCalled();
  });

  it('focuses error summary when errors are present', () => {
    const focusMock = jest.fn();
    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'error-summary') {
        return { focus: focusMock } as Partial<HTMLElement> as HTMLElement;
      }
      return null;
    });
    mockUseActionState.mockReturnValue([
      {
        errors: {
          first_name: ['Required'],
        },
      },
      undefined,
      false,
    ]);

    render(<AddUserForm {...props} />);

    expect(focusMock).toHaveBeenCalled();
  });

  it('adds error class to role fieldset when role_errors are present', () => {
    mockUseActionState.mockReturnValue([
      {
        errors: {
          role: ['Role is required'],
        },
      },
      undefined,
      false,
    ]);

    render(<AddUserForm {...props} />);

    const roleFieldset = screen.getByRole('group', { name: /Role/i });

    expect(roleFieldset.parentElement).toHaveClass('nhsuk-form-group--error');
  });

  it('renders confirm error in ErrorSummary when confirm_errors exist', () => {
    mockUseActionState.mockReturnValue([
      { errors: { confirm: 'Please confirm' } },
      undefined,
      false,
    ]);

    const focusMock = jest.fn();
    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'error-summary') {
        return { focus: focusMock } as Partial<HTMLElement> as HTMLElement;
      }
      return null;
    });

    render(<AddUserForm {...props} />);

    // confirm_errors should be added to error summary
    expect(screen.getByText('Please confirm')).toBeInTheDocument();
    expect(focusMock).toHaveBeenCalled();
  });

  it('renders role fieldset without error class when no role_errors', () => {
    mockUseActionState.mockReturnValue([{ errors: {} }, undefined, false]);
    render(<AddUserForm {...props} />);

    const roleFieldset = screen.getByRole('group', { name: /Role/i });
    expect(roleFieldset.parentElement).not.toHaveClass(
      'nhsuk-form-group--error',
    );
  });

  it('does not prefill inputs if user data is missing in sessionStorage', async () => {
    mockUseActionState.mockReturnValue([{ errors: {} }, undefined, false]);

    jest.spyOn(window.sessionStorage.__proto__, 'getItem').mockReturnValue(
      JSON.stringify({
        'test-agreement': {
          form123: {},
        },
      }),
    );

    const setAttributeMock = jest.fn();
    const clickMock = jest.fn();

    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id.endsWith('-input')) {
        return {
          setAttribute: setAttributeMock,
          click: clickMock,
          focus: jest.fn(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      }
      if (id === 'error-summary') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { focus: jest.fn() } as any;
      }
      return null;
    });

    render(<AddUserForm {...props} />);

    expect(setAttributeMock).not.toHaveBeenCalled();
    expect(clickMock).not.toHaveBeenCalled();

    // Ensure backlink still points to confirm page (if form exists)
    const backlink = screen.getByRole('link', { name: /Back/i });
    expect(backlink).toHaveAttribute(
      'href',
      '/agreement/test-agreement/manage-users/add-user/confirm?form_id=form123',
    );
  });
});
