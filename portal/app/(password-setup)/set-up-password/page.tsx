import { getLogger } from 'helpers/logging/logger';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import { CookieNames } from 'types/enums';

import { verifyEmailAndGUID } from './_components/serverActions';
import SetUpPasswordContent from './_components/SetUpPasswordContent';

const LOG = getLogger('SetUpPasswordPage');

export const metadata: Metadata = {
  title: 'Set up password',
};

interface SetUpPasswordPageProps {
  searchParams: { id?: string };
}

export default async function SetUpPasswordPage({
  searchParams: { id },
}: SetUpPasswordPageProps) {
  const email = cookies().get(CookieNames.CONFIRMED_EMAIL)?.value;
  if (!email || !id) {
    redirect('/');
  }

  // checks again to ensure user has reached page legitimatley
  const isValid = await verifyEmailAndGUID(email, id);
  if (!isValid) {
    LOG.warn(
      { user_email: email, guid: id },
      'User tried to access set-up-password page with invalid email or guid',
    );
    redirect('/');
  }

  return <SetUpPasswordContent user_email={email} guid={id} />;
}
