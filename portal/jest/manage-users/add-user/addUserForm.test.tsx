import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import AddUserForm, {
  AddUserFormProps,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/_components/addUserForm';
import { WhiteLabelEntry } from '@/config/whiteLabel';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormState: jest.fn(),
}));

const mockUseFormState = require('react-dom').useFormState as jest.Mock;
const mockWhiteLabelValues: WhiteLabelEntry = {
  acronym: 'SDE',
  longName: 'Secure Data Environment',
};
const props: AddUserFormProps = {
  agreement_id: 'test-agreement',
  form_id: 'form123',
  user_id: 'user456',
  addUserAction: {},
  whiteLabelValues: mockWhiteLabelValues,
};
describe('AddUserForm tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields and heading', () => {
    mockUseFormState.mockReturnValue([{ errors: {} }, undefined]);

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
    mockUseFormState.mockReturnValue([{ errors: {} }, undefined]);

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
    mockUseFormState.mockReturnValue([{ errors: {} }, undefined]);

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
    mockUseFormState.mockReturnValue([{ errors: {} }, undefined]);
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
    mockUseFormState.mockReturnValue([
      {
        errors: {
          first_name: ['Required'],
        },
      },
      undefined,
    ]);

    render(<AddUserForm {...props} />);

    expect(focusMock).toHaveBeenCalled();
  });

  it('adds error class to role fieldset when role_errors are present', () => {
    mockUseFormState.mockReturnValue([
      {
        errors: {
          role: ['Role is required'],
        },
      },
      undefined,
    ]);

    render(<AddUserForm {...props} />);

    const roleFieldset = screen.getByRole('group', { name: /Role/i });

    expect(roleFieldset.parentElement).toHaveClass('nhsuk-form-group--error');
  });
});
