'use client';

import BackLink from 'app/shared/backLink';
import ErrorSummary from 'app/shared/errorSummary';
import { RadioButtonInputField } from 'app/shared/formFields';
import SubmitButton from 'app/shared/submitButton';
import { useActionState, useEffect } from 'react';

import { WhiteLabelKey } from '@/config/whiteLabel';

import { ActivateUserContent } from './ActivateUserContent';
import { DeactivateUserContent } from './DeactivateUserContent';

type State = {
  error?: string;
};

const initialState: State = {};

export interface ConfirmChangeActivationProps {
  usersFullName: string;
  userIsActive: boolean;
  changeActivation: (
    state: State,
    formData: FormData,
  ) => Promise<State> | State;
  whiteLabelKey: WhiteLabelKey;
}

export default function ConfirmChangeActivationPage({
  usersFullName,
  userIsActive,
  changeActivation,
  whiteLabelKey,
}: ConfirmChangeActivationProps) {
  const [state, formAction] = useActionState(changeActivation, initialState);

  const change_activation_error_id = 'change-activation-error';
  useEffect(() => {
    document.getElementById('error-summary')?.focus();
  }, [state.error]);

  return (
    <div>
      <BackLink href='.' />
      {state.error && (
        <ErrorSummary
          errors={[
            {
              input_id: 'confirm-Yes-input',
              errors_list: [state.error],
            },
          ]}
        />
      )}
      <form action={formAction}>
        {userIsActive ? (
          <DeactivateUserContent
            usersFullName={usersFullName}
            whiteLabelKey={whiteLabelKey}
          />
        ) : (
          <ActivateUserContent
            usersFullName={usersFullName}
            whiteLabelKey={whiteLabelKey}
          />
        )}
        <div
          className={
            state.error
              ? 'nhsuk-form-group nhsuk-form-group--error nhsuk-u-margin-bottom-7'
              : 'nhsuk-form-group nhsuk-u-margin-bottom-7'
          }
        >
          <fieldset className='nhsuk-fieldset'>
            <legend className='nhsuk-fieldset__legend nhsuk-fieldset__legend--m'>
              <h2 className='nhsuk-fieldset__heading'>
                Do you want to {userIsActive ? 'deactivate' : 'reactivate'}{' '}
                {usersFullName}?
              </h2>
            </legend>

            {state.error && (
              <span
                className='nhsuk-error-message'
                id={change_activation_error_id}
              >
                <span className='nhsuk-u-visually-hidden'>Error:</span>{' '}
                {state.error}
              </span>
            )}

            <div className='nhsuk-radios'>
              <RadioButtonInputField
                label='Yes'
                button_group='confirm'
                button_value='Yes'
                error_ids={
                  state.error ? [change_activation_error_id] : undefined
                }
              />
              <RadioButtonInputField
                label='No'
                button_group='confirm'
                button_value='No'
                error_ids={
                  state.error ? [change_activation_error_id] : undefined
                }
              />
            </div>
          </fieldset>
        </div>
        <SubmitButton>Continue</SubmitButton>
      </form>
    </div>
  );
}
