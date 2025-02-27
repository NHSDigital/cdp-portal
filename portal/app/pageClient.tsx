"use client";

import { Agreement } from "services/getUserAgreements";
import { useEffect } from "react";
import ErrorSummary from "./shared/errorSummary";
import { useFormState, useFormStatus } from "react-dom";
import { RadioButtonInputField } from "app/shared/formFields";
import { useRouter } from "next/navigation";
import { WarningCallout } from "nhsuk-react-components";

export default function SelectAgreementPageClient({
  agreements_to_display,
}: {
  agreements_to_display: Agreement[];
}) {
  const router = useRouter();
  const { pending } = useFormStatus();

  const handleSelectAgreementForm = (
    initial_state: any,
    form_data: FormData
  ) => {
    try {
      const selected_agreement = form_data.get("agreement_selector");
      if (!selected_agreement) {
        return {
          error: "Select an agreement",
        };
      }
      router.push(`/agreement/${selected_agreement}`);
    } catch (err) {
      throw new Error("Something went wrong");
    }
  };

  const [state, formAction] = useFormState(handleSelectAgreementForm, {});

  useEffect(() => {
    document.getElementById("error-summary")?.focus();
  }, [state.error]);

  return (
    <SelectAgreementPageContent
      agreements_to_display={agreements_to_display}
      error={state.error}
      is_form_pending={pending}
      formAction={formAction}
    />
  );
}

export function SelectAgreementPageContent({
  agreements_to_display,
  error,
  is_form_pending,
  formAction,
}: {
  agreements_to_display: Agreement[];
  error: string | null;
  is_form_pending: boolean;
  formAction: any;
}) {
  return (
    <div>
      {error && (
        <ErrorSummary
          errors={[{ input_id: "role-Analyst-input", errors_list: [error] }]}
        />
      )}

      <h1>Secure Data Environment (SDE) Portal</h1>

      <p className="nhsuk-lede-text">
        Below are the agreements you can access.
      </p>

      <form action={formAction}>
        <div
          className={
            error
              ? "nhsuk-form-group nhsuk-form-group--error  nhsuk-u-margin-bottom-7"
              : "nhsuk-form-group  nhsuk-u-margin-bottom-7"
          }
        >
          <span className="nhsuk-u-visually-hidden">
            Select an agreement to continue
          </span>

          {error && (
            <span className="nhsuk-error-message" key={"role" + error}>
              <span className="nhsuk-u-visually-hidden">Error:</span>
              {error}
            </span>
          )}

          {agreements_to_display.length > 0 &&
            agreements_to_display.map((agreement) => (
              <RadioButtonInputField
                key={agreement.agreement_id}
                label={
                  agreement.meaningful_name
                    ? agreement.meaningful_name
                    : agreement.agreement_id
                }
                button_group="agreement_selector"
                button_value={agreement.agreement_id}
                description={
                  agreement.meaningful_name ? (
                    <p> {agreement.agreement_id.toLocaleUpperCase()} </p>
                  ) : (
                    <p data-cy="empty-p">&nbsp;</p>
                  )
                }
              />
            ))}

          {agreements_to_display.length == 0 && (
            <WarningCallout>
              <p style={{ marginTop: "2rem", fontSize: "1.2em" }}>
                You aren&apos;t a member of any agreements in our database. If
                this is in error please contact us.
              </p>
            </WarningCallout>
          )}
        </div>
        <button
          type="submit"
          className="nhsuk-button"
          disabled={is_form_pending}
        >
          Continue
        </button>
      </form>

      <details className="nhsuk-details">
        <summary className="nhsuk-details__summary">
          <span className="nhsuk-details__summary-text" data-cy="status_key">
            More information on this step
          </span>
        </summary>
        <div className="nhsuk-details__text">
          <p>If you are a User Manager select an agreement to manage users</p>
          <p>
            If you are a Data Analyst select an agreement to access your data
            via the SDE platform.
          </p>
          <p>If you have both roles you will be able to do both.</p>
        </div>
      </details>
    </div>
  );
}
