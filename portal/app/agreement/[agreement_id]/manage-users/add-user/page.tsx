import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import AddUserForm from '@/app/agreement/[agreement_id]/manage-users/add-user/_components/addUserForm';
import submitAddUserForm from '@/app/agreement/[agreement_id]/manage-users/add-user/_components/submitAddUserForm';
import { createRandomId } from '@/app/shared/createRandomId';
import { getWhiteLabelValues } from '@/config/whiteLabel';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Add a new user - ${whiteLabelValues.acronym}`,
  };
}

interface AddUserPageProps {
  params: Promise<{ agreement_id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AddUserPage({
  params,
  searchParams,
}: AddUserPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  let form_id = resolvedSearchParams.form_id;
  let user_id = resolvedSearchParams.user_id;

  if (typeof form_id !== 'string' || typeof user_id !== 'string') {
    form_id = typeof form_id === 'string' ? form_id : createRandomId();
    user_id = typeof user_id === 'string' ? user_id : createRandomId();

    redirect(
      `/agreement/${resolvedParams.agreement_id}/manage-users/add-user?form_id=${form_id}&user_id=${user_id}`,
    );
  }

  let addUserAction = submitAddUserForm.bind(null, resolvedParams.agreement_id);
  addUserAction = addUserAction.bind(null, form_id);
  addUserAction = addUserAction.bind(null, user_id);

  const whiteLabelValues = getWhiteLabelValues();
  return (
    <AddUserForm
      agreement_id={resolvedParams.agreement_id}
      addUserAction={addUserAction}
      form_id={form_id}
      user_id={user_id}
      whiteLabelValues={whiteLabelValues}
    />
  );
}
