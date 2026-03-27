import { Metadata } from 'next';

import { getWhiteLabelValues } from '@/config/whiteLabel';

import DeleteClient from './_components/deleteClient';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Confirm user details - Confirm delete user - ${whiteLabelValues.acronym}`,
  };
}

interface DeleteUserPageProps {
  params: { agreement_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function DeleteUserPage({
  params,
  searchParams,
}: DeleteUserPageProps) {
  const agreement_id = params.agreement_id;
  const form_id = searchParams.form_id;
  const user_id = searchParams.user_id;

  if (typeof form_id !== 'string' || typeof user_id !== 'string') {
    throw new Error('Form ID and user ID must be provided');
  }

  return (
    <div className='nhsuk-grid-row'>
      <div className='nhsuk-grid-column-three-quarters'>
        <DeleteClient
          agreement_id={agreement_id}
          form_id={form_id}
          user_id={user_id}
        />
      </div>
    </div>
  );
}
