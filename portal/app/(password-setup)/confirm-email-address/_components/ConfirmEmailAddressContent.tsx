"use client";

import React from "react";
import ErrorSummary from "app/shared/errorSummary";
import TextInputField from "app/shared/textInputField";
import SubmitButton from "app/shared/submitButton";
import {
  invokeVerifyEmailAddress,
  invokeVerifyEmailAddressType,
} from "./serverActions";
import { useFormState } from "react-dom";

const initialFormState: invokeVerifyEmailAddressType = {};

export default function ConfirmEmailAddressPageContent({ id }: { id: string }) {
  const [formState, formAction] = useFormState(
    invokeVerifyEmailAddress,
    initialFormState
  );

  return (
    <>
      <ErrorSummary
        errors={[
          {
            input_id: "email_address-input",
            errors_list: formState.error ? [formState.error] : undefined,
          },
        ]}
      />
      <h1>Confirm your email address</h1>
      <form action={formAction}>
        <TextInputField
          errors={formState.error ? [formState.error] : undefined}
          label="Enter your email address"
          name="email_address"
          width="nhsuk-input--width-full"
        />
        <input type="hidden" name="id" value={id} />
        <SubmitButton>Continue</SubmitButton>
      </form>
    </>
  );
}
