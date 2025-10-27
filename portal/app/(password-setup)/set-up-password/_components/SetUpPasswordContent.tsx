'use client';

import ErrorSummary from 'app/shared/errorSummary';
import SubmitButton from 'app/shared/submitButton';
import TextInputField from 'app/shared/textInputField';
import React, { useEffect } from 'react';
import { useFormState } from 'react-dom';

import { WhiteLabelEntry } from '@/config/whiteLabel';

import { invokeSetUpPassword, invokeSetUpPasswordType } from './serverActions';

const initialFormState: invokeSetUpPasswordType = {};

export default function SetUpPasswordContent({
  user_email,
  guid,
  whiteLabelValues,
}: {
  user_email: string;
  guid: string;
  whiteLabelValues: WhiteLabelEntry;
}) {
  const [formState, formAction] = useFormState(
    invokeSetUpPassword,
    initialFormState,
  );

  useEffect(() => {
    document.getElementById('error-summary')?.focus();
  }, [formState.errors]);

  return (
    <>
      <ErrorSummary
        errors={[
          {
            input_id: 'enter_password-input',
            errors_list: formState.errors?.enter_password,
          },
          {
            input_id: 'confirm_password-input',
            errors_list: formState.errors?.confirm_password,
          },
        ]}
      />
      <h1>Set up password</h1>
      <p>
        Once you set your password you can sign into the{' '}
        {whiteLabelValues.acronym} portal.
      </p>
      <p>Your password must:</p>
      <ul>
        <li>have 14 characters or more</li>
        <li>have at least one lowercase and one uppercase letter </li>
        <li>have at least one number </li>
        <li>have at least one special character such as ?!@” </li>
      </ul>
      <p>Your password must not:</p>
      <ul>
        <li>be the same as a previous password </li>
        <li>have repeating characters next to each other such as 11 or aa</li>
      </ul>
      <form action={formAction}>
        <TextInputField
          label='Enter password'
          name='enter_password'
          errors={formState.errors?.enter_password}
          isPassword={true}
        />
        <TextInputField
          label='Confirm password'
          name='confirm_password'
          errors={formState.errors?.confirm_password}
          isPassword={true}
        />
        <input type='hidden' name='user_email' value={user_email} />
        <input type='hidden' name='guid' value={guid} />
        <SubmitButton>Continue</SubmitButton>
      </form>
    </>
  );
}
