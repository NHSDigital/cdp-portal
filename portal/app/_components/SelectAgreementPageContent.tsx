'use client';

import { useRouter } from 'next/navigation';
import { WarningCallout } from 'nhsuk-react-components';
import { FormEvent, useEffect, useState } from 'react';

import ErrorSummary from '@/app/shared/errorSummary';
import { RadioButtonInputField } from '@/app/shared/formFields';
import SubmitButton from '@/app/shared/submitButton';
import { WhiteLabelEntry } from '@/config/whiteLabel';
import { Agreement } from '@/services/getUserAgreements';

function SelectAgreementPageContent({
  agreements_to_display,
  whiteLabelValues,
}: {
  agreements_to_display: Agreement[];
  whiteLabelValues: WhiteLabelEntry;
}) {
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const errorSummaryInput = [
    {
      input_id: `agreement_selector-${agreements_to_display[0]?.agreement_id}-input`,
      errors_list: error ? [error] : undefined,
    },
  ];

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    const form_data = new FormData(submitEvent.target as HTMLFormElement);
    const agreement_selector_response = form_data.get('agreement_selector');

    if (!agreement_selector_response) {
      setError('Select an agreement');
      return;
    } else {
      router.push(`/agreement/${agreement_selector_response}/`);
      return;
    }
  }

  useEffect(() => {
    document.getElementById('error-summary')?.focus();
  }, [error]);

  return (
    <section data-cy='select-agreement-page'>
      <ErrorSummary errors={errorSummaryInput} />

      <h1>
        {whiteLabelValues.longName} ({whiteLabelValues.acronym}) Portal
      </h1>

      <p className='nhsuk-lede-text'>
        Below are the agreements you can access.
      </p>

      <form onSubmit={(e) => handleSubmit(e)}>
        <div
          className={
            error
              ? 'nhsuk-form-group nhsuk-form-group--error  nhsuk-u-margin-bottom-7'
              : 'nhsuk-form-group  nhsuk-u-margin-bottom-7'
          }
        >
          <span className='nhsuk-u-visually-hidden'>
            Select an agreement to continue
          </span>

          {error && (
            <span className='nhsuk-error-message' key={'role' + error}>
              <span className='nhsuk-u-visually-hidden'>Error:</span>
              {error}
            </span>
          )}

          {agreements_to_display.length > 0 &&
            [...agreements_to_display]
              .sort((a, b) => {
                const nameA = a.agreement_id.toLowerCase();
                const nameB = b.agreement_id.toLowerCase();
                return nameA.localeCompare(nameB);
              })
              .map((agreement) => (
                <RadioButtonInputField
                  key={agreement.agreement_id}
                  label={
                    agreement.meaningful_name
                      ? agreement.meaningful_name
                      : agreement.agreement_id
                  }
                  button_group='agreement_selector'
                  button_value={agreement.agreement_id}
                  description={
                    agreement.meaningful_name ? (
                      <p> {agreement.agreement_id.toLocaleUpperCase()} </p>
                    ) : (
                      <p data-cy='empty-p'>&nbsp;</p>
                    )
                  }
                />
              ))}

          {agreements_to_display.length == 0 && (
            <WarningCallout>
              <p style={{ marginTop: '2rem', fontSize: '1.2em' }}>
                You aren&apos;t a member of any agreements in our database. If
                this is in error please contact us.
              </p>
            </WarningCallout>
          )}
        </div>
        <SubmitButton>Continue</SubmitButton>
      </form>

      <details className='nhsuk-details'>
        <summary className='nhsuk-details__summary'>
          <span className='nhsuk-details__summary-text' data-cy='status_key'>
            More information on this step
          </span>
        </summary>
        <div className='nhsuk-details__text'>
          <p>If you are a User Manager select an agreement to manage users</p>
          <p>
            If you are a Data Analyst select an agreement to access your data
            via the {whiteLabelValues.acronym} platform.
          </p>
          <p>If you have both roles you will be able to do both.</p>
        </div>
      </details>
    </section>
  );
}

export { SelectAgreementPageContent };
