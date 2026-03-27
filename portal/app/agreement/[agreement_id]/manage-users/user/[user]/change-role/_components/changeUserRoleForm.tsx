'use client';

import BackLink from 'app/shared/backLink';
import ErrorSummary from 'app/shared/errorSummary';
import SubmitButton from 'app/shared/submitButton';
import { useEffect } from 'react';
import { useFormState } from 'react-dom';

import RoleSelector from '@/app/_components/role-selector/RoleSelector';
import { WhiteLabelEntry } from '@/config/whiteLabel';

const initialState = {};

export default function ChangeUserRole({
  changeUserRole,
  whiteLabelValues,
}: {
  changeUserRole: (form_data: FormData) => void;
  whiteLabelValues: WhiteLabelEntry;
}) {
  const [state, formAction] = useFormState(changeUserRole, initialState);

  useEffect(() => {
    document.getElementById('error-summary')?.focus();
  }, [state.error]);

  return (
    <>
      <form action={formAction}>
        <BackLink href='.' data-cy='go-back-link' />
        {state.error && (
          <ErrorSummary
            errors={[
              {
                input_id: 'role-Analyst-input',
                errors_list: [state.error],
              },
            ]}
          />
        )}
        <fieldset className='nhsuk-fieldset' aria-describedby='role-hint'>
          <div
            className={
              state.error
                ? 'nhsuk-form-group nhsuk-form-group--error  nhsuk-u-margin-bottom-7'
                : 'nhsuk-form-group  nhsuk-u-margin-bottom-7'
            }
          >
            <legend>
              <h1>Change user role</h1>
            </legend>

            <p className='nhsuk-hint nhsuk-u-margin-bottom-6' id='role-hint'>
              Select a different role for this user.
            </p>

            <RoleSelector
              errors={state.error && [state.error]}
              whiteLabelKey={whiteLabelValues.acronym}
            />
          </div>
          <SubmitButton>Confirm role</SubmitButton>
        </fieldset>
      </form>
    </>
  );
}
