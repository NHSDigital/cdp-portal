import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { CookieNames } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

import ConfirmClient from './_components/confirmClient';
import { createOneUserServerActionNoJS } from './_components/serverActions';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Confirm user details - ${whiteLabelValues.acronym}`,
  };
}

interface ConfirmAddUserPageProps {
  params: Promise<{ agreement_id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const AddUserFormSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  role: z.string(),
  user_id: z.string(),
});

async function getLatestAddedUserFromCookie(agreement_id: string) {
  const add_user_form_cookie = (await cookies()).get(CookieNames.ADD_USER_FORM);
  const user = add_user_form_cookie
    ? parseAndValidateCookie(add_user_form_cookie.value)
    : null;
  if (!user) {
    redirect(`/agreement/${agreement_id}/manage-users/add-user`);
  }

  return user;
}

function parseAndValidateCookie(cookieValue: string) {
  try {
    const obj = JSON.parse(cookieValue);
    const result = AddUserFormSchema.safeParse(obj);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

export default async function AddUserPage({
  params,
  searchParams,
}: ConfirmAddUserPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const latest_added_user_details = await getLatestAddedUserFromCookie(
    resolvedParams.agreement_id,
  );
  const form_id = resolvedSearchParams.form_id;

  if (typeof form_id !== 'string') {
    redirect(`/agreement/${resolvedParams.agreement_id}/manage-users/add-user`);
  }

  const user_to_add = {
    first_name: latest_added_user_details.first_name,
    last_name: latest_added_user_details.last_name,
    email: latest_added_user_details.email,
    role: latest_added_user_details.role,
    user_id: latest_added_user_details.user_id,
  };

  const whiteLabelValues = getWhiteLabelValues();

  return (
    <>
      <ConfirmClient
        latest_user_to_add={user_to_add}
        form_id={form_id}
        agreement_id={resolvedParams.agreement_id}
        createOneUserNoJS={createOneUserServerActionNoJS.bind(
          null,
          resolvedParams.agreement_id,
        )}
        whiteLabelValues={whiteLabelValues}
      />
    </>
  );
}
