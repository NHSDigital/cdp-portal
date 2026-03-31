import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import React from 'react';

import Page403 from '@/app/(errors)/403/page';
import hasFeatureFlagEnabled from '@/app/services/hasFeatureFlagEnabled';
import hasPermissions from '@/app/services/hasPermissions';
import { Actions } from '@/config/constants';
import { FeatureFlags } from '@/config/constants';

interface ManageUsersLayoutProps {
  children: React.ReactNode;
  params: Promise<{ agreement_id: string }>;
}

export default async function ManageUsersLayout({
  children,
  params,
}: ManageUsersLayoutProps) {
  const { agreement_id } = await params;

  const hasfeatureEnabled = await hasFeatureFlagEnabled({
    featureFlagName: FeatureFlags.USER_MANAGEMENT,
  });

  if (!hasfeatureEnabled) return notFound();

  const session = await getServerSession();
  const user_email = session?.user?.email;
  let userHasPermission;
  if (user_email) {
    userHasPermission = await hasPermissions({
      permissions_required: Actions.GET_AGREEMENT_USERS,
      agreement_id: agreement_id,
      user_email: user_email,
    });
  } else {
    userHasPermission = false;
  }

  return userHasPermission ? <>{children}</> : <Page403 />;
}
