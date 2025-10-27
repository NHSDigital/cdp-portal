import { getServerSession } from 'next-auth';
import React from 'react';

import Page403 from '@/app/(errors)/403/page';

import hasPermissions from '../../../services/hasPermissions';

interface SwitchAgreementLayoutProps {
  children: React.ReactNode;
  params: { agreement_id: string };
}

export default async function SwitchAgreementLayout({
  children,
  params,
}: SwitchAgreementLayoutProps) {
  const { agreement_id } = params;

  const session = await getServerSession();
  const user_email = session?.user?.email;

  if (!user_email) {
    return <Page403 />;
  }

  const userHasPermission = await hasPermissions({
    permissions_required: ['vdi.open_agreement'],
    agreement_id,
    user_email,
  });

  return userHasPermission ? <>{children}</> : <Page403 />;
}
