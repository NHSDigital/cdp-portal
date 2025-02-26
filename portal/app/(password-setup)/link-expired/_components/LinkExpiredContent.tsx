"use client";

import SubmitButton from "app/shared/submitButtonClient";
import React from "react";
import { useFormState } from "react-dom";
import { invokeResendEmail, invokeResendEmailType } from "./serverActions";
import { getLogger } from "helpers/logging/logger";
import SuccessBanner from "app/_components/SuccessBanner";

const LOG = getLogger("LinkExpiredPage");

const initialFormState: invokeResendEmailType = {
  success: false,
};

export default function LinkExpiredContent({ email }: { email: string }) {
  const [formState, formAction] = useFormState(
    invokeResendEmail,
    initialFormState
  );

  return (
    <>
      {formState.success && (
        <SuccessBanner
          data-cy="success-banner"
          successMessage={"Your email has been resent"}
        />
      )}
      <h1>Setup link expired</h1>
      <p>The link to set up your account has expired.</p>
      <p>
        You can request a new link. The link in the email will be valid for 24
        hours.
      </p>
      <p>
        If you&apos;re seeing this message in error, contact support at{" "}
        <a href="mailto:ssd.nationalservicedesk@nhs.net" target="_blank">
          ssd.nationalservicedesk@nhs.net
        </a>{" "}
        or call 0300 303 5035.
      </p>
      <form action={formAction}>
        <input type="hidden" name="email" value={email} />
        <SubmitButton>Request a new link</SubmitButton>
      </form>
    </>
  );
}
