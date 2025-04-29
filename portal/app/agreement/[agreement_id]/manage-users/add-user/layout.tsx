import { getServerSessionErrorIfMissingProperties } from 'app/shared/common';
import { getLogger } from 'helpers/logging/logger';
import React from 'react';

import Page403 from '../../../../403';
import hasPermissions from '../../../../services/hasPermissions';
import { ADDING_USER_PERMISSIONS_REQUIRED } from '../consts';

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
    permissions_required: ADDING_USER_PERMISSIONS_REQUIRED,
    agreement_id: agreement_id,
    user_email: user_email,
    target_user: 'NOT_YET_KNOWN', // special value check for permission before the user email we're trying to add has been input
  });

  return userHasPermission ? <>{children}</> : <Page403 />;
}
