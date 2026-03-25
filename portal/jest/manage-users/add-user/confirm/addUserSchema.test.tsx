import { AddUserSchema } from '@/app/agreement/[agreement_id]/manage-users/add-user/_components/addUserSchema';

describe('AddUserSchema tests', () => {
  it('returns success when all fields are valid', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(true);
    expect(validatedFields.error).toBeUndefined();
  });

  it('returns validation error if first name is not a string', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 123,
      last_name: 'Brown',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'first_name',
    );
    expect(zod_error?.message).toBe('First name must be a string');
  });

  it('returns error if first name is empty string', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: '',
      last_name: 'Brown',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'first_name',
    );
    expect(zod_error?.message).toBe('Enter a first name');
  });

  it('returns error if first name is over 30 characters', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlieeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      last_name: 'Brown',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'first_name',
    );
    expect(zod_error?.message).toBe(
      'First name must be less than 30 characters',
    );
  });

  it('returns error if first name contains invalid characters', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Ch^rlie',
      last_name: 'Brown',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'first_name',
    );
    expect(zod_error?.message).toBe(
      "First name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')",
    );
  });

  it('trims whitespace from first name', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: '  Charlie  ',
      last_name: 'Brown',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(true);
    expect(validatedFields.data?.first_name).toBe('Charlie');
  });

  it('returns validation error if last name is not a string', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 123,
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'last_name',
    );
    expect(zod_error?.message).toBe('Last name must be a string');
  });

  it('returns error if last name is empty string', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: '',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'last_name',
    );
    expect(zod_error?.message).toBe('Enter a last name');
  });

  it('returns error if last name is over 30 characters', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Browwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwn',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'last_name',
    );
    expect(zod_error?.message).toBe(
      'Last name must be less than 30 characters',
    );
  });

  it('returns error if last name contains invalid characters', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Br&wn',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'last_name',
    );
    expect(zod_error?.message).toBe(
      "Last name must only contain letters A to Z, as well as hyphens (-) and apostrophes (')",
    );
  });

  it('trims whitespace from last name', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: '  Brown  ',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(true);
    expect(validatedFields.data?.last_name).toBe('Brown');
  });

  it('returns validation error if email is not a string', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 123,
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe('Email must be a string');
  });

  it('trims whitespace from email', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: '  Brown  ',
      email: '  charlie.brown@test.com  ',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(true);
    expect(validatedFields.data?.last_name).toBe('Brown');
  });

  it('returns error if email is empty string', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: '',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe('Enter an email address');
  });

  it('returns error if email is more than 100 characters', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email:
        'charliebrowncharliebrowncharliebrowncharliebrowncharliebrown123@verylongdomainnamethatisstillvalidbutverylong.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe('Email must be less than 100 characters');
  });

  it('returns error if email contains invalid characters for gitlab', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charli$.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe(
      'Your email can only contain letters, digits, underscore, hyphen, full stop and the @ symbol',
    );
  });

  it('returns error if email starts with a special character', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: '.charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe(
      'Your email must not start with a special character',
    );
  });

  it('returns error if email ends with a special character', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie.brown.@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe(
      'The first part of your email must not end with a special character',
    );
  });

  it('returns error if email contains consecutive special characters', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie..brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe(
      'Your email may not contain consecutive special characters',
    );
  });

  it('returns error if email ends with a banned substring', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie.brown@test.atom',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe(
      "Your email cannot end with '.' , '.git' or '.atom'",
    );
  });

  it('returns error if email fails basic zod validation', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie.browntest.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe(
      'Enter an email address in the correct format like, name@example.com',
    );
  });

  it('returns error if first part of email is more than 64 characters', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email:
        'charlie.browncharlie.browncharlie.browncharlie.browncharlie.browncharlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe(
      'First part of your email address must be 64 characters or less',
    );
  });

  it('returns error if last part of email is more than 64 characters', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email:
        'charlie.brown@testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttest.com',
      email_confirm: 'charlie.brown@test.com',
      role: 'analyst',
    });
    console.log(validatedFields);

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    expect(zod_error?.message).toBe(
      'Last part of your email address must be 64 characters or less',
    );
  });

  it('validates email_confirm field', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie.brown@test.com',
      email_confirm: 123,
      role: 'analyst',
    });

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email_confirm',
    );
    expect(zod_error?.message).toBe('Email must be a string');
  });

  it('returns error if role is invalid type', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlie.brown@test.com',
      role: 123,
    });

    expect(validatedFields.success).toBe(false);
    const zod_error = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'role',
    );
    expect(zod_error?.message).toBe('Select a role');
  });

  it('returns errors if both emails do not match', () => {
    const validatedFields = AddUserSchema.safeParse({
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie.brown@test.com',
      email_confirm: 'charlieeeee.brown@test.com',
      role: 'analyst',
    });

    expect(validatedFields.success).toBe(false);

    console.log(validatedFields.error?.issues);
    const zod_error_email = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email',
    );
    const zod_error_confirm_email = validatedFields.error?.issues.find(
      (issue) => issue.path[0] === 'email_confirm',
    );
    const expected_string = 'Your email addresses must match';
    expect(zod_error_email?.message).toBe(expected_string);
    expect(zod_error_confirm_email?.message).toBe(expected_string);
  });
});
