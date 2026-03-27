import { fireEvent, render, screen } from '@testing-library/react';

import AcceptAndConfirmForm, {
  AcceptAndConfirmFormProps,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/acceptAndConfirmForm';

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/confirmationCheckbox',
  () => ({
    __esModule: true,
    default: ({ errors, label, name }) => (
      <div data-testid='confirmation-checkbox'>
        <label htmlFor={name}>{label}</label>
        {errors && <span>{errors[0]}</span>}
        <input type='checkbox' id={name} />
      </div>
    ),
  }),
);

describe('acceptAndConfirmForm tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    email: 'test@test.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'admin',
    user_id: '123go',
  };
  const mockSubmitUsers = jest.fn();
  const mockCreateOneUserNoJSFormAction = '/fake-action' as unknown as (
    form_data: FormData,
  ) => void;

  const props: AcceptAndConfirmFormProps = {
    cookieAddedUser: mockUser,
    submitUsers: mockSubmitUsers,
    createOneUserNoJSFormAction: mockCreateOneUserNoJSFormAction,
    error: '',
    whiteLabelKey: 'SDE',
  };

  it('renders hidden input fields with correct values', () => {
    render(<AcceptAndConfirmForm {...props} />);

    expect(screen.getByDisplayValue('test@test.com')).toHaveAttribute(
      'type',
      'hidden',
    );
    expect(screen.getByDisplayValue('Test')).toHaveAttribute('type', 'hidden');
    expect(screen.getByDisplayValue('User')).toHaveAttribute('type', 'hidden');
    expect(screen.getByDisplayValue('admin')).toHaveAttribute('type', 'hidden');
  });

  it('renders ConfirmationCheckbox with correct label and name', () => {
    render(<AcceptAndConfirmForm {...props} />);

    expect(screen.getByTestId('confirmation-checkbox')).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        'I accept the above costs and confirm that the details I have provided are correct.',
      ),
    ).toBeInTheDocument();
  });

  it('displays error if provided', () => {
    props.error = 'Terrible things have happened!!';

    render(<AcceptAndConfirmForm {...props} />);

    expect(
      screen.getByText('Terrible things have happened!!'),
    ).toBeInTheDocument();
  });

  it('calls submitUsers on form submit', () => {
    render(<AcceptAndConfirmForm {...props} />);

    const button = screen.getByRole('button', { name: 'Confirm users' });
    fireEvent.click(button);

    expect(mockSubmitUsers).toHaveBeenCalledTimes(1);
  });
});
