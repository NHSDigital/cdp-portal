"use server";

import callLambdaWithFullErrorChecking from "app/shared/callLambda";
import { getLogger } from "helpers/logging/logger";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CookieNames } from "types/enums";
import { z } from "zod";

const LOG = getLogger("ConfirmEmailAddress SubmitForm");

const ConfirmEmailSchema = z.object({
  email: z
    .string({ invalid_type_error: "Email must be a string" })
    .trim()
    .toLowerCase()
    .min(1, { message: "Enter your email address" })
    .email("This is not a valid email."),
});

export type invokeVerifyEmailAddressType = {
  error?: string;
};

export async function invokeVerifyEmailAddress(
  previousFormState: invokeVerifyEmailAddressType,
  formData: FormData
): Promise<invokeVerifyEmailAddressType> {
  const email = formData.get("email_address") as string;
  const id = formData.get("id") as string;

  const inputValidation = ConfirmEmailSchema.safeParse({
    email: email,
  });

  if (!inputValidation.success) {
    return {
      error: inputValidation.error.format().email!._errors[0],
    };
  }

  const response = await callLambdaWithFullErrorChecking({
    function_name: process.env.USER_PASSWORD_SETUP_SERVICE_ARN as string,
    raw_payload: {
      event_type: "verify_email_address",
      user_email: email,
      guid: id,
    },
    logger: LOG,
    log_result: true,
  });
  const responseBody = JSON.parse(response.body);

  if (responseBody.valid_email == true && responseBody.valid_guid == true) {
    cookies().set(CookieNames.CONFIRMED_EMAIL, inputValidation.data.email, {
      secure: true,
      maxAge: 300, // 5 minutes
    });
    redirect(`/set-up-password?id=${id}`);
  }

  if (
    !responseBody.valid_guid &&
    responseBody.message == "The provided guid has expired"
  ) {
    cookies().set(CookieNames.CONFIRMED_EMAIL, inputValidation.data.email, {
      secure: true,
      maxAge: 300, // 5 minutes
    });
    redirect(`/link-expired`);
  }

  return {
    error: "Enter the email address used to set up your account",
  };
}
