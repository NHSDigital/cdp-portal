"use client";

import { RadioButtonInputField } from "app/shared/formFields";
import { useFormState } from "react-dom";
import { useEffect } from "react";
import BackLink from "app/shared/backLink";
import SubmitButton from "app/shared/submitButton";
import ErrorSummary from "app/shared/errorSummary";

const initialState = {};

export default function ConfirmChangeActivationPage({
  users_full_name,
  users_is_active,
  changeActivation,
}: {
  users_full_name: string;
  users_is_active: boolean;
  changeActivation: (form_data: FormData) => void;
}) {
  const [state, formAction] = useFormState(changeActivation, initialState);

  const change_activation_error_id = "change-activation-error";
  useEffect(() => {
    document.getElementById("error-summary")?.focus();
  }, [state.error]);

  return (
    <div>
      <BackLink href="." />
      {state.error && (
        <ErrorSummary
          errors={[
            { input_id: "confirm-Yes-input", errors_list: [state.error] },
          ]}
        />
      )}
      <form action={formAction}>
        {users_is_active ? (
          <DeactivateUserContent user_full_name={users_full_name} />
        ) : (
          <ActivateUserContent user_full_name={users_full_name} />
        )}
        <div
          className={
            state.error
              ? "nhsuk-form-group nhsuk-form-group--error nhsuk-u-margin-bottom-7"
              : "nhsuk-form-group nhsuk-u-margin-bottom-7"
          }
        >
          <fieldset className="nhsuk-fieldset">
            <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--m">
              <h2 className="nhsuk-fieldset__heading">
                Do you want to {users_is_active ? "deactivate" : "reactivate"}{" "}
                {users_full_name}?
              </h2>
            </legend>

            {state.error && (
              <span
                className="nhsuk-error-message"
                id={change_activation_error_id}
              >
                <span className="nhsuk-u-visually-hidden">Error:</span>{" "}
                {state.error}
              </span>
            )}

            <div className="nhsuk-radios">
              <RadioButtonInputField
                label="Yes"
                button_group="confirm"
                button_value="Yes"
                error_ids={state.error && [change_activation_error_id]}
              />
              <RadioButtonInputField
                label="No"
                button_group="confirm"
                button_value="No"
                error_ids={state.error && [change_activation_error_id]}
              />
            </div>
          </fieldset>
        </div>
        <SubmitButton>Continue</SubmitButton>
      </form>
    </div>
  );
}

function ActivateUserContent({ user_full_name }: { user_full_name: string }) {
  return (
    <>
      <h1>Reactivate {user_full_name}</h1>
      <p>Reactivated users will receive an email notification.</p>
      <p>
        Users are charged the full standard fee for the month. For example, if
        you reactivate a user in June, they will be charged for the whole of
        June. 
      </p>
    </>
  );
}

function DeactivateUserContent({ user_full_name }: { user_full_name: string }) {
  return (
    <>
      <h1>Deactivate {user_full_name}</h1>
      <p>Deactivated users will receive an email notification.</p>
      <p>
        Deactivated users are not charged for. However, if these users have been
        active at any time during an invoiced calendar month, the user will
        still be charged for as standard.
      </p>
      <p>You can reactivate a user that has been deactivated at any time. </p>
    </>
  );
}
