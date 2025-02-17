import { getLogger } from "helpers/logging/logger";
import { FormEvent, useState } from "react";
import { z } from "zod";
import callUserPasswordSetupService from "./serverActions";
import { useAsyncError } from "helpers/errorHelpers";
import { redirect, useRouter } from "next/navigation";

const LOG = getLogger("ConfirmEmailAddress SubmitForm");

const ConfirmEmailSchema = z.object({
  email: z
    .string({ invalid_type_error: "Email must be a string" })
    .trim()
    .toLowerCase()
    .min(1, { message: "Enter your email address" })
    .email("This is not a valid email."),
});

export default function useSubmitForm() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const router = useRouter();
  const throwAsyncError = useAsyncError();

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      const form_data = new FormData(event.currentTarget);

      const email = form_data.get("email_address") as string;
      const inputValidation = ConfirmEmailSchema.safeParse({
        email: email,
      });

      const id = form_data.get("id") as string;
      if (!id) {
        throw new Error("Missing id");
      }

      if (!inputValidation.success) {
        LOG.error("Invalid email address");
        setErrorMessage(inputValidation.error.format().email?._errors[0]);
        return;
      } else {
        setErrorMessage(undefined);
      }

      const resultJson = await callUserPasswordSetupService(email, id);

      if (!resultJson.valid_email || !resultJson.valid_guid) {
        setErrorMessage("Enter the email address used to set up your account");
      } else {
        router.push("/set-up-password");
      }
    } catch (error) {
      LOG.error(`Failed calling user password setup service`, {
        error,
      });
      throwAsyncError(`Failed calling user password setup service ${error}`);
    }
  }

  return {
    errorMessage,
    submitForm,
  };
}
