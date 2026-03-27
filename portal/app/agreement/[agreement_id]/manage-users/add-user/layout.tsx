import { getServerSessionErrorIfMissingProperties } from 'app/shared/common';
import { getLogger } from 'helpers/logging/logger';
import { redirect } from 'next/navigation';
import React from 'react';

import hasPermissions from '@/app/services/hasPermissions';
import { Actions } from '@/config/constants';

const rootLogger = getLogger('addUserLayout');

interface AddUserLayoutProps {
  children: React.ReactNode;
  params: { agreement_id: string };
}

export default async function AddUserLayout({
  children,
  params,
}: AddUserLayoutProps) {
  const { agreement_id } = params;

  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const user_email = session.user.email;

  const userHasPermission = await hasPermissions({
    permissions_required: Actions.ADD_NEW_USER,
    agreement_id: agreement_id,
    user_email: user_email,
    target_user: 'NOT_YET_KNOWN', // special value check for permission before the user email we're trying to add has been input
  });

  if (!userHasPermission) {
    redirect('/403');
  }

  return <>{children}</>;
}
