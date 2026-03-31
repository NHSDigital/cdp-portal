'use client';

import BackLink from 'app/shared/backLink';
import ErrorSummary from 'app/shared/errorSummary';
import SubmitButton from 'app/shared/submitButton';
import TextInputField from 'app/shared/textInputField';
import { useActionState, useEffect, useState } from 'react';

import RoleSelector from '@/app/_components/role-selector/RoleSelector';
import { CookieNames } from '@/config/constants';
import { WhiteLabelEntry } from '@/config/whiteLabel';

export interface AddUserFormState {
  errors: Record<string, string> | undefined;
}

const initialFormState: AddUserFormState = {
  errors: undefined,
};

export interface AddUserFormProps {
  agreement_id: string;
  addUserAction: (
    state: AddUserFormState,
    formData: FormData,
  ) => Promise<AddUserFormState> | AddUserFormState;
  form_id: string;
  user_id: string;
  whiteLabelValues: WhiteLabelEntry;
}

export default function AddUserForm({
  agreement_id,
  addUserAction,
  form_id,
  user_id,
  whiteLabelValues,
}: AddUserFormProps) {
  const [formState, formAction] = useActionState(
    addUserAction,
    initialFormState,
  );
  const [backlinkHref, setBacklinkHref] = useState(
    `/agreement/${agreement_id}/manage-users/`,
  );

  useEffect(() => {
    const session_storage_item = sessionStorage.getItem(
      CookieNames.ADD_USER_FORM,
    );

    const users_to_add_dict = session_storage_item
      ? JSON.parse(session_storage_item)
      : undefined;

    if (users_to_add_dict?.[agreement_id]?.[form_id] === undefined) {
      return;
    }
    // if form details exist in session storage, update the backlink href to redirect to confirm page
    setBacklinkHref(
      `/agreement/${agreement_id}/manage-users/add-user/confirm?form_id=${form_id}`,
    );

    if (users_to_add_dict?.[agreement_id]?.[form_id]?.[user_id] === undefined) {
      return;
    }
    // if user details exist in session storage, prefill the form with the user details
    const user_details = users_to_add_dict[agreement_id][form_id][user_id];

    // prefill the form with the user details
    document
      .getElementById('first_name-input')
      ?.setAttribute('value', user_details.first_name);
    document
      .getElementById('last_name-input')
      ?.setAttribute('value', user_details.last_name);
    document
      .getElementById('email-input')
      ?.setAttribute('value', user_details.email);
    document
      .getElementById('email_confirm-input')
      ?.setAttribute('value', user_details.email);
    document.getElementById('role-' + user_details.role + '-input')?.click();
  }, [user_id, agreement_id, form_id, setBacklinkHref]);

  // Deconstruct the errors from the form state
  const {
    first_name: first_name_errors,
    last_name: last_name_errors,
    email: email_errors,
    email_confirm: email_confirm_errors,
    role: role_errors,
    confirm: confirm_errors,
  } = formState.errors || {};

  // Create an array of objects to pass to the error summary component
  const errorSummaryInputs = [
    {
      input_id: 'first_name-input',
      errors_list: first_name_errors ? [first_name_errors] : [],
    },
    {
      input_id: 'last_name-input',
      errors_list: last_name_errors ? [last_name_errors] : [],
    },
    {
      input_id: 'email-input',
      errors_list: email_errors ? [email_errors] : [],
    },
    {
      input_id: 'email_confirm-input',
      errors_list: email_confirm_errors ? [email_confirm_errors] : [],
    },
    {
      input_id: 'role-Analyst-input',
      errors_list: role_errors ? [role_errors] : [],
    },
    {
      input_id: 'confirm-input',
      errors_list: confirm_errors ? [confirm_errors] : [],
    },
  ];

  // NHS service manual states must move focus to error summary when it appears
  useEffect(() => {
    document.getElementById('error-summary')?.focus();
  }, [formState.errors]);

  return (
    <>
      <section data-cy='add-user-form'>
        <BackLink href={backlinkHref} />
        <ErrorSummary errors={errorSummaryInputs} />
        <h1>Add a new user</h1>
        <p>
          We need some details about the user. You can add additional users
          later.
        </p>

        <form action={formAction} className='nhsuk-u-margin-top-7'>
          <TextInputField
            label='First name'
            name='first_name'
            errors={first_name_errors ? [first_name_errors] : undefined}
          />
          <TextInputField
            label='Last name'
            name='last_name'
            errors={last_name_errors ? [last_name_errors] : undefined}
          />
          <TextInputField
            label='Email'
            name='email'
            hint="This must be the user's correct work email, not a personal email address. For example - john.smith1@nhs.net"
            errors={email_errors ? [email_errors] : undefined}
          />
          <TextInputField
            label='Confirm their email'
            name='email_confirm'
            errors={email_confirm_errors ? [email_confirm_errors] : undefined}
          />

          {/* Role Selector */}
          <div
            className={
              role_errors
                ? 'nhsuk-form-group nhsuk-form-group--error nhsuk-u-margin-top-7'
                : 'nhsuk-form-group nhsuk-u-margin-top-7'
            }
          >
            <fieldset data-cy='role-select' className='nhsuk-fieldset'>
              <legend className='nhsuk-fieldset__legend nhsuk-fieldset__legend--s'>
                <strong className='nhsuk-fieldset__heading'>Role</strong>
              </legend>
              <RoleSelector
                errors={role_errors ? [role_errors] : []}
                whiteLabelKey={whiteLabelValues.acronym}
              />
            </fieldset>
          </div>
          <SubmitButton>Continue</SubmitButton>
        </form>
      </section>
    </>
  );
}
