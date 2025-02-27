"use server";

import callLambdaWithFullErrorChecking from "app/shared/callLambda";
import { getLogger } from "helpers/logging/logger";
import { z } from "zod";

const LOG = getLogger("SetUpPassword ServerActions");

const NewPasswordSchema = z.object({
  enter_password: z
    .string({
      invalid_type_error: "Email must be a string",
      required_error: "Password is required",
    })
    .trim()
    .min(12, { message: "Password must have 12 characters or more" })
    .regex(/[a-z]/, "Password must have at least one lowercase letter")
    .regex(/[A-Z]/, "Password must have at least one uppercase letter")
    .regex(/[0-9]/, "Password must have at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    )
    .regex(/^(?!.*(.)\1).*$/, "Password cannot have repeating characters"),
});

export type invokeSetUpPasswordType = {
  errors?: {
    enter_password?: string[];
    confirm_password?: string[];
  };
};

export async function invokeSetUpPassword(
  previousFormState: invokeSetUpPasswordType,
  formData: FormData
): Promise<invokeSetUpPasswordType> {
  const enter_password = formData.get("enter_password") as string;
  const confirm_password = formData.get("confirm_password") as string;

  if (enter_password != confirm_password) {
    return {
      errors: {
        confirm_password: ["Passwords must match"],
      },
    };
  }

  const inputValidation = NewPasswordSchema.safeParse({
    enter_password,
  });

  if (!inputValidation.success) {
    const errors = inputValidation.error.flatten().fieldErrors;
    return {
      errors,
    };
  }

  return {};
}

export async function verifyEmailAndGUID(user_email: string, guid: string) {
  const response = await callLambdaWithFullErrorChecking({
    function_name: process.env.USER_PASSWORD_SETUP_SERVICE_ARN as string,
    raw_payload: {
      event_type: "verify_email_address",
      user_email,
      guid,
    },
    logger: LOG,
    log_result: true,
  });
  const responseBody = JSON.parse(response.body);

  if (!responseBody.valid_guid || !responseBody.valid_email) {
    return false;
  }

  return true;
}
