import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';

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
  params: { agreement_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AddUserPage({
  params,
  searchParams,
}: AddUserPageProps) {
  let form_id = searchParams.form_id;
  let user_id = searchParams.user_id;

  if (typeof form_id !== 'string' || typeof user_id !== 'string') {
    form_id = typeof form_id === 'string' ? form_id : createRandomId();
    user_id = typeof user_id === 'string' ? user_id : createRandomId();

    redirect(
      `/agreement/${params.agreement_id}/manage-users/add-user?form_id=${form_id}&user_id=${user_id}`,
    );
  }

  let addUserAction = submitAddUserForm.bind(null, params.agreement_id);
  addUserAction = addUserAction.bind(null, form_id);
  addUserAction = addUserAction.bind(null, user_id);

  const whiteLabelValues = getWhiteLabelValues();
  return (
    <AddUserForm
      agreement_id={params.agreement_id}
      addUserAction={addUserAction}
      form_id={form_id}
      user_id={user_id}
      whiteLabelValues={whiteLabelValues}
    />
  );
}
