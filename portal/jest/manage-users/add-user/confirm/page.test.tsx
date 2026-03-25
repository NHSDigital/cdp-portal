import { render, screen, within } from '@testing-library/react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as React from 'react';

import { confirmationLabelMap } from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/acceptAndConfirmForm';
import AddUserPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/page';
import { getWhiteLabelValues, WhiteLabelEntry } from '@/config/whiteLabel';
import { getByDataCy } from '@/jest/utils';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  redirect: jest.fn(() => {
    throw new Error('Redirect called');
  }),
}));
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('@/config/whiteLabel');

const mockWhiteLabelValuesSDE: WhiteLabelEntry = {
  acronym: 'SDE',
  longName: 'Secure Data Environment',
};

describe('AddUserPage tests', () => {
  beforeAll(() => {
    window.scrollTo = jest.fn();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    (React.useActionState as jest.Mock).mockImplementation(
      (_action, initialState) => {
        return [initialState, jest.fn(), false];
      },
    );
    (getWhiteLabelValues as jest.Mock).mockReturnValue(mockWhiteLabelValuesSDE);
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({
        value: JSON.stringify({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@test.com',
          role: 'Analyst',
          user_id: 'user-1',
        }),
      }),
    });
  });

  it('renders ConfirmClient with correct props when cookie and form_id are valid (SDE)', async () => {
    const params = Promise.resolve({ agreement_id: '123' });
    const searchParams = Promise.resolve({ form_id: 'abc' });

    const result = await AddUserPage({ params, searchParams });

    render(result as React.ReactElement);

    const backLink = getByDataCy('go-back-link');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute(
      'href',
      '/agreement/123/manage-users/add-user?form_id=abc&user_id=user-1',
    );

    expect(
      screen.getByRole('heading', { name: 'Confirm user details' }),
    ).toBeInTheDocument();

    expect(getByDataCy('user-details-table')).toBeInTheDocument();

    expect(getByDataCy('first-name-header').textContent).toBe('First Name');
    const firstNamecell = getByDataCy('first-name-cell');
    expect(within(firstNamecell).getByText('Jane')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /First Name Jane/ })).toBe(
      firstNamecell,
    );

    expect(getByDataCy('last-name-header').textContent).toBe('Last Name');
    const lastNameCell = getByDataCy('last-name-cell');
    expect(within(lastNameCell).getByText('Doe')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Last Name Doe/ })).toBe(
      lastNameCell,
    );

    expect(getByDataCy('email-header').textContent).toBe('Email');
    const emailCell = getByDataCy('email-cell');
    expect(within(emailCell).getByText('jane@test.com')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Email jane@test.com/ })).toBe(
      emailCell,
    );

    expect(getByDataCy('role-header').textContent).toBe('Role');
    const roleCell = getByDataCy('role-cell');
    expect(within(roleCell).getByText('Data Analyst')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Role Data Analyst/ })).toBe(
      roleCell,
    );

    expect(getByDataCy('edit-header').textContent).toBe('Edit');
    const editCell = getByDataCy('edit-cell');
    expect(within(editCell).getByText('Edit')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Edit user details/ })).toBe(
      editCell,
    );
    expect(getByDataCy('edit-cell').querySelector('a')).toHaveAttribute(
      'href',
      '/agreement/123/manage-users/add-user?form_id=abc&user_id=user-1',
    );

    expect(getByDataCy('delete-header').textContent).toBe('Delete');
    const deleteCell = getByDataCy('delete-cell');
    expect(within(deleteCell).getByText('Delete')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Delete user/ })).toBe(deleteCell);
    expect(deleteCell.querySelector('a')).toHaveAttribute(
      'href',
      '/agreement/123/manage-users/add-user/confirm/delete-user?form_id=abc&user_id=user-1',
    );

    const addAnotherUser = getByDataCy('add-another-user');
    expect(addAnotherUser.textContent).toBe('Add another user');
    expect(addAnotherUser).toHaveAttribute(
      'href',
      '/agreement/123/manage-users/add-user?form_id=abc',
    );
    expect(
      screen.getByText(
        'New Data Analysts will be sent an email to an online induction and assessment. Once they have passed this induction, these users will be activated and charged for.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'New User Managers will be sent an email to set up their account.',
      ),
    ).toBeInTheDocument();
    const DataAnalystChargeWarning = getByDataCy('data-analyst-warning');
    expect(
      within(DataAnalystChargeWarning).getByText('Important'),
    ).toBeInTheDocument();
    expect(DataAnalystChargeWarning).toHaveTextContent(
      /Data Analysts are charged/,
    );
    expect(DataAnalystChargeWarning).toHaveTextContent(/£435 a month/);
    expect(DataAnalystChargeWarning).toHaveTextContent(
      /per agreement, not including optional tools such as Stata./,
    );
    expect(DataAnalystChargeWarning).toHaveTextContent(
      /This price will increase to/,
    );
    expect(DataAnalystChargeWarning).toHaveTextContent(/£472 a month/);
    expect(DataAnalystChargeWarning).toHaveTextContent(/per agreement from /);
    expect(DataAnalystChargeWarning).toHaveTextContent(/1 April 2026./);
    expect(DataAnalystChargeWarning).toHaveTextContent(
      /Data Analysts will be charged in the first month regardless of when they are activated./,
    );
    expect(DataAnalystChargeWarning).toHaveTextContent(
      /User Manager accounts are not charged for./,
    );
    expect(DataAnalystChargeWarning).toHaveTextContent(
      /For more information, visit/,
    );
    expect(DataAnalystChargeWarning.querySelector('a')).toHaveAttribute(
      'href',
      'https://digital.nhs.uk/services/secure-data-environment-service#charges-to-access-the-sde',
    );
    expect(DataAnalystChargeWarning).toHaveTextContent(
      /charges to access the SDE \(opens in a new window\)/,
    );

    const checkboxLabel =
      'I accept the above costs and confirm that the details I have provided are correct.';
    const checkbox = screen.getByLabelText(checkboxLabel);
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    const confirmButton = getByDataCy('confirm-users-button');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toHaveTextContent('Confirm users');
  });

  it('renders correct wording when whitelabel values are CDP', async () => {
    const mockWhiteLabelValuesCDP: WhiteLabelEntry = {
      acronym: 'CDP',
      longName: 'Common Data Platform',
    };
    (getWhiteLabelValues as jest.Mock).mockReturnValueOnce(
      mockWhiteLabelValuesCDP,
    );

    const params = Promise.resolve({ agreement_id: '123' });
    const searchParams = Promise.resolve({ form_id: 'abc' });

    const result = await AddUserPage({ params, searchParams });

    render(result as React.ReactElement);

    expect(
      screen.getByText(
        'New Data Analysts will be activated and sent an email to set up their account.',
      ),
    ).toBeInTheDocument();

    const checkboxLabel = 'I confirm the details I have provided are correct.';
    const checkbox = screen.getByLabelText(checkboxLabel);
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    const confirmButton = getByDataCy('confirm-users-button');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toHaveTextContent('Confirm users');
  });

  it('redirects if add_user_form cookie is missing', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => undefined,
    });

    const params = Promise.resolve({ agreement_id: '123' });
    const searchParams = Promise.resolve({ form_id: 'abc' });

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );

    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });

  it('redirects if form_id is not a string', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({
        value: JSON.stringify({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@test.com',
          role: 'admin',
          user_id: 'user-1',
        }),
      }),
    });

    const params = Promise.resolve({ agreement_id: '123' });
    const searchParams = Promise.resolve({ form_id: ['abc'] });

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );

    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });

  test('redirects if cookie has malformed JSON', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({
        value: '{bad-json}',
      }),
    });

    const params = Promise.resolve({ agreement_id: '123' });
    const searchParams = Promise.resolve({ form_id: 'abc' });

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );
    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });

  test('redirects if cookie JSON is missing required fields', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({
        value: JSON.stringify({ first_name: 'OnlyFirstName' }),
      }),
    });

    const params = Promise.resolve({ agreement_id: '123' });
    const searchParams = Promise.resolve({ form_id: 'abc' });

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );
    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });

  test('redirects if cookie has invalid email format', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({
        value: JSON.stringify({
          first_name: 'John',
          last_name: 'Doe',
          email: 'not-an-email',
          role: 'Analyst',
          user_id: 'u-123',
        }),
      }),
    });

    const params = Promise.resolve({ agreement_id: '123' });
    const searchParams = Promise.resolve({ form_id: 'abc' });

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );
    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });
  it('exports correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Confirm user details - ${mockWhiteLabelValuesSDE.acronym}`,
    );
  });

  it('displays error from useFormState when present', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({
        value: JSON.stringify({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@test.com',
          role: 'Analyst',
          user_id: 'user-1',
        }),
      }),
    });

    const params = Promise.resolve({ agreement_id: '123' });
    const searchParams = Promise.resolve({ form_id: 'abc' });

    (React.useActionState as jest.Mock).mockImplementation(() => [
      { error: 'Do the thing!' },
      '/mock-action',
      false,
    ]);

    render(await AddUserPage({ params, searchParams }));

    const confirmLabel = confirmationLabelMap[mockWhiteLabelValuesSDE.acronym];
    const errorSummary = await screen.findByRole('alert');
    expect(errorSummary).toBeInTheDocument();
    expect(
      within(errorSummary).getByText('There is a problem'),
    ).toBeInTheDocument();
    expect(within(errorSummary).getByText('Do the thing!')).toBeInTheDocument();

    const checkbox = screen.getByLabelText(confirmLabel);
    const formGroup = checkbox.closest('.nhsuk-form-group');
    expect(formGroup).toHaveClass('nhsuk-form-group--error');
    expect(formGroup).toHaveTextContent('Do the thing!');
  });
});
