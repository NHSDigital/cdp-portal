import hasFeatureFlagEnabled from 'app/services/hasFeatureFlagEnabled';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';
import getUserAgreements from 'services/getUserAgreements';

import { SelectAgreementPageContent } from '@/app/_components/SelectAgreementPageContent';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import { FeatureFlags } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

import { getLoggerAndSession } from './shared/logging';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Select agreement - ${whiteLabelValues.acronym}`,
  };
}

export default async function SelectAgreementPage() {
  const { logger, session } = await getLoggerAndSession('SelectAgreementsPage');
  logger.info({ message: `User has successfully signed in.` });

  const inductionFeatureFlagEnabled = await hasFeatureFlagEnabled({
    featureFlagName: FeatureFlags.INDUCTION,
  });

  const { activeAgreements, inductionNeeded, inductionPassed } =
    await getUserAgreements(session.user.email);

  const inductionRedirectTarget = getInductionRedirectTarget({
    inductionFeatureFlagEnabled,
    inductionNeeded,
    inductionPassed,
  });

  if (inductionRedirectTarget) {
    redirect(inductionRedirectTarget);
  }

  if (activeAgreements.length === 1) {
    redirect(`/agreement/${activeAgreements[0].agreement_id}`);
  }

  const whiteLabelValues = getWhiteLabelValues();

  return (
    <SelectAgreementPageContent
      agreements_to_display={activeAgreements}
      whiteLabelValues={whiteLabelValues}
    />
  );
}
