import hasPermissions from 'app/services/hasPermissions';
import { getServerSessionErrorIfMissingProperties } from 'app/shared/common';
import { getLogger } from 'helpers/logging/logger';
import { redirect } from 'next/navigation';
import React from 'react';

import { Actions } from '@/config/constants';

const rootLogger = getLogger('changeRoleLayout');

interface ChangeRoleLayoutProps {
  children: React.ReactNode;
  params: { agreement_id: string; user: string };
}

export default async function ChangeRoleLayout({
  children,
  params,
}: ChangeRoleLayoutProps) {
  const { agreement_id, user } = params;
  const user_to_change = decodeURIComponent(user);

  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const user_email = session.user.email;

  const userHasPermission = await hasPermissions({
    permissions_required: Actions.CHANGE_USER_ROLE,
    agreement_id: agreement_id,
    user_email: user_email,
    target_user: user_to_change,
  });

  if (!userHasPermission) {
    redirect('/403');
  }

  return <>{children}</>;
}
