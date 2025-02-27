"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_MANAGEMENT_FEATURE_FLAG } from "app/agreement/[agreement_id]/manage-users/consts";
import hasFeatureFlagEnabled from "app/services/hasFeatureFlagEnabled";
import { z } from "zod";
import getUsersInAgreement from "app/services/getUsersInAgreement";

const AddUserSchema = z
  .object({
    first_name: z
      .string({
        invalid_type_error: "First name must be a string",
      })
      .min(1, { message: "Enter a first name" })
      .max(30, { message: "First name must be less than 30 characters" })
      .regex(
        /^[a-zA-Z' -]*$/,
        "First name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')"
      )
      .trim(),
    last_name: z
      .string({
        invalid_type_error: "Last name must be a string",
      })
      .min(1, { message: "Enter a last name" })
      .max(30, { message: "Last name must be less than 30 characters" })
      .regex(
        /^[a-zA-Z' -]*$/,
        "Last name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')"
      )
      .trim(),
    email: z
      .string({
        invalid_type_error: "Email must be a string",
      })
      .toLowerCase()
      .trim()
      .min(1, { message: "Enter an email address" })
      .max(100, { message: "Email must be less than 100 characters" })
      .refine(
        (v) => {
          const error_message = validateEmail(v);
          const is_valid = error_message ? false : true;
          return !v || is_valid; // use !v so if no input we dont display 2 error messages
        },
        (v) => {
          return { message: validateEmail(v) };
        }
      ),
    email_confirm: z
      .string({
        invalid_type_error: "Email must be a string",
      })
      .toLowerCase()
      .trim()
      .min(1, { message: "Enter an email address" })
      .max(100, { message: "Email must be less than 100 characters" })
      .refine(
        (v) => {
          const error_message = validateEmail(v);
          const is_valid = error_message ? false : true;
          return !v || is_valid; // use !v so if no input we dont display 2 error messages
        },
        (v) => {
          return { message: validateEmail(v) };
        }
      ),
    // role selector returns null when not selected, so if null return error message
    role: z.string({ invalid_type_error: "Select a role" }),
  })
  // verify that both the emails are matching, add error messages to both if not
  .superRefine(({ email, email_confirm }, ctx) => {
    if (email !== email_confirm) {
      ctx.addIssue({
        code: "custom",
        message: "Your email addresses must match",
        path: ["email_confirm"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Your email addresses must match",
        path: ["email"],
      });
    }
  });

export default async function submitAddUserForm(
  agreement_id: string,
  form_id: string,
  user_id: string,
  prevState: any,
  formData: FormData
) {
  // Check feature flag
  const hasfeatureEnabled = await hasFeatureFlagEnabled({
    featureFlagName: USER_MANAGEMENT_FEATURE_FLAG,
  });
  if (!hasfeatureEnabled) throw new Error("This feature is disabled");

  // Validate the form fields
  const validatedFields = AddUserSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    email_confirm: formData.get("email_confirm"),
    role: formData.get("role"),
  });

  // return any errors
  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    return {
      errors,
    };
  }

  const { users } = await getUsersInAgreement(agreement_id);
  const user_email_already_exists = users.some(
    ({ email }) => email == validatedFields.data.email
  );
  if (user_email_already_exists) {
    return {
      errors: {
        email: ["This user already exists"],
        email_confirm: ["This user already exists"],
      },
    };
  }

  // Set the form data in the cookies
  // As we can't pass the form data to the page
  const keysToKeep = ["first_name", "last_name", "email", "role"];
  const objectToKeep = Object.fromEntries(
    keysToKeep.map((key) => [key, validatedFields.data[key] || "ERROR"])
  );
  objectToKeep.user_id = user_id;

  cookies().set("add_user_form", JSON.stringify(objectToKeep), {
    secure: true,
  });

  redirect(
    `/agreement/${agreement_id}/manage-users/add-user/confirm?form_id=${form_id}`
  );
}

function validateEmail(email: string): string | undefined {
  const username = email.split("@")[0];
  const domain = email.split("@")[1];

  // basic zod validation
  if (!z.string().email().safeParse(email).success) {
    // perform additional tests here as can generate a more specific error message
    const error_message = validateEmailGitlab(email);

    return error_message
      ? error_message
      : "Enter an email address in the correct format like, name@example.com";
  }

  if (username.length > 64)
    return "First part of your email address must be 64 characters or less";
  if (domain.length > 64)
    return "Last part of your email address must be 64 characters or less";

  // validate for gitlab
  const error_message = validateEmailGitlab(email);
  if (error_message) return error_message;

  // no validation errors
  return undefined;
}

function validateEmailGitlab(email: string): string | undefined {
  const username = email.split("@")[0];

  // Gitlab -> username can only contain letters, digits, '_', '-', '.'
  const only_letters_digits_certain_specials = new RegExp(
    "^[a-zA-Z0-9@._+-]*$"
  );
  if (!only_letters_digits_certain_specials.test(email))
    return "Your email can only contain letters, digits, underscore, hyphen, full stop and the @ symbol";

  // GitLab -> username must not start with a special character
  const not_start_with_special_character = new RegExp("^[a-zA-Z0-9].*");
  if (!not_start_with_special_character.test(email))
    return "Your email must not start with a special character";

  // GitLab -> username must not end with a special character
  const only_end_in_char_or_digit = new RegExp(".*[a-zA-Z0-9]$");
  if (!only_end_in_char_or_digit.test(username))
    return "The first part of your email must not end with a special character";

  // GitLab -> must not contain consecutive special characters
  const no_consecutive_specials = new RegExp("^(?!.*[^a-zA-Z0-9]{2}).*$");
  if (!no_consecutive_specials.test(username))
    return "Your email may not contain consecutive special characters";

  // GitLab -> Cannot end in '.', '.git' or '.atom'.
  const not_end_in_certain_substrings = new RegExp(
    "^(?!.*(\\.git|\\.atom|\\.)$).*"
  );
  if (!not_end_in_certain_substrings.test(email))
    return "Your email cannot end with '.' , '.git' or '.atom'";

  // no validation errors
  return undefined;
}
