import { render, screen, within } from '@testing-library/react';
import * as navigation from 'next/navigation';
import * as React from 'react';

import AddUserPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/page';
import { createRandomId } from '@/app/shared/createRandomId';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import { getByDataCy } from '@/jest/utils';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});
jest.mock('@/app/shared/createRandomId', () => ({
  __esModule: true,
  createRandomId: jest.fn(() => 'new123'),
}));
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/_components/submitAddUserForm',
  () => jest.fn(),
);

describe('AddUserPage tests', () => {
  const agreement_id = 'agreement123';
  const searchParams = {
    form_id: 'abc123',
    user_id: 'user456',
  };
  const base_props = {
    params: Promise.resolve({ agreement_id }),
    searchParams: Promise.resolve(searchParams),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (React.useActionState as jest.Mock).mockImplementation(
      (_action, initialState) => {
        return [initialState, jest.fn(), false];
      },
    );
  });

  it('renders the AddUserForm when form_id and user_id are provided', async () => {
    render(await AddUserPage(base_props));

    expect(getByDataCy('add-user-form')).toBeInTheDocument();

    //go back link
    expect(getByDataCy('go-back-link')).toBeInTheDocument();
    expect(getByDataCy('go-back-link')).toHaveAttribute(
      'href',
      `/agreement/${agreement_id}/manage-users`,
    );

    // error summary should not be present
    expect(() => getByDataCy('error-summary-link')).toThrow();
    expect(() => getByDataCy('error-summary')).toThrow();

    //field errors should not be present
    const errorElements = document.querySelectorAll('.nhsuk-form-group--error');
    expect(errorElements).toHaveLength(0);

    // heading and description
    expect(
      screen.getByRole('heading', { name: /Add a new user/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'We need some details about the user. You can add additional users later.',
      ),
    ).toBeInTheDocument();

    // form fields
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(
      screen.getByText(
        "This must be the user's correct work email, not a personal email address. For example - john.smith1@nhs.net",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm their email')).toBeInTheDocument();

    // role radios
    expect(getByDataCy('role-select')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Role' })).toBeInTheDocument();

    const analystRadio = screen.getByRole('radio', { name: /Data Analyst/i });
    const analystrRadioContainer = analystRadio.closest('.nhsuk-radios__item');
    const analysthHint = analystrRadioContainer?.querySelector('.nhsuk-hint');
    expect(analystrRadioContainer).toBeInTheDocument();
    expect(analysthHint).toHaveTextContent(
      /User can access data through the SDE platform/,
    );
    expect(analysthHint).toHaveTextContent(/£435 a month/);
    expect(analysthHint).toHaveTextContent(/per agreement./);

    const managerRadio = screen.getByRole('radio', { name: /User Manager/i });
    const managerRadioContainer = managerRadio.closest('.nhsuk-radios__item');
    const managerHint = managerRadioContainer?.querySelector('.nhsuk-hint');
    expect(managerRadioContainer).toBeInTheDocument();
    expect(managerHint).toHaveTextContent(
      /User can add and manage other users on the SDE platform. User Managers are/,
    );
    expect(managerHint).toHaveTextContent(/not charged./);

    const bothRadio = screen.getByRole('radio', { name: /Both/i });
    const bothRadioContainer = bothRadio.closest('.nhsuk-radios__item');
    const bothHint = bothRadioContainer?.querySelector('.nhsuk-hint');
    expect(bothRadioContainer).toBeInTheDocument();
    expect(bothHint).toHaveTextContent(
      /User can access data and manage other users on the SDE platform. These users will be charged/,
    );
    expect(bothHint).toHaveTextContent(/£435 a month/);
    expect(bothHint).toHaveTextContent(/per agreement./);

    expect(screen.getByText('Continue')).toBeInTheDocument();

    expect(createRandomId).not.toHaveBeenCalled();
    expect(navigation.redirect).not.toHaveBeenCalled();
  });

  it('creates a form_id and user_id and redirects when form_id and user_id are missing', async () => {
    const props = {
      params: Promise.resolve({ agreement_id }),
      searchParams: Promise.resolve({}),
    };

    render(await AddUserPage(props));

    expect(getByDataCy('add-user-form')).toBeInTheDocument();
    expect(createRandomId).toHaveBeenCalledTimes(2);
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=new123&user_id=new123',
    );
  });

  it('creates a user_id and redirects if only form_id is provided', async () => {
    const props = {
      params: Promise.resolve({ agreement_id }),
      searchParams: Promise.resolve({ form_id: 'formyMcform' }),
    };

    render(await AddUserPage(props));

    expect(getByDataCy('add-user-form')).toBeInTheDocument();
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(createRandomId).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=formyMcform&user_id=new123',
    );
  });

  it('creates a form_id and redirects if only user_id is provided', async () => {
    const props = {
      params: Promise.resolve({ agreement_id }),
      searchParams: Promise.resolve({ user_id: 'McUserson' }),
    };

    render(await AddUserPage(props));

    expect(getByDataCy('add-user-form')).toBeInTheDocument();
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(createRandomId).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=new123&user_id=McUserson',
    );
  });

  it('creates a user_id and redirects when user_id is not a string', async () => {
    const props = {
      params: Promise.resolve({ agreement_id }),
      searchParams: Promise.resolve({
        form_id: 'valid-form-id',
        user_id: ['not', 'a', 'string'],
      }),
    };

    render(await AddUserPage(props));

    expect(getByDataCy('add-user-form')).toBeInTheDocument();
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(createRandomId).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=valid-form-id&user_id=new123',
    );
  });

  it('creates a form_id and redirects when form_id is not a string', async () => {
    const props = {
      params: Promise.resolve({ agreement_id }),
      searchParams: Promise.resolve({
        form_id: ['not', 'a', 'string'],
        user_id: 'valid-user-id',
      }),
    };

    render(await AddUserPage(props));

    expect(getByDataCy('add-user-form')).toBeInTheDocument();
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(createRandomId).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=new123&user_id=valid-user-id',
    );
  });

  it('displays errors when required fields are empty', async () => {
    (React.useActionState as jest.Mock).mockImplementation(() => [
      {
        errors: {
          first_name: ['First name is required'],
          last_name: ['Last name is required'],
          email: ['Email must be valid'],
          email_confirm: ['Email must be valid'],
          role: ['Role is required'],
        },
      },
      jest.fn(),
      false,
    ]);

    render(await AddUserPage(base_props));

    const errorSummary = await screen.findByRole('alert');
    expect(errorSummary).toBeInTheDocument();
    expect(
      errorSummary.contains(
        screen.getByRole('heading', { name: /There is a problem/i }),
      ),
    ).toBe(true);

    const firstNameLink = within(errorSummary).getByRole('link', {
      name: /First name is required/,
    });
    expect(firstNameLink).toBeInTheDocument();
    expect(firstNameLink).toHaveAttribute('href', '#first_name-input');

    const lastNameLink = within(errorSummary).getByRole('link', {
      name: /Last name is required/,
    });
    expect(lastNameLink).toBeInTheDocument();
    expect(lastNameLink).toHaveAttribute('href', '#last_name-input');

    const emailLinks = within(errorSummary).getAllByRole('link', {
      name: /Email must be valid/,
    });
    const emailLink = emailLinks.find(
      (link) => link.getAttribute('href') === '#email-input',
    );
    expect(emailLink).toBeInTheDocument();
    const confirmEmailLink = emailLinks.find(
      (link) => link.getAttribute('href') === '#email_confirm-input',
    );
    expect(confirmEmailLink).toBeInTheDocument();

    const roleLink = within(errorSummary).getByRole('link', {
      name: /Role is required/,
    });
    expect(roleLink).toBeInTheDocument();
    expect(roleLink).toHaveAttribute('href', '#role-Analyst-input');

    const firstNameInput = screen.getByLabelText(/First name/);
    expect(firstNameInput).toHaveClass('nhsuk-input--error');
    expect(firstNameInput).toHaveAttribute('aria-describedby');
    const fnFormGroup = firstNameInput.closest('.nhsuk-form-group');
    expect(fnFormGroup).toHaveTextContent(/First name is required/);

    const lastNameInput = screen.getByLabelText(/Last name/);
    expect(lastNameInput).toHaveClass('nhsuk-input--error');
    expect(lastNameInput).toHaveAttribute('aria-describedby');
    const lnFormGroup = lastNameInput.closest('.nhsuk-form-group');
    expect(lnFormGroup).toHaveTextContent(/Last name is required/);

    const emailInput = screen.getByLabelText(/Email/);
    expect(emailInput).toHaveClass('nhsuk-input--error');
    expect(emailInput).toHaveAttribute('aria-describedby');
    const emailFormGroup = emailInput.closest('.nhsuk-form-group');
    expect(emailFormGroup).toHaveTextContent(/Email must be valid/);

    const confirmEmailInput = screen.getByLabelText(/Confirm their email/);
    expect(confirmEmailInput).toBeInTheDocument();
    expect(confirmEmailInput).toHaveClass('nhsuk-input--error');
    expect(confirmEmailInput).toHaveAttribute('aria-describedby');
    const confirmEmailFormGroup =
      confirmEmailInput.closest('.nhsuk-form-group');
    expect(confirmEmailFormGroup).toHaveTextContent(/Email must be valid/);

    const analystRadio = screen.getByRole('radio', { name: /Data Analyst/i });
    expect(analystRadio).toBeInTheDocument();
    const roleGroup = analystRadio.closest('.nhsuk-form-group');
    expect(roleGroup).toBeInTheDocument();
    const roleGroupEl = roleGroup as HTMLElement;
    expect(
      within(roleGroupEl).getByText(/Role is required/i),
    ).toBeInTheDocument();
  });

  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(`Add a new user - ${whiteLabelValues.acronym}`);
  });
});
