import hasFeatureFlagEnabled from 'app/services/hasFeatureFlagEnabled';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';
import getUserAgreements from 'services/getUserAgreements';

import { INDUCTION_FEATURE_FLAG } from './induction/consts';
import SelectAgreementPageClient from './pageClient';
import { getLoggerAndSession } from './shared/logging';

export const metadata: Metadata = {
  title: 'Home - Select Agreement - NHS Secure Data Environment',
};

export default async function SelectAgreementPage() {
  const { logger, session } = await getLoggerAndSession('SelectAgreementsPage');
  logger.info({ message: `User has successfully signed in.` });

  const inductionFeatureFlagEnabled = await hasFeatureFlagEnabled({
    featureFlagName: INDUCTION_FEATURE_FLAG,
  });

  const { activeAgreements, inductionNeeded, inductionPassed } =
    await getUserAgreements(session.user.email);

  if (inductionFeatureFlagEnabled && inductionNeeded && !inductionPassed) {
    redirect('/induction');
  }

  if (activeAgreements.length === 1) {
    redirect(`/agreement/${activeAgreements[0].agreement_id}`);
  }

  return <SelectAgreementPageClient agreements_to_display={activeAgreements} />;
}
