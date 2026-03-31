import { z } from 'zod';

const EmailFieldSchema = z
  .string({
    invalid_type_error: 'Email must be a string',
  })
  .toLowerCase()
  .trim()
  .min(1, { message: 'Enter an email address' })
  .max(100, { message: 'Email must be less than 100 characters' })
  .refine(
    (v) => {
      const error_message = validateEmail(v);
      const is_valid = error_message ? false : true;
      return !v || is_valid;
    },
    (v) => {
      return { message: validateEmail(v) };
    },
  );

export const AddUserSchema = z
  .object({
    first_name: z
      .string({
        invalid_type_error: 'First name must be a string',
      })
      .min(1, { message: 'Enter a first name' })
      .max(30, { message: 'First name must be less than 30 characters' })
      .regex(
        /^[a-zA-Z' -]*$/,
        "First name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')",
      )
      .trim(),
    last_name: z
      .string({
        invalid_type_error: 'Last name must be a string',
      })
      .min(1, { message: 'Enter a last name' })
      .max(30, { message: 'Last name must be less than 30 characters' })
      .regex(
        /^[a-zA-Z' -]*$/,
        "Last name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')",
      )
      .trim(),
    email: EmailFieldSchema,
    email_confirm: EmailFieldSchema,
    role: z.string({ invalid_type_error: 'Select a role' }),
  })
  // verify that both the emails are matching, add error messages to both if not
  .superRefine(({ email, email_confirm }, ctx) => {
    if (email !== email_confirm) {
      ctx.addIssue({
        code: 'custom',
        message: 'Your email addresses must match',
        path: ['email_confirm'],
      });
      ctx.addIssue({
        code: 'custom',
        message: 'Your email addresses must match',
        path: ['email'],
      });
    }
  });

function validateEmail(email: string): string | undefined {
  const username = email.split('@')[0];
  const domain = email.split('@')[1];

  // basic zod validation
  if (!z.string().email().safeParse(email).success) {
    // perform additional tests here as can generate a more specific error message
    const error_message = validateEmailGitlab(email);

    return error_message
      ? error_message
      : 'Enter an email address in the correct format like, name@example.com';
  }

  if (username.length > 64)
    return 'First part of your email address must be 64 characters or less';
  if (domain.length > 64)
    return 'Last part of your email address must be 64 characters or less';

  // validate for gitlab
  const error_message = validateEmailGitlab(email);
  if (error_message) return error_message;

  // no validation errors
  return undefined;
}

function validateEmailGitlab(email: string): string | undefined {
  const username = email.split('@')[0];

  // Gitlab -> username can only contain letters, digits, '_', '-', '.'
  const only_letters_digits_certain_specials = new RegExp(
    '^[a-zA-Z0-9@._+-]*$',
  );
  if (!only_letters_digits_certain_specials.test(email))
    return 'Your email can only contain letters, digits, underscore, hyphen, full stop and the @ symbol';

  // GitLab -> username must not start with a special character
  const not_start_with_special_character = new RegExp('^[a-zA-Z0-9].*');
  if (!not_start_with_special_character.test(email))
    return 'Your email must not start with a special character';

  // GitLab -> username must not end with a special character
  const only_end_in_char_or_digit = new RegExp('.*[a-zA-Z0-9]$');
  if (!only_end_in_char_or_digit.test(username))
    return 'The first part of your email must not end with a special character';

  // GitLab -> must not contain consecutive special characters
  const no_consecutive_specials = new RegExp('^(?!.*[^a-zA-Z0-9]{2}).*$');
  if (!no_consecutive_specials.test(username))
    return 'Your email may not contain consecutive special characters';

  // GitLab -> Cannot end in '.', '.git' or '.atom'.
  const not_end_in_certain_substrings = new RegExp(
    '^(?!.*(\\.git|\\.atom|\\.)$).*',
  );
  if (!not_end_in_certain_substrings.test(email))
    return "Your email cannot end with '.' , '.git' or '.atom'";

  // no validation errors
  return undefined;
}
