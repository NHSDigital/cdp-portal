'use server';

import getUsersInAgreement from 'app/services/getUsersInAgreement';
import hasFeatureFlagEnabled from 'app/services/hasFeatureFlagEnabled';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AddUserSchema } from '@/app/agreement/[agreement_id]/manage-users/add-user/_components/addUserSchema';
import { CookieNames, FeatureFlags } from '@/config/constants';

export default async function submitAddUserForm(
  agreement_id: string,
  form_id: string,
  user_id: string,
  _prevState: Record<string, unknown>,
  formData: FormData,
) {
  // Check feature flag
  const hasfeatureEnabled = await hasFeatureFlagEnabled({
    featureFlagName: FeatureFlags.USER_MANAGEMENT,
  });
  if (!hasfeatureEnabled) throw new Error('This feature is disabled');

  // Validate the form fields
  const validatedFields = AddUserSchema.safeParse({
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    email_confirm: formData.get('email_confirm'),
    role: formData.get('role'),
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
    ({ email }) => email == validatedFields.data.email,
  );
  if (user_email_already_exists) {
    return {
      errors: {
        email: ['This user already exists'],
        email_confirm: ['This user already exists'],
      },
    };
  }

  // Set the form data in the cookies
  // As we can't pass the form data to the page
  const keysToKeep = ['first_name', 'last_name', 'email', 'role'];
  const objectToKeep = Object.fromEntries(
    keysToKeep.map((key) => [key, validatedFields.data[key] || 'ERROR']),
  );
  objectToKeep.user_id = user_id;

  (await cookies()).set(
    CookieNames.ADD_USER_FORM,
    JSON.stringify(objectToKeep),
    {
      secure: true,
    },
  );

  redirect(
    `/agreement/${agreement_id}/manage-users/add-user/confirm?form_id=${form_id}`,
  );
}
