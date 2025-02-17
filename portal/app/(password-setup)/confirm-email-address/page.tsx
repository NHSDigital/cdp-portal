"use client";

import React from "react";
import useSubmitForm from "./submitForm";
import { useSearchParams } from "next/navigation";
import ErrorSummary from "app/shared/errorSummary";
import TextInputField from "app/shared/textInputField";
import SubmitButton from "app/shared/submitButton";

export default function ConfirmEmailAddressPage() {
  const { errorMessage, submitForm } = useSubmitForm();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");

  return (
    <>
      <ErrorSummary
        errors={[
          {
            input_id: "email_address",
            errors_list: errorMessage ? [errorMessage] : undefined,
          },
        ]}
      />

      <h1>Confirm your email address</h1>
      <form
        onSubmit={(e) => {
          submitForm(e);
        }}
      >
        <TextInputField
          errors={errorMessage ? [errorMessage] : undefined}
          label="Enter your email address"
          name="email_address"
          width="nhsuk-input--width-full"
        />
        <input type="hidden" name="id" value={id ? id : undefined} />
        <SubmitButton>Continue</SubmitButton>
      </form>
    </>
  );
}
