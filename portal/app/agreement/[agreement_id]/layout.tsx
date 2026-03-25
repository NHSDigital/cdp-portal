import { redirect } from 'next/navigation';
import React from 'react';

import { getServerSessionErrorIfMissingProperties } from '@/app/shared/common';
import { getLogger } from '@/helpers/logging/logger';

import getUserAgreements from '../../../services/getUserAgreements';
const rootLogger = getLogger('AgreementLayout');

interface AgreementLayoutProps {
  children: React.ReactNode;
  params: Promise<{ agreement_id: string }>;
}

export default async function AgreementLayout({
  children,
  params,
}: AgreementLayoutProps) {
  const { agreement_id } = await params;

  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const user_email = session.user.email;

  const { activeAgreements } = await getUserAgreements(user_email);

  const isUserEnabledInAgreement = activeAgreements.some(
    (agreement) => agreement.agreement_id === agreement_id,
  );

  if (!isUserEnabledInAgreement) {
    redirect('/401');
  }

  return <>{children}</>;
}
