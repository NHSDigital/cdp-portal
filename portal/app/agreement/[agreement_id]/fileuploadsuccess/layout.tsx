import IsSDEAgreement from 'helpers/agreementidHelper';
import { getServerSession } from 'next-auth';
import React from 'react';

import Page403 from '@/app/(errors)/403/page';

import hasPermissions from '../../../services/hasPermissions';

interface FileUploadSuccessLayoutProps {
  children: React.ReactNode;
  params: { agreement_id: string };
}

export default async function FileUploadSuccessLayout({
  children,
  params,
}: FileUploadSuccessLayoutProps) {
  const { agreement_id } = params;

  const session = await getServerSession();
  const user_email = session?.user?.email;
  const isSdeAgreement = await IsSDEAgreement(agreement_id);

  if (!user_email || !isSdeAgreement) {
    return <Page403 />;
  }

  const userHasPermission = await hasPermissions({
    permissions_required: ['data_in.upload_file'],
    agreement_id,
    user_email,
  });

  return userHasPermission ? <>{children}</> : <Page403 />;
}
